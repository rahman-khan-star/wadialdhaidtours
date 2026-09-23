import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { updateBooking, deleteBooking, updateBookingStatus } from "@/lib/booking-service";
import { isRecord } from "@/lib/validation";
import type { Booking } from "@/types";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
    }

    const body = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Force the id from the path so clients cannot reassign record ids (IDOR-style).
    const updates = { ...body, id } as Partial<Booking>;

    if (updates.status !== undefined) {
      if (updates.status !== "Confirmed" && updates.status !== "Pending") {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      const updated = await updateBookingStatus(id, updates.status);
      await logAdminAction(request, auth, {
        action: "status_change",
        resource: "booking",
        resourceId: id,
        metadata: { status: updates.status },
      });
      return NextResponse.json({ booking: updated });
    }

    const updated = await updateBooking(id, updates);
    await logAdminAction(request, auth, {
      action: "update",
      resource: "booking",
      resourceId: id,
    });
    return NextResponse.json({ booking: updated });
  } catch (error) {
    console.error("Failed to update booking:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
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
      return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
    }
    await deleteBooking(id);
    await logAdminAction(request, auth, {
      action: "delete",
      resource: "booking",
      resourceId: id,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete booking:", error);
    return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 });
  }
}
