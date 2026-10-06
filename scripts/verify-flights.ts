/**
 * Verification for the flight search + inquiry flow.
 *
 * Run: npx tsx scripts/verify-flights.ts
 *
 * Covers provider search, mock inventory, the "no price" guarantee, search
 * parameter validation and the signed request token.
 */
import {
  assertNoProviderPricing,
  getFlightProvider,
  parseFlightSearchParams,
  signFlightRequestToken,
  toPublicSearchResult,
  verifyFlightRequestToken,
} from "../src/lib/flights";
import { mapIgnavItineraries, toIgnavCabin } from "../src/lib/flights/ignav-provider";
import type { FlightSearchInput, FlightSearchResult } from "../src/types";

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function section(title: string): void {
  console.log(`\n${title}`);
}

const PRICE_KEY_PATTERN = /price|fare|amount|cost|currency|quote/i;

function findPriceKeys(value: unknown, path = "", found: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach((item, index) => findPriceKeys(item, `${path}[${index}]`, found));
  } else if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      const next = path ? `${path}.${key}` : key;
      if (PRICE_KEY_PATTERN.test(key)) found.push(next);
      findPriceKeys(entry, next, found);
    }
  }
  return found;
}

function baseQuery(overrides: Partial<FlightSearchInput> = {}): FlightSearchInput {
  return {
    origin: "DXB",
    destination: "KHI",
    departureDate: "2026-11-15",
    returnDate: "2026-11-25",
    passengers: 1,
    cabin: "Economy",
    tripType: "roundtrip",
    ...overrides,
  };
}

// Ignav response fixtures transcribed from the official documentation
// (https://ignav.com/docs/response-format) so the mapping can be verified
// without spending a single request from the free API allowance.
const IGNAV_ONE_WAY_FIXTURE = {
  itineraries: [
    {
      price: { amount: 542, currency: "USD", status: "verified" },
      outbound: {
        carrier: "United Airlines",
        duration_minutes: 475,
        segments: [
          {
            marketing_carrier_code: "UA",
            flight_number: "1234",
            operating_carrier_name: "United Airlines",
            departure_airport: "SFO",
            departure_time_local: "2026-11-05T06:00:00",
            departure_time_utc: "2026-11-05T13:00:00Z",
            arrival_airport: "ORD",
            arrival_time_local: "2026-11-05T12:15:00",
            arrival_time_utc: "2026-11-05T17:15:00Z",
            duration_minutes: 255,
          },
          {
            marketing_carrier_code: "UA",
            flight_number: "5678",
            operating_carrier_name: "United Airlines",
            departure_airport: "ORD",
            departure_time_local: "2026-11-05T13:30:00",
            departure_time_utc: "2026-11-05T18:30:00Z",
            arrival_airport: "JFK",
            arrival_time_local: "2026-11-05T16:55:00",
            arrival_time_utc: "2026-11-05T20:55:00Z",
            duration_minutes: 145,
          },
        ],
      },
      cabin_class: "economy",
      ignav_id: "a1b2c3d4e5f6789012345678abcdef01",
    },
  ],
};

const IGNAV_ROUND_TRIP_FIXTURE = {
  itineraries: [
    {
      ...IGNAV_ONE_WAY_FIXTURE.itineraries[0],
      inbound: {
        carrier: "United Airlines",
        duration_minutes: 360,
        segments: [
          {
            marketing_carrier_code: "UA",
            flight_number: "900",
            operating_carrier_name: "United Airlines",
            departure_airport: "JFK",
            departure_time_local: "2026-11-25T18:00:00",
            departure_time_utc: "2026-11-25T23:00:00Z",
            arrival_airport: "SFO",
            arrival_time_local: "2026-11-25T22:10:00",
            arrival_time_utc: "2026-11-26T06:10:00Z",
            duration_minutes: 360,
          },
        ],
      },
    },
  ],
};

