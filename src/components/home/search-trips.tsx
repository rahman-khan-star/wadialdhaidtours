"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Clock,
  Layers,
  Loader2,
  MapPin,
  Plane,
  Search,
  Users,
} from "lucide-react";
import type { AirportOption, FlightSearchInput, Hotel, TourPackage } from "@/types";
import { AirportCombobox } from "@/components/flights/airport-combobox";
import { CalendarField, latestSelectableDate } from "@/components/flights/calendar-field";
import { FlightResults } from "@/components/flights/flight-results";
import { FlightInquiryModal } from "@/components/flights/flight-inquiry-modal";
import { useFlightSearch } from "@/components/flights/use-flight-search";
import { todayIsoDate } from "@/lib/flights/flight-math";
import { filterHotels, filterPackages, TOUR_CATEGORIES } from "@/lib/search-filters";
import { HotelSearchResults, TripSearchResults } from "./search-results";
import type { HotelSearchContext, TripSearchContext } from "./search-results";

const tabs = [
  { id: "flights", label: "Flights", icon: Plane },
  { id: "hotels", label: "Hotels", icon: Building2 },
  { id: "trips", label: "Trips", icon: MapPin },
];

const fieldBoxClassName =
  "flex items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-2 sm:px-3 py-2 sm:py-2.5 focus-within:border-sky-400";
const fieldInputClassName =
  "flex-1 bg-transparent text-xs sm:text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none";
const labelClassName =
  "text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider";
const submitClassName =
  "flex w-full items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-sky-500 px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition-all duration-200 hover:bg-sky-600 hover:shadow-lg hover:shadow-sky-500/30 disabled:opacity-60";

interface SearchTripsProps {
  hotels: Hotel[];
  packages: TourPackage[];
}

