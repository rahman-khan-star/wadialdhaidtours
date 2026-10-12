-- Flight selling-price settings (admin-configurable markup + currency rates).
--
-- Wadi Zaid prices a flight result server-side as:
--   provider fare + percentage markup + fixed PKR charge
-- and shows customers only the final AED/PKR amount. The provider fare and
-- these settings never leave the server, so they live on the existing
-- singleton `settings` row (RLS already enabled, service-role access only).
--
-- The fixed charge is stored in PKR and applied ONCE per itinerary, matching
-- the provider fare semantics: Ignav returns a single `price` per itinerary
-- (no per-passenger breakdown) and this integration stores it once per offer.
--
-- Idempotent so it is safe on deployments that already applied it.

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS flight_pricing_mode TEXT NOT NULL DEFAULT 'percentage'
    CHECK (flight_pricing_mode IN ('percentage', 'fixed', 'both')),
  ADD COLUMN IF NOT EXISTS flight_markup_percent NUMERIC NOT NULL DEFAULT 10
    CHECK (flight_markup_percent >= 0 AND flight_markup_percent <= 100),
  ADD COLUMN IF NOT EXISTS flight_fixed_charge_pkr NUMERIC NOT NULL DEFAULT 3000
    CHECK (flight_fixed_charge_pkr >= 0 AND flight_fixed_charge_pkr <= 1000000),
  ADD COLUMN IF NOT EXISTS flight_pkr_per_aed NUMERIC NOT NULL DEFAULT 76
    CHECK (flight_pkr_per_aed > 0 AND flight_pkr_per_aed <= 1000),
  ADD COLUMN IF NOT EXISTS flight_aed_per_provider_unit NUMERIC NOT NULL DEFAULT 3.6725
    CHECK (flight_aed_per_provider_unit > 0 AND flight_aed_per_provider_unit <= 1000);

COMMENT ON COLUMN settings.flight_pricing_mode IS
  'Markup mode for flight selling prices: percentage | fixed | both.';
COMMENT ON COLUMN settings.flight_markup_percent IS
  'Percentage markup added to the provider fare (0-100).';
COMMENT ON COLUMN settings.flight_fixed_charge_pkr IS
  'Fixed charge in PKR added once per itinerary (not per passenger).';
COMMENT ON COLUMN settings.flight_pkr_per_aed IS
  'Exchange rate: PKR received per 1 AED. Used to price and display PKR.';
COMMENT ON COLUMN settings.flight_aed_per_provider_unit IS
  'AED per 1 unit of the provider fare currency (default 3.6725 = AED/USD peg; Ignav quotes USD by default). 1.00 when the provider quotes AED.';
