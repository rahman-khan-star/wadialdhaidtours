import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getClientIp } from "@/lib/rate-limit";
import { recordActivity, recordLoginHistory } from "@/lib/audit";

export async function POST(request: Request) {
  const session = getAdminSession(request);
  if (session) {
    const ipAddress = getClientIp(request);
    await recordLoginHistory({
      username: session.username,
      status: "logout",
      ipAddress,
      userAgent: request.headers.get("user-agent"),
    });
    await recordActivity({
      action: "logout",
      resource: "auth",
      actor: session.username,
      ipAddress,
    });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("admin_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  // Note: the JWT itself remains valid until expiry; clearing the cookie ends
  // browser access. Add a server-side denylist if revocation is required.
  return response;
}
