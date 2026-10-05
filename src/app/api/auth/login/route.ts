import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAdminSessionToken } from "@/lib/admin-auth";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { recordActivity, recordLoginHistory } from "@/lib/audit";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const PASSWORD_HASH_ROUNDS = 10;

type AdminCredentials = { username: string; passwordHash: string };

let cachedCredentials: AdminCredentials | null | undefined;

const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

// Env values pasted from .env files or terminals often arrive with stray
// whitespace or wrapping quotes; normalize before comparing/storing.
function normalizeEnvValue(value: string | undefined): string {
  const trimmed = (value ?? "").trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return trimmed.slice(1, -1).trim();
    }
  }
  return trimmed;
}

// Credentials come from environment variables. Development-only defaults are
// allowed locally but rejected in production (fail closed at login time).
function getAdminCredentials(): AdminCredentials | null {
  if (cachedCredentials !== undefined) return cachedCredentials;

  const username = normalizeEnvValue(process.env.ADMIN_USERNAME);
  let passwordHash = normalizeEnvValue(process.env.ADMIN_PASSWORD_HASH);
  const plainPassword = normalizeEnvValue(process.env.ADMIN_PASSWORD);

  // Tolerate a common configuration mistake: if ADMIN_PASSWORD_HASH holds a
  // value that is not a bcrypt hash (e.g. the password itself, or a quoted /
  // corrupted paste), hash it at load so the normal bcrypt comparison works
  // instead of silently rejecting every login attempt.
  if (passwordHash && !BCRYPT_HASH_PATTERN.test(passwordHash)) {
    passwordHash = bcrypt.hashSync(passwordHash, PASSWORD_HASH_ROUNDS);
  }

  if (passwordHash) {
    cachedCredentials = {
      username: username || "admin",
      passwordHash,
    };
    return cachedCredentials;
  }

  if (plainPassword) {
    cachedCredentials = {
      username: username || "admin",
      passwordHash: bcrypt.hashSync(plainPassword, PASSWORD_HASH_ROUNDS),
    };
    return cachedCredentials;
  }

  if (process.env.NODE_ENV === "production") {
    console.error(
      "Admin login is not configured: set ADMIN_PASSWORD_HASH (or ADMIN_PASSWORD) and ADMIN_USERNAME."
    );
    cachedCredentials = null;
    return null;
  }

  cachedCredentials = {
    username: "admin",
    passwordHash: bcrypt.hashSync("admin123", PASSWORD_HASH_ROUNDS),
  };
  return cachedCredentials;
}

async function readCredentials(request: Request): Promise<{ username: string; password: string } | null> {
  try {
    const body = (await request.json()) as { username?: unknown; password?: unknown };
    if (typeof body.username !== "string" || typeof body.password !== "string") return null;
    if (!body.username.trim() || !body.password) return null;
    if (body.username.length > 100 || body.password.length > 200) return null;
    return { username: body.username.trim(), password: body.password };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const userAgent = request.headers.get("user-agent");
    const credentials = await readCredentials(request);
    const attemptedUsername = credentials?.username ?? "";

    if (!consumeRateLimit(`login:${clientIp}`, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS)) {
      await recordLoginHistory({
        username: attemptedUsername,
        status: "rate_limited",
        ipAddress: clientIp,
        userAgent,
      });
      await recordActivity({
        action: "rate_limit_blocked",
        resource: "auth",
        actor: attemptedUsername || "anonymous",
        ipAddress: clientIp,
      });
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(LOGIN_WINDOW_MS / 1000) } }
      );
    }

    if (!credentials) {
      await recordLoginHistory({
        username: attemptedUsername,
        status: "failed",
        ipAddress: clientIp,
        userAgent,
      });
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const admin = getAdminCredentials();
    if (!admin) {
      return NextResponse.json(
        { error: "Authentication is not available" },
        { status: 503 }
      );
    }

    const attemptedName = credentials.username.toLowerCase();
    const configuredName = admin.username.toLowerCase();
    const usernameMatches =
      attemptedName.length === configuredName.length &&
      timingSafeEqual(attemptedName, configuredName);
    const passwordMatches = await bcrypt.compare(credentials.password, admin.passwordHash);

    if (!usernameMatches || !passwordMatches) {
      // Booleans only — no secrets. Identical error for unknown user and wrong
      // password prevents enumeration; logs tell operators which side failed.
      console.warn(
        `Admin login rejected (usernameMatch=${usernameMatches}, passwordMatch=${passwordMatches})`
      );
      await recordLoginHistory({
        username: credentials.username,
        status: "failed",
        ipAddress: clientIp,
        userAgent,
      });
      await recordActivity({
        action: "login_failed",
        resource: "auth",
        actor: credentials.username,
        ipAddress: clientIp,
      });
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const session = {
      username: admin.username,
      name: "Administrator",
      role: "admin",
    };
    const token = createAdminSessionToken(session);

    await recordLoginHistory({
      username: session.username,
      status: "success",
      ipAddress: clientIp,
      userAgent,
    });
    await recordActivity({
      action: "login",
      resource: "auth",
      actor: session.username,
      ipAddress: clientIp,
    });

    const response = NextResponse.json({
      success: true,
      user: { username: session.username, name: session.name, role: session.role },
    });

    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Admin login failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
