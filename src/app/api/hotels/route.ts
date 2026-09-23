import { NextResponse } from "next/server";
import { requireAdmin, requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { getAllHotels, createHotel } from "@/lib/hotel-service";
import { findInvalidStringFields, isRecord } from "@/lib/validation";
import type { Hotel } from "@/types";

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const hotels = await getAllHotels();
    return NextResponse.json({ hotels });
  } catch (error) {
    console.error("Failed to fetch hotels:", error);
    return NextResponse.json({ error: "Failed to fetch hotels" }, { status: 500 });
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

    const missing = findInvalidStringFields(body, ["name", "location", "image"]);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    if (typeof body.rating !== "number" || body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (typeof body.price !== "number" || body.price < 0) {
      return NextResponse.json(
        { error: "Price must be a non-negative number" },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.amenities)) {
      return NextResponse.json(
        { error: "Amenities must be an array" },
        { status: 400 }
      );
    }

    const hotel: Omit<Hotel, "id"> = {
      name: String(body.name).slice(0, 300),
      location: String(body.location).slice(0, 200),
      image: String(body.image).slice(0, 2000),
      rating: body.rating,
      price: body.price,
      amenities: body.amenities.filter((a: unknown) => typeof a === "string").slice(0, 50),
    };

    const created = await createHotel(hotel);
    await logAdminAction(request, auth, {
      action: "create",
      resource: "hotel",
      resourceId: created.id,
      metadata: { name: created.name },
    });
    return NextResponse.json({ hotel: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to create hotel:", error);
    return NextResponse.json({ error: "Failed to create hotel" }, { status: 500 });
  }
}
