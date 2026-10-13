import { NextResponse } from "next/server";
import { requireAdmin, requireAdminSession } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import {
  FLIGHT_PRICING_COLUMNS,
  clearFlightPricingCache,
  parseFlightPricingField,
  type FlightPricingField,
} from "@/lib/flights/pricing";
import { getSupabaseServer } from "@/lib/supabase-server";
import { isRecord } from "@/lib/validation";

// Admin-only settings endpoint (session cookie required for both methods).
//
// Flight pricing columns are admin configuration: they are readable and
// writable here only. No public handler selects from `settings`, and the
// flight search route never returns these values — it turns them into a
// sanitized final price server-side.
//
// `settings` is meant to be a singleton row, but the schema does not enforce
// it (the unique index only covers company_name, and a backup restore can
// insert an extra row). A bare `LIMIT 1` without an ORDER BY returns an
// arbitrary row — and because an UPDATE moves the edited row to the end of
// the heap, later reads can flip to a different row. All settings reads pin
// the most recently updated row so the admin form and the flight-pricing
// loader always agree on which row is live.
export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const supabaseServer = getSupabaseServer();
    const { data, error } = await supabaseServer
      .from("settings")
      .select("*")
      .order("updated_at", { ascending: false })
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

    // Flight pricing settings: each provided field is validated on its own and
    // written as-is; a field that is absent keeps its stored value, so an
    // unrelated settings save can never wipe the pricing configuration.
    // Negative values, invalid rates and unknown modes are rejected with 400.
    const pricingUpdate: Record<string, unknown> = {};
    for (const field of Object.keys(FLIGHT_PRICING_COLUMNS) as FlightPricingField[]) {
      const column = FLIGHT_PRICING_COLUMNS[field];
      if (!(column in body)) continue;
      const parsed = parseFlightPricingField(field, body[column]);
      if (!parsed.ok) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      pricingUpdate[column] = parsed.value;
    }

    // Settings are treated as a singleton row. Upserting on company_name
    // would insert a duplicate row whenever the company name changes. The
    // ordering must match GET and the pricing loader so the update lands on
    // the same row those reads return (see the note above GET).
    const { data: existing, error: fetchError } = await supabaseServer
      .from("settings")
      .select("id, whatsapp")
      .order("updated_at", { ascending: false })
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
      ...pricingUpdate,
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

    // A pricing save should be visible to the next search immediately. The
    // loader also expires on its own after 60s, so a stale copy in another
    // bundle can never serve old prices for longer than that.
    if (Object.keys(pricingUpdate).length > 0) clearFlightPricingCache();

    await logAdminAction(request, auth, {
      action: "settings_update",
      resource: "settings",
      resourceId: data?.id as string | undefined,
      metadata: {
        company_name: String(company_name).slice(0, 200),
        // Audit that pricing changed (mode only — never a full price sheet).
        ...(typeof pricingUpdate.flight_pricing_mode === "string"
          ? { flight_pricing_mode: pricingUpdate.flight_pricing_mode }
          : {}),
      },
    });

    return NextResponse.json({ settings: data });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
