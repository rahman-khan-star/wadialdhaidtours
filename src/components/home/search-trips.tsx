"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plane,
  Building2,
  MapPin,
  Calendar,
  Users,
} from "lucide-react";

const tabs = [
  { id: "flights", label: "Flights", icon: Plane },
  { id: "hotels", label: "Hotels", icon: Building2 },
  { id: "trips", label: "Trips", icon: MapPin },
];

export function SearchTrips() {
  const [activeTab, setActiveTab] = useState("flights");
  const [fromWhere, setFromWhere] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("");

  const flightsHref = (() => {
    const params = new URLSearchParams();
    if (fromWhere.trim()) params.set("from", fromWhere.trim());
    if (destination.trim()) params.set("to", destination.trim());
    if (date.trim()) params.set("date", date.trim());
    if (guests.trim()) params.set("guests", guests.trim());
    const query = params.toString();
    return query ? `/flights?${query}` : "/flights";
  })();

  return (
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
                <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      From
                    </label>
                    <div className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-2 sm:px-3 py-2 sm:py-2.5">
                      <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-500 shrink-0" />
                      <input
                        type="text"
                        placeholder="Departure city"
                        value={fromWhere}
                        onChange={(e) => setFromWhere(e.target.value)}
                        className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      To
                    </label>
                    <div className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-2 sm:px-3 py-2 sm:py-2.5">
                      <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500 shrink-0" />
                      <input
                        type="text"
                        placeholder="Destination"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Date
                    </label>
                    <div className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-2 sm:px-3 py-2 sm:py-2.5">
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 shrink-0" />
                      <input
                        type="text"
                        placeholder="Select date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-end">
                    <Link
                      href={flightsHref}
                      className="flex w-full items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-sky-500 px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition-all duration-200 hover:bg-sky-600 hover:shadow-lg hover:shadow-sky-500/30"
                    >
                      <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Search Flights
                    </Link>
                  </div>
                </div>
              )}

              {activeTab === "hotels" && (
                <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Destination
                    </label>
                    <div className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-2 sm:px-3 py-2 sm:py-2.5">
                      <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-500 shrink-0" />
                      <input
                        type="text"
                        placeholder="City or hotel"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Check-in
                    </label>
                    <div className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-2 sm:px-3 py-2 sm:py-2.5">
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 shrink-0" />
                      <input
                        type="text"
                        placeholder="Select date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Guests
                    </label>
                    <div className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-2 sm:px-3 py-2 sm:py-2.5">
                      <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500 shrink-0" />
                      <input
                        type="text"
                        placeholder="How many?"
                        value={guests}
                        onChange={(e) => setGuests(e.target.value)}
                        className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-end">
                    <Link
                      href="/hotels"
                      className="flex w-full items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-sky-500 px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition-all duration-200 hover:bg-sky-600 hover:shadow-lg hover:shadow-sky-500/30"
                    >
                      <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Search Hotels
                    </Link>
                  </div>
                </div>
              )}

              {activeTab === "trips" && (
                <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      From
                    </label>
                    <div className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-2 sm:px-3 py-2 sm:py-2.5">
                      <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-500 shrink-0" />
                      <input
                        type="text"
                        placeholder="Departure city"
                        value={fromWhere}
                        onChange={(e) => setFromWhere(e.target.value)}
                        className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Destination
                    </label>
                    <div className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-2 sm:px-3 py-2 sm:py-2.5">
                      <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500 shrink-0" />
                      <input
                        type="text"
                        placeholder="Where to?"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Duration
                    </label>
                    <div className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-2 sm:px-3 py-2 sm:py-2.5">
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 shrink-0" />
                      <input
                        type="text"
                        placeholder="Select dates"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-end">
                    <Link
                      href="/tour-packages"
                      className="flex w-full items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-sky-500 px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition-all duration-200 hover:bg-sky-600 hover:shadow-lg hover:shadow-sky-500/30"
                    >
                      <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Search Trips
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
