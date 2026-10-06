import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { deleteFlightRequest, updateFlightRequestStatus } from "@/lib/flight-request-service";
import { isRecord } from "@/lib/validation";
import { FLIGHT_REQUEST_STATUSES, type FlightRequestStatus } from "@/types";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing flight request id" }, { status: 400 });
    }

    const body = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const status = body.status;
    if (typeof status !== "string" || !(FLIGHT_REQUEST_STATUSES as string[]).includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${FLIGHT_REQUEST_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const updated = await updateFlightRequestStatus(id, status as FlightRequestStatus);
    await logAdminAction(request, auth, {
      action: "status_change",
      resource: "flight_request",
      resourceId: id,
      metadata: { status: updated.status, flightNumber: updated.flightNumber },
    });
    return NextResponse.json({ flightRequest: updated });
  } catch (error) {
    console.error("Failed to update flight request:", error);
    return NextResponse.json({ error: "Failed to update flight request" }, { status: 500 });
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
      return NextResponse.json({ error: "Missing flight request id" }, { status: 400 });
    }
    await deleteFlightRequest(id);
    await logAdminAction(request, auth, {
      action: "delete",
      resource: "flight_request",
      resourceId: id,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete flight request:", error);
    return NextResponse.json({ error: "Failed to delete flight request" }, { status: 500 });
  }
}
