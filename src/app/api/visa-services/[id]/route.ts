import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import {
  deleteVisaService,
  updateVisaService,
  DuplicateVisaServiceError,
  VisaServiceNotFoundError,
} from "@/lib/visa-service";
import { parseVisaServiceUpdates } from "@/lib/visa-validation";
import { isValidUuid } from "@/lib/validation";

async function readId(params: Promise<{ id: string }>): Promise<string | null> {
  const { id } = await params;
  return id && isValidUuid(id) ? id : null;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const id = await readId(params);
    if (!id) {
      return NextResponse.json({ error: "Invalid visa service id" }, { status: 400 });
    }

    const body: unknown = await request.json().catch(() => null);
    const parsed = parseVisaServiceUpdates(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    // Route id always wins so a payload cannot reassign another record's id.
    const updated = await updateVisaService(id, parsed.value);
    await logAdminAction(request, auth, {
      action: "update",
      resource: "visa_service",
      resourceId: id,
      metadata: { country: updated.country, type: updated.type },
    });
    return NextResponse.json({ visaService: updated });
  } catch (error) {
    if (error instanceof VisaServiceNotFoundError) {
      return NextResponse.json({ error: "Visa service not found" }, { status: 404 });
    }
    if (error instanceof DuplicateVisaServiceError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Failed to update visa service:", error);
    return NextResponse.json(
      { error: "Failed to update visa service" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const id = await readId(params);
    if (!id) {
      return NextResponse.json({ error: "Invalid visa service id" }, { status: 400 });
    }

    await deleteVisaService(id);
    await logAdminAction(request, auth, {
      action: "delete",
      resource: "visa_service",
      resourceId: id,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof VisaServiceNotFoundError) {
      return NextResponse.json({ error: "Visa service not found" }, { status: 404 });
    }
    console.error("Failed to delete visa service:", error);
    return NextResponse.json(
      { error: "Failed to delete visa service" },
      { status: 500 }
    );
  }
}
