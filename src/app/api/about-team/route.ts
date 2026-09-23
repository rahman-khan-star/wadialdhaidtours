import { NextResponse } from "next/server";
import { requireAdmin, requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { getAllAboutTeam, createAboutTeam } from "@/lib/about-team-service";
import { findInvalidStringFields, isRecord } from "@/lib/validation";

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const team = await getAllAboutTeam();
    return NextResponse.json({ team });
  } catch (error) {
    console.error("Failed to fetch about team:", error);
    return NextResponse.json({ error: "Failed to fetch about team" }, { status: 500 });
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

    const missing = findInvalidStringFields(body, ["name", "role", "image"]);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const member = {
      name: String(body.name).slice(0, 200),
      role: String(body.role).slice(0, 200),
      image: String(body.image).slice(0, 2000),
    };

    const created = await createAboutTeam(member);
    await logAdminAction(request, auth, {
      action: "create",
      resource: "about_team",
      resourceId: created.id,
      metadata: { name: created.name },
    });
    return NextResponse.json({ member: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to create about team member:", error);
    return NextResponse.json({ error: "Failed to create about team member" }, { status: 500 });
  }
}