export function SearchTrips({ hotels, packages }: SearchTripsProps) {
  const [activeTab, setActiveTab] = useState("flights");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("");
  const [tripCategory, setTripCategory] = useState("all");
  const [tripDuration, setTripDuration] = useState("");

  const [origin, setOrigin] = useState<AirportOption | null>(null);
  const [arrival, setArrival] = useState<AirportOption | null>(null);
  const [departureDate, setDepartureDate] = useState<string | null>(null);
  const [flightFormError, setFlightFormError] = useState<string | null>(null);
  const flightSearch = useFlightSearch();

  const [hotelSearch, setHotelSearch] = useState<HotelSearchContext | null>(null);
  const [tripSearch, setTripSearch] = useState<TripSearchContext | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);
  const today = todayIsoDate();
  const maxDate = latestSelectableDate();

  const hotelResults = useMemo(
    () => (hotelSearch ? filterHotels(hotels, hotelSearch.query) : []),
    [hotels, hotelSearch]
  );
  const tripResults = useMemo(
    () => (tripSearch ? filterPackages(packages, tripSearch) : []),
    [packages, tripSearch]
  );

  const scrollToResults = () => {
    window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
  };

  const handleFlightSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!origin) {
      setFlightFormError("Select a departure airport from the list.");
      return;
    }
    if (!arrival) {
      setFlightFormError("Select a destination airport from the list.");
      return;
    }
    if (origin.iata === arrival.iata) {
      setFlightFormError("Departure and destination airports must be different.");
      return;
    }
    if (!departureDate) {
      setFlightFormError("Choose a departure date.");
      return;
    }
    if (departureDate < today) {
      setFlightFormError("Departure date cannot be in the past.");
      return;
    }

    setFlightFormError(null);
    scrollToResults();
    const input: FlightSearchInput = {
      origin: origin.iata,
      destination: arrival.iata,
      departureDate,
      returnDate: null,
      passengers: 1,
      cabin: "Economy",
      tripType: "oneway",
    };
    void flightSearch.runSearch(input);
  };

  const handleHotelSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHotelSearch({
      query: destination.trim(),
      checkIn: date || null,
      guests: guests.trim(),
    });
    scrollToResults();
  };

  const handleTripSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = tripDuration.trim();
    const parsed = Number(trimmed);
    setTripSearch({
      query: destination.trim(),
      category: tripCategory,
      days: trimmed && Number.isInteger(parsed) && parsed > 0 ? parsed : null,
    });
    scrollToResults();
  };

  return (
    <>
      <section className="relative -mt-24 sm:-mt-28 z-20 px-4 mb-8">
        <div className="container-premium mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-xl border border-slate-100 dark:border-slate-700"
          >
            <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "flights" && (
                  <>
                    <form
                      onSubmit={handleFlightSearch}
                      className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
                    >
                      <AirportCombobox
                        label="From"
                        icon={Plane}
                        value={origin}
                        onChange={setOrigin}
                        placeholder="City or airport"
                      />
                      <AirportCombobox
                        label="To"
                        icon={MapPin}
                        value={arrival}
                        onChange={setArrival}
                        placeholder="City or airport"
                      />
                      <CalendarField
                        label="Date"
                        value={departureDate}
                        minDate={today}
                        maxDate={maxDate}
                        placeholder="Select date"
                        onChange={(value) => {
                          setDepartureDate(value);
                          setFlightFormError(null);
                        }}
                      />

                      <div className="flex items-end">
                        <button
                          type="submit"
                          disabled={flightSearch.loading}
                          className={submitClassName}
                        >
                          {flightSearch.loading ? (
                            <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                          ) : (
                            <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          )}
                          {flightSearch.loading ? "Searching..." : "Search Flights"}
                        </button>
                      </div>
                    </form>

                    {flightFormError && (
                      <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-400">
                        {flightFormError}
                      </p>
                    )}
                  </>
                )}

                {activeTab === "hotels" && (
                  <form
                    onSubmit={handleHotelSearch}
                    className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
                  >
                    <div className="space-y-1 sm:space-y-1.5">
                      <label className={labelClassName}>Destination</label>
                      <div className={fieldBoxClassName}>
                        <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-500 shrink-0" />
                        <input
                          type="text"
                          placeholder="City or hotel"
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                          className={fieldInputClassName}
                        />
                      </div>
                    </div>

                    <CalendarField
                      label="Check-in"
                      value={date || null}
                      minDate={today}
                      maxDate={maxDate}
                      placeholder="Select date"
                      onChange={(value) => setDate(value ?? "")}
                    />

                    <div className="space-y-1 sm:space-y-1.5">
                      <label className={labelClassName}>Guests</label>
                      <div className={fieldBoxClassName}>
                        <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500 shrink-0" />
                        <input
                          type="text"
                          placeholder="How many?"
                          value={guests}
                          onChange={(e) => setGuests(e.target.value)}
                          className={fieldInputClassName}
                        />
                      </div>
                    </div>

                    <div className="flex items-end">
                      <button type="submit" className={submitClassName}>
                        <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Search Hotels
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === "trips" && (
                  <form
                    onSubmit={handleTripSearch}
                    className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
                  >
                    <div className="space-y-1 sm:space-y-1.5">
                      <label className={labelClassName}>Destination</label>
                      <div className={fieldBoxClassName}>
                        <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-500 shrink-0" />
                        <input
                          type="text"
                          placeholder="Where to?"
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                          className={fieldInputClassName}
                        />
                      </div>
                    </div>

                    <div className="space-y-1 sm:space-y-1.5">
                      <label className={labelClassName}>Type</label>
                      <div className={fieldBoxClassName}>
                        <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500 shrink-0" />
                        <select
                          value={tripCategory}
                          onChange={(e) => setTripCategory(e.target.value)}
                          className={fieldInputClassName}
                        >
                          {TOUR_CATEGORIES.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1 sm:space-y-1.5">
                      <label className={labelClassName}>Duration</label>
                      <div className={fieldBoxClassName}>
                        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 shrink-0" />
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Any length"
                          value={tripDuration}
                          onChange={(e) => setTripDuration(e.target.value)}
                          className={fieldInputClassName}
                        />
                      </div>
                    </div>

                    <div className="flex items-end">
                      <button type="submit" className={submitClassName}>
                        <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Search Trips
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {activeTab === "flights" && flightSearch.searched && (
            <div ref={resultsRef} className="mt-4">
              <FlightResults
                status={flightSearch.status}
                flights={flightSearch.flights}
                loading={flightSearch.loading}
                error={flightSearch.error}
                query={flightSearch.query}
                onRequest={flightSearch.requestFlight}
                onRetry={flightSearch.retry}
              />
              <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
                Looking for a round trip, more passengers or another cabin class?{" "}
                <Link
                  href="/flights"
                  className="font-semibold text-sky-500 hover:underline"
                >
                  Open the full flight search
                </Link>
              </p>
            </div>
          )}

          {activeTab === "hotels" && hotelSearch && (
            <div ref={resultsRef} className="mt-4">
              <HotelSearchResults context={hotelSearch} hotels={hotelResults} />
            </div>
          )}

          {activeTab === "trips" && tripSearch && (
            <div ref={resultsRef} className="mt-4">
              <TripSearchResults context={tripSearch} packages={tripResults} />
            </div>
          )}
        </div>
      </section>

      {flightSearch.selected && (
        <FlightInquiryModal
          flight={flightSearch.selected.flight}
          query={flightSearch.selected.query}
          onClose={() => flightSearch.setSelected(null)}
        />
      )}
    </>
  );
}
