"use client";

import { motion } from "framer-motion";
import { Plane } from "lucide-react";
import type { FlightSearchFormInitial } from "@/components/flights/flight-search-form";
import { FlightSearchForm } from "@/components/flights/flight-search-form";
import { FlightResults } from "@/components/flights/flight-results";
import { FlightInquiryModal } from "@/components/flights/flight-inquiry-modal";
import { useFlightSearch } from "@/components/flights/use-flight-search";

interface FlightsViewProps {
  initial?: FlightSearchFormInitial;
}

export function FlightsView({ initial }: FlightsViewProps) {
  const {
    loading,
    error,
    status,
    flights,
    query,
    selected,
    setSelected,
    runSearch,
    retry,
    requestFlight,
  } = useFlightSearch();

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
              onRequest={requestFlight}
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
