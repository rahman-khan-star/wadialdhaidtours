// Server-only flight search layer.
//
// NEVER import this module from a client component: it resolves provider
// configuration (and, later, provider API keys) that must stay off the browser.
// Clients talk to the /api/flights/* route handlers instead.

export { getFlightProvider, getFlightProviderDiagnostics } from "./provider";
export type { FlightProviderDiagnostics, FlightProviderName } from "./provider";
export { assertNoProviderPricing, toPublicSearchResult } from "./serialize";
export { signFlightRequestToken, verifyFlightRequestToken } from "./search-token";
export { parseAirportSearchParams, parseFlightSearchParams } from "./search-params";
export { resolveAirportReference, searchAirportRecords } from "./airports";
export type { FlightProvider, ProviderFlightOffer } from "./provider-types";
