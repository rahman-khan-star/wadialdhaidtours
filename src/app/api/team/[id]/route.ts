import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { updateMember, deleteMember } from "@/lib/team-service";
import { isRecord } from "@/lib/validation";
import type { TeamMember } from "@/types";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing team member id" }, { status: 400 });
    }

    const body = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (body.displayOrder !== undefined && (typeof body.displayOrder !== "number" || body.displayOrder < 1)) {
      return NextResponse.json({ error: "Display order must be a positive number" }, { status: 400 });
    }

    if (body.isActive !== undefined && typeof body.isActive !== "boolean") {
      return NextResponse.json({ error: "isActive must be a boolean" }, { status: 400 });
    }

    // Route id always wins so a payload cannot reassign another record's id.
    const updates = { ...body, id } as Partial<TeamMember>;

    const updated = await updateMember(id, updates);
    await logAdminAction(request, auth, {
      action: "update",
      resource: "team_member",
      resourceId: id,
      metadata: typeof updates.isActive === "boolean" ? { isActive: updates.isActive } : undefined,
    });
    return NextResponse.json({ member: updated });
  } catch (error) {
    console.error("Failed to update team member:", error);
    return NextResponse.json({ error: "Failed to update team member" }, { status: 500 });
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
      return NextResponse.json({ error: "Missing team member id" }, { status: 400 });
    }
    await deleteMember(id);
    await logAdminAction(request, auth, {
      action: "delete",
      resource: "team_member",
      resourceId: id,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete team member:", error);
    return NextResponse.json({ error: "Failed to delete team member" }, { status: 500 });
  }
}
