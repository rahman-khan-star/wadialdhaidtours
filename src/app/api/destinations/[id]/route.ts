import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { updateDestination, deleteDestination } from "@/lib/destination-service";
import { isRecord } from "@/lib/validation";
import type { Destination } from "@/types";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing destination id" }, { status: 400 });
    }

    const body = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (body.rating !== undefined && (typeof body.rating !== "number" || body.rating < 1 || body.rating > 5)) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    if (body.priceFrom !== undefined && (typeof body.priceFrom !== "number" || body.priceFrom < 0)) {
      return NextResponse.json({ error: "Price must be a non-negative number" }, { status: 400 });
    }

    // Route id always wins so a payload cannot reassign another record's id.
    const updates = { ...body, id } as Partial<Destination>;

    const updated = await updateDestination(id, updates);
    await logAdminAction(request, auth, {
      action: "update",
      resource: "destination",
      resourceId: id,
    });
    return NextResponse.json({ destination: updated });
  } catch (error) {
    console.error("Failed to update destination:", error);
    return NextResponse.json({ error: "Failed to update destination" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing destination id" }, { status: 400 });
    }
    await deleteDestination(id);
    await logAdminAction(request, auth, {
      action: "delete",
      resource: "destination",
      resourceId: id,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete destination:", error);
    return NextResponse.json({ error: "Failed to delete destination" }, { status: 500 });
  }
}
