import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseServer } from "@/lib/supabase-server";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;
const MAX_OFFSET = 100_000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function readIntParam(url: URL, name: string, fallback: number): number {
  const raw = Number.parseInt(url.searchParams.get(name) ?? "", 10);
  return Number.isFinite(raw) ? raw : fallback;
}

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const url = new URL(request.url);
    const limit = clamp(readIntParam(url, "limit", DEFAULT_LIMIT), 1, MAX_LIMIT);
    const offset = clamp(readIntParam(url, "offset", 0), 0, MAX_OFFSET);
    const status = url.searchParams.get("status");

    const supabase = getSupabaseServer();
    let query = supabase
      .from("login_history")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && ["success", "failed", "rate_limited", "logout"].includes(status)) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch login history: ${error.message}`);

    return NextResponse.json({ entries: data ?? [] });
  } catch (error) {
    console.error("Failed to fetch login history:", error);
    return NextResponse.json({ error: "Failed to fetch login history" }, { status: 500 });
  }
}
