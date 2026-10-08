"use client";

import { useState } from "react";
import { ArrowLeftRight, Loader2, MapPin, Plane, Search, Users } from "lucide-react";
import { CABIN_CLASSES, type AirportOption, type CabinClass, type FlightSearchInput } from "@/types";
import { todayIsoDate } from "@/lib/flights/flight-math";
import { AirportCombobox } from "./airport-combobox";
import {
  CalendarField,
  earliestReturnDate,
  latestSelectableDate,
} from "./calendar-field";

export interface FlightSearchFormInitial {
  from?: string;
  to?: string;
  date?: string;
  passengers?: string;
}

interface FlightSearchFormProps {
  initial?: FlightSearchFormInitial;
  loading?: boolean;
  onSearch: (input: FlightSearchInput) => void;
}

const PASSENGER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const selectClassName =
  "w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:border-sky-400";

function sanitizePassengers(raw?: string): number | undefined {
  if (!raw) return undefined;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 9) return undefined;
  return parsed;
}

function sanitizeFutureDate(raw?: string): string | undefined {
  if (!raw) return undefined;
  const today = todayIsoDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;
  return raw >= today ? raw : undefined;
}

export function FlightSearchForm({ initial, loading = false, onSearch }: FlightSearchFormProps) {
  const [origin, setOrigin] = useState<AirportOption | null>(null);
  const [destination, setDestination] = useState<AirportOption | null>(null);
  const [tripType, setTripType] = useState<"oneway" | "roundtrip">("roundtrip");
  const [departureDate, setDepartureDate] = useState<string | null>(
    sanitizeFutureDate(initial?.date) ?? null
  );
  const [returnDate, setReturnDate] = useState<string | null>(null);
  const [passengers, setPassengers] = useState<number>(
    sanitizePassengers(initial?.passengers) ?? 1
  );
  const [cabin, setCabin] = useState<CabinClass>("Economy");
  const [error, setError] = useState<string | null>(null);

  const today = todayIsoDate();
  const maxDate = latestSelectableDate();
  const returnMinDate = earliestReturnDate(departureDate);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!origin) {
      setError("Select a departure airport from the list.");
      return;
    }
    if (!destination) {
      setError("Select a destination airport from the list.");
      return;
    }
    if (origin.iata === destination.iata) {
      setError("Departure and destination airports must be different.");
      return;
    }
    if (!departureDate) {
      setError("Choose a departure date.");
      return;
    }
    if (departureDate < today) {
      setError("Departure date cannot be in the past.");
      return;
    }
    if (tripType === "roundtrip" && returnDate && returnDate < departureDate) {
      setError("Return date cannot be before the departure date.");
      return;
    }

    // A round trip without a return date searches outbound only — it is never
    // blocked and never sent to the provider with a placeholder return date.
    const isRoundTrip = tripType === "roundtrip" && Boolean(returnDate);

    setError(null);
    onSearch({
      origin: origin.iata,
      destination: destination.iata,
      departureDate,
      returnDate: isRoundTrip ? returnDate : null,
      passengers,
      cabin,
      tripType: isRoundTrip ? "roundtrip" : "oneway",
    });
  };

  const handleSwap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const tripTypes: { id: "roundtrip" | "oneway"; label: string }[] = [
    { id: "roundtrip", label: "Round trip" },
    { id: "oneway", label: "One-way" },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white dark:bg-slate-800 p-4 sm:p-5 shadow-xl border border-slate-100 dark:border-slate-700"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-slate-100 dark:bg-slate-700 p-1">
          {tripTypes.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setTripType(option.id);
                if (option.id === "oneway") setReturnDate(null);
              }}
              className={`rounded-lg px-3 sm:px-4 py-1.5 text-xs font-semibold transition-all ${
                tripType === option.id
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleSwap}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors hover:border-sky-400 hover:text-sky-500"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          Swap
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-400">
          {error}
        </div>
      )}

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <AirportCombobox
          label="From"
          icon={Plane}
          value={origin}
          onChange={setOrigin}
          placeholder="City or airport"
          initialQuery={initial?.from}
        />
        <AirportCombobox
          label="To"
          icon={MapPin}
          value={destination}
          onChange={setDestination}
          placeholder="City or airport"
          initialQuery={initial?.to}
        />
        <CalendarField
          label="Departure"
          value={departureDate}
          minDate={today}
          maxDate={maxDate}
          placeholder="Select date"
          onChange={(value) => {
            setDepartureDate(value);
            if (value && returnDate && returnDate < value) setReturnDate(null);
          }}
        />
        <CalendarField
          label="Return"
          value={tripType === "roundtrip" ? returnDate : null}
          minDate={returnMinDate}
          maxDate={maxDate}
          align="end"
          disabled={tripType === "oneway"}
          placeholder={tripType === "oneway" ? "One-way" : "Select date"}
          onChange={setReturnDate}
        />
      </div>

      <div className="mt-3 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <label className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Passengers
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 focus-within:border-sky-400">
            <Users className="h-4 w-4 text-orange-500 shrink-0" />
            <select
              value={passengers}
              onChange={(event) => setPassengers(Number(event.target.value))}
              className="w-full bg-transparent text-sm text-slate-800 dark:text-white outline-none"
            >
              {PASSENGER_OPTIONS.map((count) => (
                <option key={count} value={count}>
                  {count} {count === 1 ? "passenger" : "passengers"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Cabin class
          </label>
          <select
            value={cabin}
            onChange={(event) => setCabin(event.target.value as CabinClass)}
            className={selectClassName}
          >
            {CABIN_CLASSES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end sm:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-sky-600 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {loading ? "Searching..." : "Search Flights"}
          </button>
        </div>
      </div>
    </form>
  );
}
