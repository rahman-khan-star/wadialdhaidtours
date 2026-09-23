import { NextResponse } from "next/server";
import { requireAdmin, requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { getAllBookings, createBooking } from "@/lib/booking-service";
import { findInvalidStringFields, isRecord } from "@/lib/validation";
import type { Booking } from "@/types";

const BOOKING_STATUSES: Booking["status"][] = ["Confirmed", "Pending"];

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const bookings = await getAllBookings();
    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const missing = findInvalidStringFields(body, ["name", "packageName", "date"]);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    if (typeof body.amount !== "number" || body.amount < 0) {
      return NextResponse.json(
        { error: "Amount must be a non-negative number" },
        { status: 400 }
      );
    }

    const status =
      typeof body.status === "string" && (BOOKING_STATUSES as string[]).includes(body.status)
        ? (body.status as Booking["status"])
        : "Pending";

    const booking: Omit<Booking, "id"> = {
      name: String(body.name).slice(0, 200),
      packageName: String(body.packageName).slice(0, 300),
      date: String(body.date).slice(0, 40),
      amount: body.amount,
      status,
    };

    const created = await createBooking(booking);
    await logAdminAction(request, auth, {
      action: "create",
      resource: "booking",
      resourceId: created.id,
      metadata: { packageName: created.packageName },
    });
    return NextResponse.json({ booking: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to create booking:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
