/**
 * Verification for the flight search + inquiry flow.
 *
 * Run: npx tsx scripts/verify-flights.ts
 *
 * Covers provider search, mock inventory, provider selection + safe
 * diagnostics, the "no price" guarantee, search parameter validation and the
 * signed request token.
 */
import {
  assertNoProviderPricing,
  getFlightProvider,
  getFlightProviderDiagnostics,
  parseFlightSearchParams,
  signFlightRequestToken,
  toPublicSearchResult,
  verifyFlightRequestToken,
} from "../src/lib/flights";
import {
  DEFAULT_FLIGHT_PRICING,
  computeSellingPrice,
  parseFlightPricingField,
  parseFlightPricingRow,
  validateFlightPricingSettings,
} from "../src/lib/flights/pricing";
import type { FlightPricingSettings } from "../src/lib/flights/pricing-config";
import {
  mapIgnavItineraries,
  resolveIgnavApiKey,
  toIgnavCabin,
} from "../src/lib/flights/ignav-provider";
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

// Failure text is useful for diagnosis, but a configured credential must never
// be printed — strip it before it reaches the console.
function redactSecrets(value: unknown, ...secrets: (string | undefined)[]): string {
  let message = value instanceof Error ? `${value.name}: ${value.message}` : String(value);
  for (const secret of secrets) {
    if (secret && secret.length >= 8) message = message.split(secret).join("[redacted]");
  }
  return message.slice(0, 300);
}

const PRICE_KEY_PATTERN = /price|fare|amount|cost|currency|quote|markup|pkr|aed/i;

// Mirrors the production guard in serialize.ts: the only price-like paths a
// public payload may contain are the sanitized final selling price and its
// two amounts.
const ALLOWED_PRICE_PATHS = [
  /^flights\[\d+\]\.finalPrice$/,
  /^flights\[\d+\]\.finalPrice\.(aed|pkr)$/,
];

function findPriceKeys(value: unknown, path = "", found: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach((item, index) => findPriceKeys(item, `${path}[${index}]`, found));
  } else if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      const next = path ? `${path}.${key}` : key;
      if (PRICE_KEY_PATTERN.test(key) && !ALLOWED_PRICE_PATHS.some((re) => re.test(next))) {
        found.push(next);
      }
      findPriceKeys(entry, next, found);
    }
  }
  return found;
}

// Provider fare + the default admin pricing rules -> the price a customer sees.
function publicPriceFor(offer: { internalFare?: { amount: number; currency: string } }) {
  return computeSellingPrice(offer.internalFare, DEFAULT_FLIGHT_PRICING);
}

