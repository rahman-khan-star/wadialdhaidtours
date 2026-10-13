import type { FlightFinalPrice } from "@/types";
import {
  DEFAULT_FLIGHT_PRICING,
  FLIGHT_MARKUP_MODES,
  FLIGHT_PRICING_COLUMNS,
  FLIGHT_PRICING_LIMITS,
  type FlightMarkupMode,
  type FlightPricingField,
  type FlightPricingSettings,
} from "./pricing-config";

// Server-side half of the flight pricing feature: validation, currency
// conversion and the Supabase settings loader. The shared constants/types
// live in pricing-config.ts (client-safe).
export * from "./pricing-config";

// Flight selling-price rules (server-only).
//
// Selling price = provider fare (+ percentage markup) (+ fixed PKR charge),
// converted into the two currencies the site displays: AED and PKR.
//
// Pricing basis — documented, not guessed:
//   * Ignav returns exactly one `price` object per itinerary
//     ({ amount, currency }) with no per-passenger breakdown, and the request
//     sends the adult count, so `internalFare.amount` is treated as the
//     itinerary total for the requested party (the existing normalisation
//     stores it once per offer and never multiplies it by passengers).
//   * The fixed charge therefore applies ONCE PER ITINERARY, never per
//     passenger, and the percentage markup applies to the provider fare of
//     that same itinerary.
//   * Ignav quotes the market currency (default market "US" -> USD); the
//     provider->AED rate converts it. AED and PKR quotes need no extra rate.
//
// Nothing here ever reaches a browser: only the resulting { aed, pkr } pair is
// serialised, and only after it passes the response guard in serialize.ts.

export type FlightPricingValidation =
  | { ok: true; value: FlightPricingSettings }
  | { ok: false; error: string };

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

// Validates one setting. Rejects negatives, zero/invalid rates, out-of-range
// values and anything that is not a number — never silently coerces bad input.
export function parseFlightPricingField(
  field: FlightPricingField,
  value: unknown
): { ok: true; value: FlightPricingSettings[FlightPricingField] } | { ok: false; error: string } {
  if (field === "mode") {
    if (typeof value !== "string") {
      return { ok: false, error: "Markup mode must be a string." };
    }
    const normalized = value.trim().toLowerCase();
    if (!(FLIGHT_MARKUP_MODES as readonly string[]).includes(normalized)) {
      return { ok: false, error: "Markup mode must be one of: percentage, fixed, both." };
    }
    return { ok: true, value: normalized as FlightMarkupMode };
  }

  const amount = toFiniteNumber(value);
  if (amount === null) {
    return { ok: false, error: `${field} must be a number.` };
  }

  switch (field) {
    case "markupPercent":
      if (amount < 0 || amount > FLIGHT_PRICING_LIMITS.maxMarkupPercent) {
        return {
          ok: false,
          error: `Markup percentage must be between 0 and ${FLIGHT_PRICING_LIMITS.maxMarkupPercent}.`,
        };
      }
      break;
    case "fixedChargePkr":
      if (amount < 0 || amount > FLIGHT_PRICING_LIMITS.maxFixedChargePkr) {
        return {
          ok: false,
          error: `Fixed charge must be between 0 and ${FLIGHT_PRICING_LIMITS.maxFixedChargePkr} PKR.`,
        };
      }
      break;
    case "pkrPerAed":
    case "aedPerProviderUnit":
      if (amount <= 0 || amount > FLIGHT_PRICING_LIMITS.maxRate) {
        return {
          ok: false,
          error: `Exchange rate must be greater than 0 and at most ${FLIGHT_PRICING_LIMITS.maxRate}.`,
        };
      }
      break;
    default:
      return { ok: false, error: "Unknown flight pricing setting." };
  }

  return { ok: true, value: amount };
}

// Validates a complete settings object: all five fields are required and each
// one must pass its own bounds check.
export function validateFlightPricingSettings(raw: unknown): FlightPricingValidation {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Flight pricing settings must be an object." };
  }
  const source = raw as Record<string, unknown>;
  const fields = Object.keys(FLIGHT_PRICING_COLUMNS) as FlightPricingField[];

  const value = {
    mode: DEFAULT_FLIGHT_PRICING.mode,
    markupPercent: DEFAULT_FLIGHT_PRICING.markupPercent,
    fixedChargePkr: DEFAULT_FLIGHT_PRICING.fixedChargePkr,
    pkrPerAed: DEFAULT_FLIGHT_PRICING.pkrPerAed,
    aedPerProviderUnit: DEFAULT_FLIGHT_PRICING.aedPerProviderUnit,
  };

  for (const field of fields) {
    if (!(field in source)) {
      return { ok: false, error: `Missing flight pricing setting: ${field}.` };
    }
    const parsed = parseFlightPricingField(field, source[field]);
    if (!parsed.ok) return parsed;
    if (field === "mode") {
      value.mode = parsed.value as FlightMarkupMode;
    } else {
      value[field] = parsed.value as number;
    }
  }

  return { ok: true, value };
}

