// Server-only flight search layer.
//
// NEVER import this module from a client component: it resolves provider
// configuration, provider API keys and the internal pricing settings that must
// stay off the browser. Clients talk to the /api/flights/* route handlers.

export { getFlightProvider, getFlightProviderDiagnostics } from "./provider";
export type { FlightProviderDiagnostics, FlightProviderName } from "./provider";
export { assertNoProviderPricing, toPublicSearchResult } from "./serialize";
export {
  DEFAULT_FLIGHT_PRICING,
  FLIGHT_MARKUP_MODES,
  FLIGHT_PRICING_COLUMNS,
  clearFlightPricingCache,
  computeSellingPrice,
  loadFlightPricingSettings,
  parseFlightPricingField,
  parseFlightPricingRow,
  validateFlightPricingSettings,
} from "./pricing";
export type {
  FlightMarkupMode,
  FlightPricingField,
  FlightPricingSettings,
  FlightPricingSnapshot,
  FlightPricingValidation,
} from "./pricing";
export { signFlightRequestToken, verifyFlightRequestToken } from "./search-token";
export { parseAirportSearchParams, parseFlightSearchParams } from "./search-params";
export { resolveAirportReference, searchAirportRecords } from "./airports";
export type { FlightProvider, ProviderFlightOffer } from "./provider-types";
