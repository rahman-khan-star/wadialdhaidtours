"use client";

import { useCallback, useState } from "react";
import type {
  FlightSearchInput,
  FlightSearchQuery,
  FlightSearchResponse,
  FlightSearchResult,
  FlightSearchStatus,
} from "@/types";

export interface SelectedFlight {
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

// Single place that talks to /api/flights/search, shared by the /flights page
// and the homepage search hub so the flight search flow is never duplicated.
export function useFlightSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<FlightSearchStatus | null>(null);
  const [flights, setFlights] = useState<FlightSearchResult[]>([]);
  const [query, setQuery] = useState<FlightSearchQuery | null>(null);
  const [lastInput, setLastInput] = useState<FlightSearchInput | null>(null);
  const [selected, setSelected] = useState<SelectedFlight | null>(null);
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(async (input: FlightSearchInput) => {
    setLoading(true);
    setError(null);
    setStatus(null);
    setFlights([]);
    setLastInput(input);
    setSearched(true);

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

  const requestFlight = useCallback(
    (flight: FlightSearchResult) => {
      if (!query) return;
      setSelected({ flight, query });
    },
    [query]
  );

  return {
    loading,
    error,
    status,
    flights,
    query,
    searched,
    selected,
    setSelected,
    runSearch,
    retry,
    requestFlight,
  };
}