// Reads pricing settings out of a `settings` row.
//   * no row (fresh database)         -> built-in defaults
//   * column missing (migration not yet applied) -> built-in default for it
//   * column present but malformed     -> null: never price from bad settings
export function parseFlightPricingRow(
  row: Record<string, unknown> | null | undefined
): FlightPricingSettings | null {
  if (!row) return { ...DEFAULT_FLIGHT_PRICING };

  const merged: Record<string, unknown> = { ...DEFAULT_FLIGHT_PRICING };

  for (const field of Object.keys(FLIGHT_PRICING_COLUMNS) as FlightPricingField[]) {
    const column = FLIGHT_PRICING_COLUMNS[field];
    const stored = row[column];
    if (stored === undefined || stored === null) continue;
    const parsed = parseFlightPricingField(field, stored);
    if (!parsed.ok) {
      console.warn(`[flights] ignoring malformed pricing setting ${column}: ${parsed.error}`);
      return null;
    }
    merged[field] = parsed.value;
  }

  const validated = validateFlightPricingSettings(merged);
  return validated.ok ? validated.value : null;
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// Converts an amount in the provider's fare currency into AED.
// Returns null when no reliable rate exists — a price is never invented.
function providerCurrencyToAed(amount: number, currency: string, settings: FlightPricingSettings): number | null {
  if (currency === "AED") return amount;
  if (currency === "PKR") return amount / settings.pkrPerAed;
  // Any other provider currency (Ignav defaults to USD) relies on the
  // admin-configured AED-per-provider-unit rate.
  if (!(settings.aedPerProviderUnit > 0)) return null;
  return amount * settings.aedPerProviderUnit;
}

/**
 * Computes the customer-facing selling price for one provider fare.
 *
 * Returns null — the "price unavailable" state — when the fare is missing or
 * not a genuine positive amount, when the currency cannot be converted with a
 * configured rate, or when no settings were loaded. The flight itself stays
 * searchable and requestable in that case.
 */
export function computeSellingPrice(
  fare: { amount: number; currency: string } | undefined | null,
  settings: FlightPricingSettings | null | undefined
): FlightFinalPrice | null {
  if (!settings || !fare) return null;

  const amount = fare.amount;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) return null;

  const currency = typeof fare.currency === "string" ? fare.currency.trim().toUpperCase() : "";
  if (!currency) return null;

  const baseAed = providerCurrencyToAed(amount, currency, settings);
  if (baseAed === null || !Number.isFinite(baseAed) || baseAed <= 0) return null;

  let markupAed = 0;
  if (settings.mode === "percentage" || settings.mode === "both") {
    markupAed += (baseAed * settings.markupPercent) / 100;
  }
  if (settings.mode === "fixed" || settings.mode === "both") {
    markupAed += settings.fixedChargePkr / settings.pkrPerAed;
  }

  const totalAed = baseAed + markupAed;
  if (!Number.isFinite(totalAed) || totalAed <= 0) return null;

  const aed = roundTo(totalAed, 2);
  // PKR is derived from the displayed AED amount so the two figures on the
  // card always agree with each other.
  const pkr = Math.round(aed * settings.pkrPerAed);
  if (!Number.isFinite(aed) || !Number.isFinite(pkr) || aed <= 0 || pkr <= 0) return null;

  return { aed, pkr };
}

// ---------------------------------------------------------------------------
// Settings loader (Supabase) with a short-lived cache
// ---------------------------------------------------------------------------

export type FlightPricingSnapshot =
  | { ok: true; settings: FlightPricingSettings }
  | { ok: false };

const PRICING_CACHE_MS = 60_000;

let cachedSnapshot: { loadedAt: number; value: FlightPricingSnapshot } | null = null;

export function clearFlightPricingCache(): void {
  cachedSnapshot = null;
}

/**
 * Loads the admin flight pricing settings.
 *
 * Never throws: when the settings cannot be read (missing configuration,
 * database error) or are malformed, it answers `{ ok: false }` and the caller
 * shows the unavailable-price state instead of pricing with unverified data.
 *
 * Orders by `updated_at` (newest first) exactly like the admin settings
 * endpoint: `settings` is a logical singleton the schema does not enforce, so
 * an unordered `LIMIT 1` could price from a stale duplicate row while the
 * admin edits a different one.
 */
export async function loadFlightPricingSettings(): Promise<FlightPricingSnapshot> {
  const now = Date.now();
  if (cachedSnapshot && now - cachedSnapshot.loadedAt < PRICING_CACHE_MS) {
    return cachedSnapshot.value;
  }

  let value: FlightPricingSnapshot;
  try {
    const { getSupabaseServer } = await import("../supabase-server");
    const supabaseServer = getSupabaseServer();
    const { data, error } = await supabaseServer
      .from("settings")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);

    const settings = parseFlightPricingRow(data as Record<string, unknown> | null);
    if (!settings) {
      console.warn("[flights] flight pricing settings are malformed; prices are unavailable.");
      value = { ok: false };
    } else {
      value = { ok: true, settings };
    }
  } catch (error) {
    console.error("[flights] could not load flight pricing settings:", error);
    value = { ok: false };
  }

  cachedSnapshot = { loadedAt: now, value };
  return value;
}
