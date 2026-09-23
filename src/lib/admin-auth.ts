import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const DEV_FALLBACK_SECRET = "wadi-al-dhaid-tours-dev-only-secret-key";
const JWT_ALGORITHM = "HS256";
const JWT_EXPIRES_IN = "24h";

export type AdminSession = {
  username: string;
  name: string;
  role: string;
};

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 32) return secret;

  if (process.env.NODE_ENV === "production") {
    // Fail closed: never sign or verify tokens with a guessable secret in production.
    throw new Error("JWT_SECRET must be set to a strong value (32+ chars) in production");
  }

  return DEV_FALLBACK_SECRET;
}

export function getAdminToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)admin_token=([^;]+)/);
  return match?.[1] ?? null;
}

export function verifyAdminToken(token: string): AdminSession | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: [JWT_ALGORITHM],
    }) as jwt.JwtPayload;

    if (decoded?.role !== "admin" || typeof decoded.username !== "string") {
      return null;
    }

    return {
      username: decoded.username,
      name: typeof decoded.name === "string" ? decoded.name : "Administrator",
      role: "admin",
    };
  } catch {
    return null;
  }
}

export function getAdminSession(request: Request): AdminSession | null {
  const token = getAdminToken(request);
  if (!token) return null;
  return verifyAdminToken(token);
}

export function isAdminRequest(request: Request): boolean {
  return getAdminSession(request) !== null;
}

export function createAdminSessionToken(session: AdminSession): string {
  return jwt.sign(session, getJwtSecret(), {
    algorithm: JWT_ALGORITHM,
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Guard for privileged API handlers: returns a 401 response when the
// request has no valid admin session, null when the request may proceed.
export function requireAdmin(request: Request): NextResponse | null {
  return isAdminRequest(request) ? null : unauthorizedResponse();
}

// Like requireAdmin, but also returns the verified session for audit logging.
export function requireAdminSession(request: Request): AdminSession | NextResponse {
  return getAdminSession(request) ?? unauthorizedResponse();
}