// A settings object with every field valid, used as the base for pricing tests.
function pricingSettings(overrides: Partial<FlightPricingSettings> = {}): FlightPricingSettings {
  return { ...DEFAULT_FLIGHT_PRICING, ...overrides };
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
  // Capture the environment as configured, then pin the fixture sections to
  // the mock provider so verification never spends a live API request. The
  // final section restores the real configuration and reports it.
  const originalProviderValue = process.env.FLIGHT_PROVIDER;
  const originalApiKey = process.env.IGNAV_API_KEY;
  process.env.FLIGHT_PROVIDER = "mock";
  delete process.env.IGNAV_API_KEY;

  const provider = getFlightProvider();
  check("explicit FLIGHT_PROVIDER=mock resolves to mock", provider.name === "mock");

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

  section("Public payload: sanitized final selling price only");
  const sample = roundTrip[0];
  check("provider internally carries a fare", typeof sample?.internalFare?.amount === "number");

  const publicFlights = roundTrip.map((offer, index) =>
    toPublicSearchResult(offer, `token-${index}`, publicPriceFor(offer))
  );
  const payload = {
    status: "available",
    flights: publicFlights,
    query: {
      origin: null,
      destination: null,
      departureDate: "2026-11-15",
      returnDate: null,
      passengers: 1,
      cabin: "Economy",
      tripType: "roundtrip",
    },
  };
  const leaked = findPriceKeys(payload);
  check(
    "serialized flights contain no unexpected price-like keys",
    leaked.length === 0,
    leaked.join(", ")
  );
  check(
    "every serialized flight carries a final price",
    publicFlights.length > 0 && publicFlights.every((flight) => flight.finalPrice !== null)
  );
  check(
    "final price exposes exactly aed and pkr",
    publicFlights.every(
      (flight) =>
        flight.finalPrice !== null &&
        Object.keys(flight.finalPrice).sort().join(",") === "aed,pkr"
    )
  );
  check(
    "internal fare never survives serialization",
    publicFlights.every((flight) => !("internalFare" in flight))
  );

  let guardThrew = false;
  try {
    assertNoProviderPricing(payload);
  } catch {
    guardThrew = true;
  }
  check("pricing guard accepts the sanitized payload", !guardThrew);

  // A null price is a designed state (fare or rate unavailable), not a leak.
  let nullPriceAccepted = false;
  try {
    assertNoProviderPricing({ status: "available", flights: [{ finalPrice: null }] });
    nullPriceAccepted = true;
  } catch {
    nullPriceAccepted = false;
  }
  check("pricing guard accepts an explicit unavailable price", nullPriceAccepted);

  const rejectedPayloads: [string, unknown][] = [
    ["a raw provider price", { flights: [{ price: 100 }] }],
    ["a provider price object", { flights: [{ price: { amount: 100, currency: "USD" } }] }],
    ["an internal fare field", { flights: [{ internalFare: { amount: 100, currency: "USD" } }] }],
    ["a final price with the wrong keys", { flights: [{ finalPrice: { amount: 100 } }] }],
    [
      "a final price with an extra field",
      { flights: [{ finalPrice: { aed: 100, pkr: 7600, base: 90 } }] },
    ],
    ["a scalar final price", { flights: [{ finalPrice: 100 }] }],
    [
      "a leaked markup setting",
      { flights: [{ finalPrice: { aed: 100, pkr: 7600 }, markupPercent: 10 }] },
    ],
    ["a leaked exchange rate", { pkrPerAed: 76 }],
    ["a leaked fixed charge", { flights: [{ fixedChargePkr: 3000 }] }],
    ["a final price outside the flights array", { finalPrice: { aed: 100, pkr: 7600 } }],
  ];

  for (const [label, badPayload] of rejectedPayloads) {
    let threw = false;
    try {
      assertNoProviderPricing(badPayload);
    } catch {
      threw = true;
    }
    check(`pricing guard rejects ${label}`, threw);
  }

  section("Flight pricing settings validation");
  const modeAccepted = parseFlightPricingField("mode", " Both ");
  check(
    "markup mode accepted and normalised",
    modeAccepted.ok === true && modeAccepted.value === "both"
  );
  check("unknown markup mode rejected", parseFlightPricingField("mode", "discount").ok === false);
  check("non-string markup mode rejected", parseFlightPricingField("mode", 10).ok === false);

  check("positive percentage accepted", parseFlightPricingField("markupPercent", 15).ok === true);
  check(
    "zero percentage accepted (no percentage markup)",
    parseFlightPricingField("markupPercent", 0).ok === true
  );
  check("negative percentage rejected", parseFlightPricingField("markupPercent", -1).ok === false);
  check(
    "percentage above 100 rejected",
    parseFlightPricingField("markupPercent", 101).ok === false
  );
  check(
    "non-numeric percentage rejected",
    parseFlightPricingField("markupPercent", "ten").ok === false
  );
  check("empty percentage rejected", parseFlightPricingField("markupPercent", "").ok === false);
  check(
    "NaN percentage rejected",
    parseFlightPricingField("markupPercent", Number.NaN).ok === false
  );

  check("fixed charge accepted", parseFlightPricingField("fixedChargePkr", 3000).ok === true);
  check(
    "negative fixed charge rejected",
    parseFlightPricingField("fixedChargePkr", -2000).ok === false
  );
  check(
    "fixed charge above the cap rejected",
    parseFlightPricingField("fixedChargePkr", 2_000_000).ok === false
  );

  check("PKR-per-AED rate accepted", parseFlightPricingField("pkrPerAed", 76).ok === true);
  check(
    "zero PKR-per-AED rate rejected",
    parseFlightPricingField("pkrPerAed", 0).ok === false
  );
  check(
    "negative PKR-per-AED rate rejected",
    parseFlightPricingField("pkrPerAed", -76).ok === false
  );
  check(
    "provider-to-AED rate accepted",
    parseFlightPricingField("aedPerProviderUnit", 3.6725).ok === true
  );
  check(
    "zero provider-to-AED rate rejected",
    parseFlightPricingField("aedPerProviderUnit", 0).ok === false
  );

  const validSettings = {
    mode: "both",
    markupPercent: 15,
    fixedChargePkr: 2000,
    pkrPerAed: 76,
    aedPerProviderUnit: 3.6725,
  };
  check("complete settings accepted", validateFlightPricingSettings(validSettings).ok === true);
  check(
    "settings missing a field rejected",
    validateFlightPricingSettings({ mode: "percentage" }).ok === false
  );
  check("null settings rejected", validateFlightPricingSettings(null).ok === false);
  check("array settings rejected", validateFlightPricingSettings([1, 2]).ok === false);
  check(
    "malformed value inside settings rejected",
    validateFlightPricingSettings({ ...validSettings, pkrPerAed: "n/a" }).ok === false
  );

  section("Flight pricing settings read from storage");
  const fromMissingRow = parseFlightPricingRow(null);
  check(
    "missing settings row falls back to the defaults",
    fromMissingRow !== null &&
      fromMissingRow.mode === DEFAULT_FLIGHT_PRICING.mode &&
      fromMissingRow.markupPercent === DEFAULT_FLIGHT_PRICING.markupPercent &&
      fromMissingRow.pkrPerAed === DEFAULT_FLIGHT_PRICING.pkrPerAed
  );
  const fromLegacyRow = parseFlightPricingRow({ company_name: "Wadi Zaid" });
  check(
    "row without pricing columns falls back to the defaults",
    fromLegacyRow !== null && fromLegacyRow.mode === DEFAULT_FLIGHT_PRICING.mode
  );

  const goodRow = {
    flight_pricing_mode: "both",
    flight_markup_percent: 20,
    flight_fixed_charge_pkr: 5000,
    flight_pkr_per_aed: 76,
    flight_aed_per_provider_unit: 3.6725,
  };
  const fromRow = parseFlightPricingRow(goodRow);
  check(
    "stored pricing row is read back",
    fromRow !== null &&
      fromRow.mode === "both" &&
      fromRow.markupPercent === 20 &&
      fromRow.fixedChargePkr === 5000 &&
      fromRow.pkrPerAed === 76
  );
  check(
    "numeric strings from Postgres are accepted",
    parseFlightPricingRow({ ...goodRow, flight_markup_percent: "15" })?.markupPercent === 15
  );
  check(
    "negative stored percentage makes settings unusable",
    parseFlightPricingRow({ ...goodRow, flight_markup_percent: -5 }) === null
  );
  check(
    "unknown stored mode makes settings unusable",
    parseFlightPricingRow({ ...goodRow, flight_pricing_mode: "half" }) === null
  );
  check(
    "zero stored exchange rate makes settings unusable",
    parseFlightPricingRow({ ...goodRow, flight_pkr_per_aed: 0 }) === null
  );
  check(
    "non-numeric stored rate makes settings unusable",
    parseFlightPricingRow({ ...goodRow, flight_aed_per_provider_unit: "n/a" }) === null
  );

  section("Selling price calculation — percentage, fixed and both");
  const aedFare = { amount: 1000, currency: "AED" };
  const usdFare = { amount: 200, currency: "USD" };

  const pct10 = computeSellingPrice(
    aedFare,
    pricingSettings({ mode: "percentage", markupPercent: 10, fixedChargePkr: 0 })
  );
  check(
    "percentage mode: provider fare + 10% (AED)",
    pct10 !== null && pct10.aed === 1100 && pct10.pkr === 83600
  );

  for (const pct of [5, 15, 20]) {
    const price = computeSellingPrice(
      aedFare,
      pricingSettings({ mode: "percentage", markupPercent: pct, fixedChargePkr: 0 })
    );
    check(
      `percentage mode: provider fare + ${pct}% (AED)`,
      price !== null && price.aed === 1000 * (1 + pct / 100) && price.pkr === price.aed * 76
    );
  }

  const fixedOnly = computeSellingPrice(
    aedFare,
    pricingSettings({ mode: "fixed", markupPercent: 10, fixedChargePkr: 3000 })
  );
  check(
    "fixed mode: fare + PKR 3,000, percentage ignored",
    fixedOnly !== null &&
      Math.abs(fixedOnly.aed - (1000 + 3000 / 76)) < 0.005 &&
      fixedOnly.pkr === 79000
  );

  const both = computeSellingPrice(
    aedFare,
    pricingSettings({ mode: "both", markupPercent: 10, fixedChargePkr: 3000 })
  );
  check(
    "both mode: fare + 10% + PKR 3,000",
    both !== null &&
      Math.abs(both.aed - (1100 + 3000 / 76)) < 0.005 &&
      both.pkr === 86600
  );

  const zeroMarkup = computeSellingPrice(
    aedFare,
    pricingSettings({ mode: "percentage", markupPercent: 0, fixedChargePkr: 0 })
  );
  check(
    "zero markup passes the converted fare through unchanged",
    zeroMarkup !== null && zeroMarkup.aed === 1000 && zeroMarkup.pkr === 76000
  );

  section("AED / PKR currency conversion");
  const usdPrice = computeSellingPrice(
    usdFare,
    pricingSettings({ mode: "percentage", markupPercent: 10, fixedChargePkr: 0 })
  );
  check(
    "USD fare converted with the provider rate, then marked up",
    usdPrice !== null && Math.abs(usdPrice.aed - 200 * 3.6725 * 1.1) < 0.005
  );
  check(
    "PKR amount derives from the displayed AED amount",
    usdPrice !== null && usdPrice.pkr === Math.round(usdPrice.aed * 76)
  );
  check(
    "selling price is never below the converted provider fare",
    usdPrice !== null && usdPrice.aed > 200 * 3.6725
  );

  const pkrFare = computeSellingPrice(
    { amount: 7600, currency: "PKR" },
    pricingSettings({ mode: "percentage", markupPercent: 0, fixedChargePkr: 0 })
  );
  check(
    "PKR-denominated fare converted with the PKR-per-AED rate",
    pkrFare !== null && pkrFare.aed === 100 && pkrFare.pkr === 7600
  );

  const noRate = computeSellingPrice(
    { amount: 100, currency: "EUR" },
    pricingSettings({ aedPerProviderUnit: 0 })
  );
  check("unknown currency without a usable rate is unavailable", noRate === null);

  section("Unavailable-price states");
  check("missing fare is unavailable", computeSellingPrice(undefined, DEFAULT_FLIGHT_PRICING) === null);
  check(
    "zero-amount provider placeholder is unavailable",
    computeSellingPrice({ amount: 0, currency: "USD" }, DEFAULT_FLIGHT_PRICING) === null
  );
  check(
    "negative fare is unavailable",
    computeSellingPrice({ amount: -100, currency: "USD" }, DEFAULT_FLIGHT_PRICING) === null
  );
  check(
    "NaN fare is unavailable",
    computeSellingPrice({ amount: Number.NaN, currency: "USD" }, DEFAULT_FLIGHT_PRICING) === null
  );
  check(
    "missing fare currency is unavailable",
    computeSellingPrice({ amount: 100, currency: "   " }, DEFAULT_FLIGHT_PRICING) === null
  );
  check(
    "no pricing settings means no price",
    computeSellingPrice({ amount: 100, currency: "AED" }, null) === null
  );
  check(
    "an unavailable price still serializes as a clean null",
    (() => {
      const flight = toPublicSearchResult(roundTrip[0]!, "no-price-token", null);
      return flight.finalPrice === null && findPriceKeys({ flights: [flight] }).length === 0;
    })()
  );

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
      departureDate: "2026-11-15",
      tripType: "roundtrip",
    })
  );
  check(
    "round trip without return date falls back to a one-way search",
    missingReturn.ok === true &&
      missingReturn.value.tripType === "oneway" &&
      missingReturn.value.returnDate === null
  );

  if (missingReturn.ok) {
    const outboundOnly = await provider.searchFlights(missingReturn.value);
    check(
      "one-way path taken for a round trip without a return date",
      outboundOnly.length > 0 &&
        outboundOnly.every((offer) => offer.inbound === null && offer.tripType === "oneway")
    );
  }

  const strayReturnDate = parseFlightSearchParams(
    new URLSearchParams({
      origin: "DXB",
      destination: "KHI",
      departureDate: "2026-11-20",
      returnDate: "2026-11-25",
      tripType: "oneway",
    })
  );
  check(
    "one-way search ignores a stray return date",
    strayReturnDate.ok === true &&
      strayReturnDate.value.tripType === "oneway" &&
      strayReturnDate.value.returnDate === null
  );

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
    check("valid round trip keeps cabin", valid.value.cabin === "Business");
    check("valid round trip keeps passengers", valid.value.passengers === 3);
    check("valid round trip stays roundtrip", valid.value.tripType === "roundtrip");
    check("valid round trip keeps its return date", valid.value.returnDate === "2026-11-28");
  }

  const roundTripWithReturn = parseFlightSearchParams(
    new URLSearchParams({
      origin: "DXB",
      destination: "KHI",
      departureDate: "2026-11-15",
      returnDate: "2026-11-25",
      passengers: "1",
      cabin: "Economy",
      tripType: "roundtrip",
    })
  );
  check("round trip with a return date is accepted", roundTripWithReturn.ok === true);
  if (roundTripWithReturn.ok) {
    const withReturn = await provider.searchFlights(roundTripWithReturn.value);
    check(
      "round trip with a return date produces inbound legs",
      withReturn.length > 0 && withReturn.every((offer) => offer.inbound !== null)
    );
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
        }),
        publicPriceFor(offers[0])
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
    toPublicSearchResult(offer, `ignav-token-${index}`, publicPriceFor(offer))
  );
  check(
    "serializer strips the internal fare",
    publicIgnav.every((flight) => !("internalFare" in flight))
  );
  check(
    "serialized ignav flights carry the final price",
    publicIgnav.length > 0 && publicIgnav.every((flight) => flight.finalPrice !== null)
  );
  check(
    "serialized ignav flights contain no price-like keys",
    findPriceKeys({ flights: publicIgnav }).length === 0
  );
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

  process.env.FLIGHT_PROVIDER = "real";
  check("FLIGHT_PROVIDER=real selects the real provider", getFlightProvider().name === "ignav");
  process.env.FLIGHT_PROVIDER = "  \"LIVE\"  ";
  check(
    "provider value tolerates case, whitespace and quotes",
    getFlightProvider().name === "ignav"
  );

  process.env.FLIGHT_PROVIDER = "ignav";
  process.env.IGNAV_API_KEY = "ignav-test-key-value";
  const realDiagnostics = getFlightProviderDiagnostics();
  check(
    "diagnostics report the real provider",
    realDiagnostics.provider === "ignav" && realDiagnostics.realProviderRequested
  );
  check(
    "diagnostics report the key as a boolean only",
    realDiagnostics.ignavApiKeyConfigured === true
  );
  check(
    "diagnostics never contain the key value",
    !JSON.stringify(realDiagnostics).includes("ignav-test-key-value")
  );

  delete process.env.FLIGHT_PROVIDER;
  check(
    "unset FLIGHT_PROVIDER with a configured key selects the real provider",
    getFlightProvider().name === "ignav"
  );
  check(
    "unset FLIGHT_PROVIDER is reported as <unset>",
    getFlightProviderDiagnostics().configuredValue === "<unset>"
  );

  delete process.env.IGNAV_API_KEY;
  check(
    "unset FLIGHT_PROVIDER without a key resolves to mock",
    getFlightProvider().name === "mock"
  );

  process.env.IGNAV_API_KEY = "ignav-test-key-value";
  process.env.FLIGHT_PROVIDER = "mock";
  check(
    "explicit mock still wins over a configured key",
    getFlightProvider().name === "mock"
  );
  delete process.env.IGNAV_API_KEY;

  const savedIgnavKey = process.env.IGNAV_API_KEY;
  const savedSearchSecret = process.env.FLIGHT_SEARCH_SECRET;
  process.env.FLIGHT_PROVIDER = "ignav";
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

  process.env.IGNAV_API_KEY = "ignav-test-key-value";
  check(
    "IGNAV_API_KEY is the credential the provider reads",
    resolveIgnavApiKey() === "ignav-test-key-value"
  );
  process.env.IGNAV_API_KEY = "   ";
  process.env.FLIGHT_SEARCH_SECRET = "dedicated-hmac-secret-not-an-api-key";
  check(
    "FLIGHT_SEARCH_SECRET is never accepted as an API key",
    resolveIgnavApiKey() === null
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
  const unknownDiagnostics = getFlightProviderDiagnostics();
  check(
    "diagnostics flag an unknown value without echoing it",
    unknownDiagnostics.provider === "unknown" &&
      unknownDiagnostics.configuredValue === "<unrecognized>"
  );
  process.env.FLIGHT_PROVIDER = "mock";
  check("mock stays selectable", getFlightProvider().name === "mock");

  section("Configured provider (this environment)");
  if (originalProviderValue === undefined) delete process.env.FLIGHT_PROVIDER;
  else process.env.FLIGHT_PROVIDER = originalProviderValue;
  if (originalApiKey === undefined) delete process.env.IGNAV_API_KEY;
  else process.env.IGNAV_API_KEY = originalApiKey;

  const configured = getFlightProviderDiagnostics();
  console.log(
    `  INFO  provider=${configured.provider} FLIGHT_PROVIDER=${configured.configuredValue} ignavKeyConfigured=${configured.ignavApiKeyConfigured} searchTokenSecretConfigured=${configured.searchTokenSecretConfigured}`
  );
  check(
    "effective provider resolves to a known provider",
    configured.provider === "mock" || configured.provider === "ignav"
  );

  if (configured.provider === "ignav" && configured.ignavApiKeyConfigured) {
    try {
      const liveProvider = getFlightProvider();
      const liveOffers = await liveProvider.searchFlights(
        baseQuery({ origin: "DXB", destination: "KHI", tripType: "oneway", returnDate: null })
      );
      check("real provider returns an itinerary array", Array.isArray(liveOffers));
      if (liveOffers.length > 0) {
        check(
          "real itineraries carry schedule fields",
          liveOffers.every(
            (offer) =>
              Boolean(offer.outbound.airline) &&
              Boolean(offer.outbound.flightNumber) &&
              Boolean(offer.outbound.departureTime) &&
              offer.outbound.durationMinutes > 0
          )
        );
      }
      const livePublic = liveOffers.map((offer, index) =>
        toPublicSearchResult(offer, `live-${index}`, publicPriceFor(offer))
      );
      const liveLeaked = findPriceKeys({ flights: livePublic });
      check(
        "real provider results contain no unexpected price-like keys",
        liveLeaked.length === 0,
        liveLeaked.join(", ")
      );
      let liveGuardThrew = false;
      try {
        assertNoProviderPricing({ status: "available", flights: livePublic });
      } catch {
        liveGuardThrew = true;
      }
      check("pricing guard accepts the real provider payload", !liveGuardThrew);
      console.log(`  INFO  real provider responded with ${liveOffers.length} mapped itineraries`);
    } catch (error) {
      check(
        "real provider search succeeded",
        false,
        redactSecrets(error, originalApiKey)
      );
    }
  } else {
    console.log("  SKIP  live real-provider check (configured provider is mock, or no key present)");
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
