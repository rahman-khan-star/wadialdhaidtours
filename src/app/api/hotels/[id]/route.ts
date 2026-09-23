import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { updateHotel, deleteHotel } from "@/lib/hotel-service";
import { isRecord } from "@/lib/validation";
import type { Hotel } from "@/types";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing hotel id" }, { status: 400 });
    }

    const body = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (body.rating !== undefined && (typeof body.rating !== "number" || body.rating < 1 || body.rating > 5)) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    if (body.price !== undefined && (typeof body.price !== "number" || body.price < 0)) {
      return NextResponse.json({ error: "Price must be a non-negative number" }, { status: 400 });
    }

    if (body.amenities !== undefined && !Array.isArray(body.amenities)) {
      return NextResponse.json({ error: "Amenities must be an array" }, { status: 400 });
    }

    // Route id always wins so a payload cannot reassign another record's id.
    const updates = { ...body, id } as Partial<Hotel>;

    const updated = await updateHotel(id, updates);
    await logAdminAction(request, auth, {
      action: "update",
      resource: "hotel",
      resourceId: id,
    });
    return NextResponse.json({ hotel: updated });
  } catch (error) {
    console.error("Failed to update hotel:", error);
    return NextResponse.json({ error: "Failed to update hotel" }, { status: 500 });
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
      return NextResponse.json({ error: "Missing hotel id" }, { status: 400 });
    }
    await deleteHotel(id);
    await logAdminAction(request, auth, {
      action: "delete",
      resource: "hotel",
      resourceId: id,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete hotel:", error);
    return NextResponse.json({ error: "Failed to delete hotel" }, { status: 500 });
  }
}
