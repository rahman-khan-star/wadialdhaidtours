"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Plane } from "lucide-react";
import type {
  FlightSearchInput,
  FlightSearchQuery,
  FlightSearchResponse,
  FlightSearchResult,
  FlightSearchStatus,
} from "@/types";
import { FlightSearchForm } from "@/components/flights/flight-search-form";
import type { FlightSearchFormInitial } from "@/components/flights/flight-search-form";
import { FlightResults } from "@/components/flights/flight-results";
import { FlightInquiryModal } from "@/components/flights/flight-inquiry-modal";

interface FlightsViewProps {
  initial?: FlightSearchFormInitial;
}

interface SelectedFlight {
  flight: FlightSearchResult;
  query: FlightSearchQuery;
}

function toSearchParams(input: FlightSearchInput): URLSearchParams {
  const params = new URLSearchParams({
    origin: input.origin,
    destination: input.destination,
    departureDate: input.departureDate,
    tripType: input.tripType,
    passengers: String(input.passengers),
    cabin: input.cabin,
  });
  if (input.returnDate) params.set("returnDate", input.returnDate);
  return params;
}

export function FlightsView({ initial }: FlightsViewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<FlightSearchStatus | null>(null);
  const [flights, setFlights] = useState<FlightSearchResult[]>([]);
  const [query, setQuery] = useState<FlightSearchQuery | null>(null);
  const [lastInput, setLastInput] = useState<FlightSearchInput | null>(null);
  const [selected, setSelected] = useState<SelectedFlight | null>(null);

  const runSearch = useCallback(async (input: FlightSearchInput) => {
    setLoading(true);
    setError(null);
    setStatus(null);
    setFlights([]);
    setLastInput(input);

    try {
      const res = await fetch(`/api/flights/search?${toSearchParams(input).toString()}`);
      const data = (await res.json().catch(() => ({}))) as FlightSearchResponse & {
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || "We could not run that search. Please try again.");
      }

      setStatus(data.status);
      setFlights(data.flights);
      setQuery(data.query);
    } catch (err) {
      setStatus(null);
      setFlights([]);
      setQuery(null);
      setError(err instanceof Error ? err.message : "We could not run that search.");
    } finally {
      setLoading(false);
    }
  }, []);

  const retry = useCallback(() => {
    if (lastInput) void runSearch(lastInput);
  }, [lastInput, runSearch]);

  const handleRequest = useCallback(
    (flight: FlightSearchResult) => {
      if (!query) return;
      setSelected({ flight, query });
    },
    [query]
  );

  return (
    <>
      <section className="relative overflow-hidden py-14 sm:py-16">
        <div className="absolute inset-0 gradient-hero" />
        <div className="relative z-10 container-premium mx-auto px-4 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-white/90 backdrop-blur">
            <Plane className="h-3.5 w-3.5" />
            Flight Search
          </span>
          <h1
            className="text-3xl sm:text-4xl font-bold text-white mb-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Search flights, <span className="text-sky-200">we handle the rest</span>
          </h1>
          <p className="mx-auto max-w-2xl text-base text-white/80">
            Explore available routes and schedules. Once you find a flight that suits you, send
            a request and the Wadi Zaid team contacts you with a personalised quotation.
          </p>
        </div>
      </section>

      <section className="pb-14">
        <div className="container-premium mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="relative z-20 -mt-8 sm:-mt-10"
          >
            <FlightSearchForm initial={initial} loading={loading} onSearch={runSearch} />
          </motion.div>

          <div className="mt-8">
            <FlightResults
              status={status}
              flights={flights}
              loading={loading}
              error={error}
              query={query}
              onRequest={handleRequest}
              onRetry={retry}
            />
          </div>
        </div>
      </section>

      {selected && (
        <FlightInquiryModal
          flight={selected.flight}
          query={selected.query}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
