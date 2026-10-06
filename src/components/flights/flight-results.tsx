"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarX,
  CheckCircle2,
  Loader2,
  Plane,
  RefreshCw,
  SearchX,
} from "lucide-react";
import type { FlightLeg, FlightSearchQuery, FlightSearchResult, FlightSearchStatus } from "@/types";
import { dayOffset, formatDuration, timePart } from "@/lib/flights/flight-math";

interface FlightResultsProps {
  status: FlightSearchStatus | null;
  flights: FlightSearchResult[];
  loading: boolean;
  error: string | null;
  query: FlightSearchQuery | null;
  onRequest: (flight: FlightSearchResult) => void;
  onRetry: () => void;
}

function availabilityClasses(availability: FlightSearchResult["availability"]): string {
  if (availability === "Limited") {
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30";
  }
  return "bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/30";
}

function LegDetails({ leg, caption }: { leg: FlightLeg; caption: string }) {
  const offset = dayOffset(leg.departureTime, leg.arrivalTime);
  const stopLabel =
    leg.stops === 0
      ? "Direct"
      : `${leg.stops} stop${leg.stops > 1 ? "s" : ""}`;

  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {caption}
      </p>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="min-w-0 shrink-0">
          <p className="text-lg font-bold leading-tight text-slate-800 dark:text-white">
            {timePart(leg.departureTime)}
          </p>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {leg.origin.iata}
          </p>
          <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">
            {leg.origin.city}
          </p>
        </div>

        <div className="min-w-0 flex-1 text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {formatDuration(leg.durationMinutes)}
          </p>
          <div className="relative my-1.5">
            <div className="h-px w-full bg-slate-200 dark:bg-slate-600" />
            <Plane className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-90 bg-white text-sky-500 dark:bg-slate-800" />
          </div>
          <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
            {stopLabel}
          </p>
          {leg.stopAirports.length > 0 && (
            <p className="truncate text-[10px] text-slate-400 dark:text-slate-500">
              via {leg.stopAirports.join(", ")}
            </p>
          )}
        </div>

        <div className="min-w-0 shrink-0 text-right">
          <p className="text-lg font-bold leading-tight text-slate-800 dark:text-white">
            {timePart(leg.arrivalTime)}
            {offset > 0 && (
              <span className="ml-1 align-super text-[10px] font-semibold text-sky-500">
                +{offset}
              </span>
            )}
          </p>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {leg.destination.iata}
          </p>
          <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">
            {leg.destination.city}
          </p>
        </div>
      </div>
    </div>
  );
}

function FlightCard({
  flight,
  index,
  onRequest,
}: {
  flight: FlightSearchResult;
  index: number;
  onRequest: (flight: FlightSearchResult) => void;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3) }}
      className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-xs font-bold text-sky-600 ring-1 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20">
            {flight.outbound.airlineCode}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">
              {flight.outbound.airline}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {flight.outbound.flightNumber}
              {flight.inbound && ` · ${flight.inbound.flightNumber}`}
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${availabilityClasses(
            flight.availability
          )}`}
        >
          {flight.availability === "Limited"
            ? `Limited · ${flight.seatsRemaining} seats`
            : "Available"}
        </span>
      </div>

      <div className="mt-4 space-y-4">
        <LegDetails leg={flight.outbound} caption="Outbound" />
        {flight.inbound && (
          <>
            <div className="h-px bg-slate-100 dark:bg-slate-700" />
            <LegDetails leg={flight.inbound} caption="Return" />
          </>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span>{flight.cabin}</span>
          <span>
            {flight.seatsRemaining} seat{flight.seatsRemaining === 1 ? "" : "s"} available
          </span>
          <span>{flight.tripType === "roundtrip" ? "Round trip" : "One-way"}</span>
        </div>

        <button
          type="button"
          onClick={() => onRequest(flight)}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-sky-600"
        >
          Request This Flight
        </button>
      </div>
    </motion.article>
  );
}

function Panel({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-white">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">
        {description}
      </p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function FlightResults({
  status,
  flights,
  loading,
  error,
  query,
  onRequest,
  onRetry,
}: FlightResultsProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
        <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
          Searching available flights...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <Panel
        icon={<AlertTriangle className="h-6 w-6 text-amber-500" />}
        title="We could not run that search"
        description={error}
        action={
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-sky-600"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        }
      />
    );
  }

  if (!status) {
    return (
      <Panel
        icon={<SearchX className="h-6 w-6 text-slate-400" />}
        title="Search for available flights"
        description="Choose your origin, destination and dates above to see which flight options are available. Our team then handles the quotation for you."
      />
    );
  }

  if (status === "unavailable") {
    return (
      <Panel
        icon={<AlertTriangle className="h-6 w-6 text-amber-500" />}
        title="Search unavailable"
        description="We could not reach flight availability right now. Please try again in a moment."
        action={
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-sky-600"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        }
      />
    );
  }

  if (status === "no_flights" || flights.length === 0) {
    return (
      <Panel
        icon={<CalendarX className="h-6 w-6 text-slate-400" />}
        title="No flights found"
        description="There are no flights available for this route on the selected dates. Try different dates, another airport, or a different cabin class."
      />
    );
  }

  const summary = query
    ? `${query.origin?.city ?? query.origin?.iata ?? ""} to ${
        query.destination?.city ?? query.destination?.iata ?? ""
      }`
    : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">
            {flights.length} flight{flights.length === 1 ? "" : "s"} available
            {summary && <span className="text-slate-400 dark:text-slate-500"> · {summary}</span>}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Schedule and availability only — send a request and our team provides your
            personalised quotation.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Search results
        </span>
      </div>

      <div className="space-y-3">
        {flights.map((flight, index) => (
          <FlightCard key={flight.id} flight={flight} index={index} onRequest={onRequest} />
        ))}
      </div>
    </div>
  );
}