async function main(): Promise<void> {
  const provider = getFlightProvider();
  check("default provider resolves to mock", provider.name === "mock");

  section("Airport / city search");
  const byCity = await provider.searchAirports("Lahore");
  check("city name resolves", byCity.some((a) => a.iata === "LHE"));

  const byCode = await provider.searchAirports("khi");
  check("IATA code resolves (case-insensitive)", byCode.some((a) => a.iata === "KHI"));

  const byCountry = await provider.searchAirports("Pakistan");
  check("country search returns several airports", byCountry.length > 1);

  const all = await provider.searchAirports("", 25);
  check("empty query returns popular list up to limit", all.length > 0 && all.length <= 25);

  const unknown = await provider.searchAirports("zzzznotacity");
  check("unknown query returns no airports", unknown.length === 0);

  section("Flight search coverage");
  const routes: { origin: string; destination: string; label: string }[] = [
    { origin: "DXB", destination: "KHI", label: "Dubai → Karachi" },
    { origin: "LHE", destination: "LHR", label: "Lahore → London" },
    { origin: "ISB", destination: "RUH", label: "Islamabad → Riyadh" },
    { origin: "KHI", destination: "DXB", label: "Karachi → Dubai (reverse)" },
    { origin: "DEL", destination: "SIN", label: "Delhi → Singapore" },
    { origin: "JFK", destination: "IST", label: "New York → Istanbul" },
  ];

  let totalOffers = 0;
  for (const route of routes) {
    const offers = await provider.searchFlights(
      baseQuery({ origin: route.origin, destination: route.destination })
    );
    totalOffers += offers.length;
    const withAllFields = offers.every(
      (offer) =>
        Boolean(offer.outbound.airline) &&
        Boolean(offer.outbound.flightNumber) &&
        Boolean(offer.outbound.departureTime) &&
        Boolean(offer.outbound.arrivalTime) &&
        offer.outbound.durationMinutes > 0 &&
        Number.isInteger(offer.outbound.stops) &&
        (offer.availability === "Available" || offer.availability === "Limited") &&
        offer.cabin === "Economy"
    );
    check(`${route.label} returns usable itineraries`, offers.length > 0 && withAllFields);
  }
  check("across all routes at least one itinerary was produced", totalOffers > 0);

  section("Trip types, passengers and cabin");
  const oneWay = await provider.searchFlights(
    baseQuery({ tripType: "oneway", returnDate: null })
  );
  check(
    "one-way search has no inbound leg",
    oneWay.length > 0 && oneWay.every((offer) => offer.inbound === null && offer.tripType === "oneway")
  );

  const roundTrip = await provider.searchFlights(baseQuery());
  check(
    "round trip search has an inbound leg",
    roundTrip.length > 0 && roundTrip.every((offer) => offer.inbound !== null)
  );

  const business = await provider.searchFlights(baseQuery({ cabin: "Business" }));
  check(
    "cabin class is applied to every result",
    business.every((offer) => offer.cabin === "Business")
  );

  const group = await provider.searchFlights(baseQuery({ passengers: 4 }));
  check(
    "results always seat the requested passenger count",
    group.every((offer) => offer.seatsRemaining >= 4)
  );

  const partyOfNine = await provider.searchFlights(baseQuery({ passengers: 9 }));
  check(
    "large parties still resolve without crashing",
    Array.isArray(partyOfNine)
  );

  const differentDates = await provider.searchFlights(baseQuery({ departureDate: "2026-12-24" }));
  const otherDates = await provider.searchFlights(baseQuery({ departureDate: "2026-12-25" }));
  check(
    "different departure dates produce different schedules",
    JSON.stringify(differentDates.map((o) => o.outbound.flightNumber)) !==
      JSON.stringify(otherDates.map((o) => o.outbound.flightNumber))
  );

  section("No customer-visible pricing");
  const sample = roundTrip[0];
  check("provider internally carries a fare", typeof sample?.internalFare?.amount === "number");

  const publicFlights = roundTrip.map((offer, index) =>
    toPublicSearchResult(offer, `token-${index}`)
  );
  const payload = { status: "available", flights: publicFlights };
  const leaked = findPriceKeys(payload);
  check("serialized flights contain no price-like keys", leaked.length === 0, leaked.join(", "));

  let guardThrew = false;
  try {
    assertNoProviderPricing(payload);
  } catch {
    guardThrew = true;
  }
  check("pricing guard accepts a clean payload", !guardThrew);

  let guardCaughtLeak = false;
  try {
    assertNoProviderPricing({ flights: [{ price: 100 }] });
  } catch {
    guardCaughtLeak = true;
  }
  check("pricing guard rejects a leaked price", guardCaughtLeak);

  section("Search parameter validation");
  const past = parseFlightSearchParams(
    new URLSearchParams({ origin: "DXB", destination: "KHI", departureDate: "2020-01-01" })
  );
  check("past departure date is rejected", past.ok === false);

  const returnBeforeDeparture = parseFlightSearchParams(
    new URLSearchParams({
      origin: "DXB",
      destination: "KHI",
      departureDate: "2026-11-20",
      returnDate: "2026-11-19",
      tripType: "roundtrip",
    })
  );
  check("return before departure is rejected", returnBeforeDeparture.ok === false);

  const sameAirport = parseFlightSearchParams(
    new URLSearchParams({ origin: "DXB", destination: "dxb", departureDate: "2026-11-20" })
  );
  check("identical origin and destination rejected", sameAirport.ok === false);

  const badCabin = parseFlightSearchParams(
    new URLSearchParams({
      origin: "DXB",
      destination: "KHI",
      departureDate: "2026-11-20",
      cabin: "Cargo",
    })
  );
  check("unknown cabin rejected", badCabin.ok === false);

  const tooManyPassengers = parseFlightSearchParams(
    new URLSearchParams({
      origin: "DXB",
      destination: "KHI",
      departureDate: "2026-11-20",
      passengers: "40",
    })
  );
  check("passenger count above limit rejected", tooManyPassengers.ok === false);

  const missingReturn = parseFlightSearchParams(
    new URLSearchParams({
      origin: "DXB",
      destination: "KHI",
      departureDate: "2026-11-20",
      tripType: "roundtrip",
    })
  );
  check("round trip without return date rejected", missingReturn.ok === false);

  const valid = parseFlightSearchParams(
    new URLSearchParams({
      origin: "DXB",
      destination: "KHI",
      departureDate: "2026-11-20",
      returnDate: "2026-11-28",
      passengers: "3",
      cabin: "Business",
      tripType: "roundtrip",
    })
  );
  check("valid search accepted", valid.ok === true);
  if (valid.ok) {
    check("valid search keeps cabin", valid.value.cabin === "Business");
    check("valid search keeps passengers", valid.value.passengers === 3);
  }

  section("Signed request token");
  const offers = await provider.searchFlights(baseQuery());
  check("token subject search returned offers", offers.length > 0);
  const flight: FlightSearchResult | undefined = offers[0]
    ? toPublicSearchResult(
        offers[0],
        signFlightRequestToken(offers[0], {
          origin: { iata: "DXB", name: "Dubai International Airport", city: "Dubai", country: "United Arab Emirates" },
          destination: { iata: "KHI", name: "Jinnah International Airport", city: "Karachi", country: "Pakistan" },
          departureDate: "2026-11-15",
          returnDate: "2026-11-25",
          passengers: 2,
          cabin: "Economy",
          tripType: "roundtrip",
        })
      )
    : undefined;
  check("signed token attached to flight", Boolean(flight?.requestToken));

  if (flight) {
    const payloadFromToken = verifyFlightRequestToken(flight.requestToken);
    check("token verifies", payloadFromToken !== null);
    check("token carries trusted airline", payloadFromToken?.airline === flight.outbound.airline);
    check("token carries trusted flight number", payloadFromToken?.flightNumber === flight.outbound.flightNumber);
    check("token carries trusted passengers", payloadFromToken?.passengers === 2);
    check("token carries trusted origin", payloadFromToken?.origin.iata === "DXB");

    const [body, signature] = flight.requestToken.split(".");
    const tampered = `${body}.${signature.slice(0, -2)}${signature.slice(-2) === "AA" ? "BB" : "AA"}`;
    check("tampered token rejected", verifyFlightRequestToken(tampered) === null);
    check("empty token rejected", verifyFlightRequestToken("") === null);
    check("garbage token rejected", verifyFlightRequestToken("not-a-token") === null);

    const expired = JSON.parse(
      Buffer.from(flight.requestToken.split(".")[0], "base64url").toString("utf8")
    ) as Record<string, unknown>;
    expired.exp = Date.now() - 1000;
    const expiredEncoded = Buffer.from(JSON.stringify(expired), "utf8").toString("base64url");
    const expiredToken = `${expiredEncoded}.${flight.requestToken.split(".")[1]}`;
    check("expired token rejected", verifyFlightRequestToken(expiredToken) === null);
  }

  section("Ignav provider (documented fixtures, zero API requests)");
  const oneWayQuery = baseQuery({
    origin: "SFO",
    destination: "JFK",
    tripType: "oneway",
    returnDate: null,
  });
  const mappedOneWay = mapIgnavItineraries(
    IGNAV_ONE_WAY_FIXTURE.itineraries,
    oneWayQuery,
    false
  );
  check("documented one-way response maps to a single offer", mappedOneWay.length === 1);
  const ignavOffer = mappedOneWay[0];
  check("connecting itinerary reports one stop", ignavOffer?.outbound.stops === 1);
  check(
    "stop airport preserved",
    ignavOffer?.outbound.stopAirports.length === 1 && ignavOffer.outbound.stopAirports[0] === "ORD"
  );
  check("leg duration preserved", ignavOffer?.outbound.durationMinutes === 475);
  check(
    "local departure time trimmed to minutes",
    ignavOffer?.outbound.departureTime === "2026-11-05T06:00"
  );
  check(
    "local arrival time trimmed to minutes",
    ignavOffer?.outbound.arrivalTime === "2026-11-05T16:55"
  );
  check("carrier name preserved", ignavOffer?.outbound.airline === "United Airlines");
  check("carrier code preserved", ignavOffer?.outbound.airlineCode === "UA");
  check(
    "flight numbers joined per segment",
    ignavOffer?.outbound.flightNumber === "UA1234 · UA5678"
  );
  check(
    "route endpoints mapped",
    ignavOffer?.outbound.origin.iata === "SFO" && ignavOffer.outbound.destination.iata === "JFK"
  );
  check(
    "airport places enriched from the local dataset",
    ignavOffer?.outbound.destination.city === "New York"
  );
  check("ignav_id becomes the offer id", ignavOffer?.id === IGNAV_ONE_WAY_FIXTURE.itineraries[0].ignav_id);
  check(
    "one-way search carries no inbound leg",
    ignavOffer?.tripType === "oneway" && ignavOffer.inbound === null
  );
  check("cabin mapped from the response", ignavOffer?.cabin === "Economy");
  check(
    "provider fare kept server-side only",
    ignavOffer?.internalFare?.amount === 542 && ignavOffer.internalFare.currency === "USD"
  );
  check(
    "seat availability reported without fabricated scarcity",
    ignavOffer?.availability === "Available" && ignavOffer.seatsRemaining === oneWayQuery.passengers
  );

  const publicIgnav = mappedOneWay.map((offer, index) =>
    toPublicSearchResult(offer, `ignav-token-${index}`)
  );
  check(
    "serializer strips the internal fare",
    publicIgnav.every((flight) => !("internalFare" in flight))
  );
  check("serialized ignav flights contain no price-like keys", findPriceKeys(publicIgnav).length === 0);
  let ignavGuardThrew = false;
  try {
    assertNoProviderPricing({ status: "available", flights: publicIgnav });
  } catch {
    ignavGuardThrew = true;
  }
  check("pricing guard accepts the ignav payload", !ignavGuardThrew);

  const roundTripQuery = baseQuery({
    origin: "SFO",
    destination: "JFK",
    tripType: "roundtrip",
    returnDate: "2026-11-25",
  });
  const mappedRoundTrip = mapIgnavItineraries(
    IGNAV_ROUND_TRIP_FIXTURE.itineraries,
    roundTripQuery,
    true
  );
  check("round-trip itinerary keeps its inbound leg", mappedRoundTrip.length === 1 && mappedRoundTrip[0].inbound !== null);
  check(
    "inbound leg runs the reverse route",
    mappedRoundTrip[0]?.inbound?.origin.iata === "JFK" &&
      mappedRoundTrip[0].inbound?.destination.iata === "SFO"
  );
  check("round-trip offer marked as roundtrip", mappedRoundTrip[0]?.tripType === "roundtrip");
  check(
    "round trip without a usable return leg is dropped",
    mapIgnavItineraries(IGNAV_ONE_WAY_FIXTURE.itineraries, roundTripQuery, true).length === 0
  );

  const malformed = mapIgnavItineraries(
    [
      {},
      { outbound: {} },
      { outbound: { segments: [] } },
      {
        outbound: {
          segments: [
            {
              departure_airport: "SFO",
              arrival_airport: "JFK",
              departure_time_local: "not-a-time",
              arrival_time_local: "2026-11-05T16:55:00",
            },
          ],
        },
      },
      {
        outbound: {
          segments: [
            {
              departure_airport: "SFO",
              arrival_airport: "JFK",
              departure_time_local: "2026-11-05T06:00:00",
              arrival_time_local: "2026-11-05T17:15:00",
              duration_minutes: 0,
              departure_time_utc: "2026-11-05T13:00:00Z",
              arrival_time_utc: "2026-11-05T17:15:00Z",
            },
          ],
        },
      },
    ],
    oneWayQuery,
    false
  );
  check("malformed itineraries skipped, usable ones kept", malformed.length === 1);
  check("duration falls back to the UTC timestamps", malformed[0]?.outbound.durationMinutes === 255);
  check(
    "non-array payload maps to no offers",
    mapIgnavItineraries("not-an-array", oneWayQuery, false).length === 0
  );

  check(
    "cabin classes map onto the Ignav enum",
    toIgnavCabin("Economy") === "economy" &&
      toIgnavCabin("Premium Economy") === "premium_economy" &&
      toIgnavCabin("Business") === "business" &&
      toIgnavCabin("First") === "first"
  );

  section("Provider selection");
  process.env.FLIGHT_PROVIDER = "ignav";
  const ignavProvider = getFlightProvider();
  check("ignav provider resolves when configured", ignavProvider.name === "ignav");
  const ignavAirports = await ignavProvider.searchAirports("Lahore");
  check("ignav airport lookup needs no API key", ignavAirports.some((airport) => airport.iata === "LHE"));

  const savedIgnavKey = process.env.IGNAV_API_KEY;
  const savedSearchSecret = process.env.FLIGHT_SEARCH_SECRET;
  process.env.IGNAV_API_KEY = "";
  process.env.FLIGHT_SEARCH_SECRET = "";
  let missingKeyMessage = "";
  try {
    await ignavProvider.searchFlights(baseQuery({ origin: "DXB", destination: "KHI" }));
  } catch (error) {
    missingKeyMessage = error instanceof Error ? error.message : "";
  }
  check(
    "ignav refuses to search without a key (no request is sent)",
    missingKeyMessage.includes("Missing Ignav API key")
  );
  if (savedIgnavKey === undefined) delete process.env.IGNAV_API_KEY;
  else process.env.IGNAV_API_KEY = savedIgnavKey;
  if (savedSearchSecret === undefined) delete process.env.FLIGHT_SEARCH_SECRET;
  else process.env.FLIGHT_SEARCH_SECRET = savedSearchSecret;

  process.env.FLIGHT_PROVIDER = "does-not-exist";
  let threw = false;
  try {
    getFlightProvider();
  } catch {
    threw = true;
  }
  check("unknown provider fails loudly", threw);
  process.env.FLIGHT_PROVIDER = "mock";
  check("mock stays the default provider", getFlightProvider().name === "mock");

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
