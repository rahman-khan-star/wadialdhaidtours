import { NextResponse } from "next/server";
import { requireAdmin, requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import {
  createVisaService,
  getAllVisaServices,
  DuplicateVisaServiceError,
} from "@/lib/visa-service";
import { parseVisaServicePayload } from "@/lib/visa-validation";

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const visaServices = await getAllVisaServices();
    return NextResponse.json({ visaServices });
  } catch (error) {
    console.error("Failed to fetch visa services:", error);
    return NextResponse.json(
      { error: "Failed to fetch visa services" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseVisaServicePayload(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const created = await createVisaService(parsed.value);
    await logAdminAction(request, auth, {
      action: "create",
      resource: "visa_service",
      resourceId: created.id,
      metadata: { country: created.country, type: created.type },
    });
    return NextResponse.json({ visaService: created }, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateVisaServiceError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Failed to create visa service:", error);
    return NextResponse.json(
      { error: "Failed to create visa service" },
      { status: 500 }
    );
  }
}
