import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { updatePackage, deletePackage } from "@/lib/tour-package-service";
import { isRecord } from "@/lib/validation";
import type { TourPackage } from "@/types";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing package id" }, { status: 400 });
    }

    const body = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Route id always wins so a payload cannot reassign another record's id.
    const updates = { ...body, id } as Partial<TourPackage>;

    if (updates.price !== undefined && (typeof updates.price !== "number" || updates.price < 0)) {
      return NextResponse.json({ error: "Price must be a non-negative number" }, { status: 400 });
    }

    if (updates.rating !== undefined && (typeof updates.rating !== "number" || updates.rating < 1 || updates.rating > 5)) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const updated = await updatePackage(id, updates);
    await logAdminAction(request, auth, {
      action: "update",
      resource: "package",
      resourceId: id,
    });
    return NextResponse.json({ package: updated });
  } catch (error) {
    console.error("Failed to update package:", error);
    return NextResponse.json({ error: "Failed to update package" }, { status: 500 });
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
      return NextResponse.json({ error: "Missing package id" }, { status: 400 });
    }
    await deletePackage(id);
    await logAdminAction(request, auth, {
      action: "delete",
      resource: "package",
      resourceId: id,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete package:", error);
    return NextResponse.json({ error: "Failed to delete package" }, { status: 500 });
  }
}
