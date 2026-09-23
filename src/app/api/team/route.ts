import { NextResponse } from "next/server";
import { requireAdmin, requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { getAllMembers, createMember } from "@/lib/team-service";
import { findInvalidStringFields, isRecord } from "@/lib/validation";
import type { TeamMember } from "@/types";

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const members = await getAllMembers();
    return NextResponse.json({ members });
  } catch (error) {
    console.error("Failed to fetch team members:", error);
    return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 });
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

    const missing = findInvalidStringFields(body, ["name", "designation", "photo", "phone", "whatsapp"]);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    if (typeof body.displayOrder !== "number" || body.displayOrder < 1) {
      return NextResponse.json(
        { error: "Display order must be a positive number" },
        { status: 400 }
      );
    }

    const member: Omit<TeamMember, "id"> = {
      name: String(body.name).slice(0, 200),
      designation: String(body.designation).slice(0, 200),
      photo: String(body.photo).slice(0, 2000),
      phone: String(body.phone).slice(0, 50),
      whatsapp: String(body.whatsapp).slice(0, 50),
      description: typeof body.description === "string" ? body.description.slice(0, 2000) : undefined,
      isActive: typeof body.isActive === "boolean" ? body.isActive : true,
      displayOrder: body.displayOrder,
    };

    const created = await createMember(member);
    await logAdminAction(request, auth, {
      action: "create",
      resource: "team_member",
      resourceId: created.id,
      metadata: { name: created.name },
    });
    return NextResponse.json({ member: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to create team member:", error);
    return NextResponse.json({ error: "Failed to create team member" }, { status: 500 });
  }
}
