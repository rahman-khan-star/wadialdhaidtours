import { NextResponse } from "next/server";
import { requireAdmin, requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { getAllPackages, createPackage } from "@/lib/tour-package-service";
import { findInvalidStringFields, isRecord } from "@/lib/validation";
import type { TourPackage } from "@/types";

const PACKAGE_CATEGORIES: TourPackage["category"][] = ["dubai", "pakistan", "umrah", "visa"];

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const packages = await getAllPackages();
    return NextResponse.json({ packages });
  } catch (error) {
    console.error("Failed to fetch packages:", error);
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 });
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

    const missing = findInvalidStringFields(body, ["title", "destination", "description", "duration", "category"]);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    if (!(PACKAGE_CATEGORIES as string[]).includes(String(body.category))) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    if (typeof body.price !== "number" || body.price < 0) {
      return NextResponse.json(
        { error: "Price must be a non-negative number" },
        { status: 400 }
      );
    }

    if (typeof body.rating !== "number" || body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Id is omitted on create: the database generates the UUID and clients
    // cannot choose primary keys (admin UI also sends id: undefined on create).
    const pkg = {
      title: String(body.title).slice(0, 300),
      destination: String(body.destination).slice(0, 200),
      description: String(body.description).slice(0, 5000),
      image: typeof body.image === "string" ? body.image.slice(0, 2000) : "",
      duration: String(body.duration).slice(0, 100),
      price: body.price,
      originalPrice: typeof body.originalPrice === "number" && body.originalPrice >= 0 ? body.originalPrice : undefined,
      rating: body.rating,
      reviewCount: typeof body.reviewCount === "number" && body.reviewCount >= 0 ? body.reviewCount : 0,
      highlights: Array.isArray(body.highlights) ? body.highlights.filter((h: unknown) => typeof h === "string").slice(0, 50) : [],
      included: Array.isArray(body.included) ? body.included.filter((h: unknown) => typeof h === "string").slice(0, 50) : [],
      category: body.category as TourPackage["category"],
    } as TourPackage;

    const created = await createPackage(pkg);
    await logAdminAction(request, auth, {
      action: "create",
      resource: "package",
      resourceId: created.id,
      metadata: { title: created.title },
    });
    return NextResponse.json({ package: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to create package:", error);
    return NextResponse.json({ error: "Failed to create package" }, { status: 500 });
  }
}
