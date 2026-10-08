import { NextResponse } from "next/server";
import type { FlightSearchQuery, FlightSearchResponse, FlightPlace } from "@/types";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  assertNoProviderPricing,
  getFlightProvider,
  getFlightProviderDiagnostics,
  parseFlightSearchParams,
  resolveAirportReference,
  signFlightRequestToken,
  toPublicSearchResult,
} from "@/lib/flights";

const SEARCH_WINDOW_MS = 60 * 1000;
const SEARCH_MAX_PER_WINDOW = 30;

const NO_FLIGHTS_MESSAGE =
  "No flights are available for this route on the selected dates. Try different dates or airports.";
const UNAVAILABLE_MESSAGE =
  "Flight search is temporarily unavailable. Please try again in a moment.";
const UNKNOWN_AIRPORT_MESSAGE = "We could not find that origin or destination airport.";

function emptyResponse(
  status: FlightSearchResponse["status"],
  query: FlightSearchQuery,
  message: string
): FlightSearchResponse {
  return { status, message, flights: [], query };
}

function toPlace(airport: ReturnType<typeof resolveAirportReference>): FlightPlace | null {
  if (!airport) return null;
  return {
    iata: airport.iata,
    name: airport.name,
    city: airport.city,
    country: airport.country,
  };
}

// Public flight search.
//
// Customers only ever receive schedule + availability data. No price, fare or
// booking capability leaves this handler, and every parameter is validated
// server-side before the provider is called.
export async function GET(request: Request) {
  const clientIp = getClientIp(request);

  if (!consumeRateLimit(`flight-search:${clientIp}`, SEARCH_MAX_PER_WINDOW, SEARCH_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many flight searches. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(SEARCH_WINDOW_MS / 1000) } }
    );
  }

  const url = new URL(request.url);
  const parsed = parseFlightSearchParams(url.searchParams);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const input = parsed.value;
  const origin = toPlace(resolveAirportReference(input.origin));
  const destination = toPlace(resolveAirportReference(input.destination));

  const query: FlightSearchQuery = {
    origin,
    destination,
    departureDate: input.departureDate,
    returnDate: input.returnDate,
    passengers: input.passengers,
    cabin: input.cabin,
    tripType: input.tripType,
  };

  if (!origin || !destination) {
    return NextResponse.json(
      {
        error: UNKNOWN_AIRPORT_MESSAGE,
        ...emptyResponse("no_flights", query, UNKNOWN_AIRPORT_MESSAGE),
      },
      { status: 400 }
    );
  }

  try {
    const provider = getFlightProvider();
    const offers = await provider.searchFlights(input);

    if (offers.length === 0) {
      return NextResponse.json(emptyResponse("no_flights", query, NO_FLIGHTS_MESSAGE));
    }

    const flights = offers.map((offer) =>
      toPublicSearchResult(
        offer,
        signFlightRequestToken(offer, {
          origin,
          destination,
          departureDate: input.departureDate,
          returnDate: input.returnDate,
          passengers: input.passengers,
          cabin: input.cabin,
          tripType: input.tripType,
        })
      )
    );

    const response: FlightSearchResponse = {
      status: "available",
      message: null,
      flights,
      query,
    };

    // Last line of defence: a price-like key anywhere in the body throws.
    assertNoProviderPricing(response);

    return NextResponse.json(response);
  } catch (error) {
    // Server-side only. Diagnostics carry names/booleans, never credentials.
    // There is no mock fallback here on purpose: a failed real search must
    // surface as a search error, never as synthetic flights.
    console.error("Flight search failed:", getFlightProviderDiagnostics(), error);
    return NextResponse.json(emptyResponse("unavailable", query, UNAVAILABLE_MESSAGE));
  }
}
