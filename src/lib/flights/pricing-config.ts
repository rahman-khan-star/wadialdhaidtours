// Flight pricing configuration — pure constants and types.
//
// This is the ONLY module in `flights/` that client code may import: it holds
// no provider configuration, no credentials and no database access. The admin
// settings screen and the server-side pricing engine share it so the mode
// names, column names, limits and defaults can never drift apart.

export type FlightMarkupMode = "percentage" | "fixed" | "both";

export const FLIGHT_MARKUP_MODES: readonly FlightMarkupMode[] = [
  "percentage",
  "fixed",
  "both",
];

export interface FlightPricingSettings {
  /** Which markup components apply to the provider fare. */
  mode: FlightMarkupMode;
  /** Percentage markup, 0-100. Used when mode is "percentage" or "both". */
  markupPercent: number;
  /** Fixed charge in PKR, applied once per itinerary. Used when "fixed"/"both". */
  fixedChargePkr: number;
  /** PKR received for 1 AED. Drives every PKR display amount. */
  pkrPerAed: number;
  /** AED received for 1 unit of the provider fare currency (AED/USD peg default). */
  aedPerProviderUnit: number;
}

export type FlightPricingField = keyof FlightPricingSettings;

// Column names on the singleton `settings` row.
export const FLIGHT_PRICING_COLUMNS: Record<FlightPricingField, string> = {
  mode: "flight_pricing_mode",
  markupPercent: "flight_markup_percent",
  fixedChargePkr: "flight_fixed_charge_pkr",
  pkrPerAed: "flight_pkr_per_aed",
  aedPerProviderUnit: "flight_aed_per_provider_unit",
};

// Used when a settings row (or a column) does not exist yet — a fresh
// database still prices flights with the same values the migration defaults to.
export const DEFAULT_FLIGHT_PRICING: Readonly<FlightPricingSettings> = Object.freeze({
  mode: "percentage" as FlightMarkupMode,
  markupPercent: 10,
  fixedChargePkr: 3000,
  pkrPerAed: 76,
  aedPerProviderUnit: 3.6725,
});

// Upper bounds keep a fat-fingered admin value from producing absurd prices.
export const FLIGHT_PRICING_LIMITS = Object.freeze({
  maxMarkupPercent: 100,
  maxFixedChargePkr: 1_000_000,
  maxRate: 1000,
});
