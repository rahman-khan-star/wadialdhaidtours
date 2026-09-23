import { NextResponse } from "next/server";
import { requireAdmin, requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { getSupabaseServer } from "@/lib/supabase-server";
import { isRecord } from "@/lib/validation";

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const supabaseServer = getSupabaseServer();
    const { data, error } = await supabaseServer
      .from("settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch settings: ${error.message}`);

    // No row yet (fresh database): the admin UI keeps its defaults.
    return NextResponse.json({ settings: data ?? null });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { company_name, email, phone, whatsapp, website, address, currency, timezone } = body;

    if (
      typeof company_name !== "string" || !company_name.trim() ||
      typeof email !== "string" || !email.trim() ||
      typeof phone !== "string" || !phone.trim()
    ) {
      return NextResponse.json(
        { error: "Missing required fields: company_name, email, phone" },
        { status: 400 }
      );
    }

    const supabaseServer = getSupabaseServer();

    // Settings are treated as a singleton row. Upserting on company_name
    // would insert a duplicate row whenever the company name changes.
    const { data: existing, error: fetchError } = await supabaseServer
      .from("settings")
      .select("id, whatsapp")
      .limit(1)
      .maybeSingle();
    if (fetchError) throw new Error(`Failed to fetch settings: ${fetchError.message}`);

    const row = {
      company_name: company_name.slice(0, 200),
      email: email.slice(0, 200),
      phone: phone.slice(0, 50),
      // Preserve the stored value when the admin UI does not send one.
      whatsapp:
        typeof whatsapp === "string" && whatsapp.trim()
          ? whatsapp.slice(0, 50)
          : existing?.whatsapp ?? "",
      website: typeof website === "string" ? website.slice(0, 300) : "",
      address: typeof address === "string" ? address.slice(0, 500) : "",
      currency: typeof currency === "string" && currency.trim() ? currency.slice(0, 10) : "USD",
      timezone: typeof timezone === "string" && timezone.trim() ? timezone.slice(0, 60) : "Asia/Dubai",
    };

    let data: Record<string, unknown> | null = null;
    if (existing?.id) {
      const { data: updated, error } = await supabaseServer
        .from("settings")
        .update(row)
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw new Error(`Failed to update settings: ${error.message}`);
      data = updated;
    } else {
      const { data: inserted, error } = await supabaseServer
        .from("settings")
        .insert(row)
        .select()
        .single();
      if (error) throw new Error(`Failed to update settings: ${error.message}`);
      data = inserted;
    }

    await logAdminAction(request, auth, {
      action: "settings_update",
      resource: "settings",
      resourceId: data?.id as string | undefined,
      metadata: { company_name: String(company_name).slice(0, 200) },
    });

    return NextResponse.json({ settings: data });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
