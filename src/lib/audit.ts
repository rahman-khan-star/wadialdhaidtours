import { getSupabaseServer } from "@/lib/supabase-server";
import { getClientIp } from "@/lib/rate-limit";
import type { AdminSession } from "@/lib/admin-auth";

// Keys whose values must never reach the audit tables.
const FORBIDDEN_KEY_PATTERN = /password|token|secret|api[-_]?key|authorization|cookie|credential|service[-_]?role|jwt/i;

const MAX_STRING_LENGTH = 500;
const MAX_DEPTH = 4;
const MAX_ARRAY_ITEMS = 20;
const MAX_METADATA_KEYS = 30;

function sanitizeValue(value: unknown, depth: number): unknown {
  if (depth > MAX_DEPTH) return null;
  if (typeof value === "string") return value.slice(0, MAX_STRING_LENGTH);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value === null) return null;

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_ITEMS).map((item) => sanitizeValue(item, depth + 1));
  }

  if (typeof value === "object") {
    const source = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    let keyCount = 0;
    for (const [key, entry] of Object.entries(source)) {
      if (keyCount >= MAX_METADATA_KEYS) break;
      if (FORBIDDEN_KEY_PATTERN.test(key)) continue;
      output[key] = sanitizeValue(entry, depth + 1);
      keyCount += 1;
    }
    return output;
  }

  return null;
}

export function sanitizeMetadata(metadata: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!metadata) return {};
  return sanitizeValue(metadata, 0) as Record<string, unknown>;
}

export type ActivityInput = {
  action: string;
  resource: string;
  resourceId?: string | null;
  actor?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, unknown>;
};

// Audit writes must never break the operation being audited.
export async function recordActivity(input: ActivityInput): Promise<void> {
  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase.from("activity_logs").insert({
      action: input.action.slice(0, 60),
      resource: input.resource.slice(0, 60),
      resource_id: input.resourceId ? String(input.resourceId).slice(0, 200) : null,
      actor: (input.actor ?? "anonymous").slice(0, 100),
      ip_address: input.ipAddress ? input.ipAddress.slice(0, 60) : null,
      metadata: sanitizeMetadata(input.metadata),
    });
    if (error) {
      console.error("Failed to record activity log:", error.message);
    }
  } catch (error) {
    console.error("Failed to record activity log:", error);
  }
}

export type LoginHistoryInput = {
  username: string;
  status: "success" | "failed" | "rate_limited" | "logout";
  ipAddress?: string | null;
  userAgent?: string | null;
};

// Never pass passwords or auth secrets here — only the username identifier.
export async function recordLoginHistory(input: LoginHistoryInput): Promise<void> {
  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase.from("login_history").insert({
      username: (input.username || "unknown").slice(0, 100),
      status: input.status,
      ip_address: input.ipAddress ? input.ipAddress.slice(0, 60) : null,
      user_agent: input.userAgent ? input.userAgent.slice(0, 300) : null,
    });
    if (error) {
      console.error("Failed to record login history:", error.message);
    }
  } catch (error) {
    console.error("Failed to record login history:", error);
  }
}

export async function logAdminAction(
  request: Request,
  session: AdminSession,
  input: {
    action: string;
    resource: string;
    resourceId?: string | null;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  await recordActivity({
    action: input.action,
    resource: input.resource,
    resourceId: input.resourceId ?? null,
    actor: session.username,
    ipAddress: getClientIp(request),
    metadata: input.metadata,
  });
}
