import { NextResponse } from "next/server";
import { requireAdmin, requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { getAllDestinations, createDestination } from "@/lib/destination-service";
import { findInvalidStringFields, isRecord } from "@/lib/validation";
import type { Destination } from "@/types";

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const destinations = await getAllDestinations();
    return NextResponse.json({ destinations });
  } catch (error) {
    console.error("Failed to fetch destinations:", error);
    return NextResponse.json({ error: "Failed to fetch destinations" }, { status: 500 });
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

    const missing = findInvalidStringFields(body, ["name", "country", "description", "image"]);
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

    if (typeof body.priceFrom !== "number" || body.priceFrom < 0) {
      return NextResponse.json(
        { error: "Price must be a non-negative number" },
        { status: 400 }
      );
    }

    // Id is omitted on create: the database generates the UUID and clients
    // cannot choose primary keys (admin UI also sends id: undefined on create).
    const dest = {
      name: String(body.name).slice(0, 300),
      country: String(body.country).slice(0, 200),
      description: String(body.description).slice(0, 5000),
      image: String(body.image).slice(0, 2000),
      rating: body.rating,
      priceFrom: body.priceFrom,
      tags: Array.isArray(body.tags) ? body.tags.filter((t: unknown) => typeof t === "string").slice(0, 30) : [],
    } as Destination;

    const created = await createDestination(dest);
    await logAdminAction(request, auth, {
      action: "create",
      resource: "destination",
      resourceId: created.id,
      metadata: { name: created.name },
    });
    return NextResponse.json({ destination: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to create destination:", error);
    return NextResponse.json({ error: "Failed to create destination" }, { status: 500 });
  }
}
