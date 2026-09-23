"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, MapPin, Search } from "lucide-react";
import type { Destination } from "@/types";

const categories = ["All", "Dubai", "Pakistan"];

interface DestinationsViewProps {
  destinations: Destination[];
}

export function DestinationsView({ destinations }: DestinationsViewProps) {
  const [active, setActive] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = destinations.filter((d) => {
    const matchesCategory =
      active === "All" ||
      (active === "Dubai" && ["Dubai", "Abu Dhabi"].includes(d.country)) ||
      (active === "Pakistan" && d.country === "Pakistan");
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.country.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="relative z-10 container-premium mx-auto px-4 text-center">
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <span className="text-gradient-gold">Destinations</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8">
            Explore our handpicked destinations offering extraordinary
            experiences.
          </p>
          <div className="mx-auto max-w-md">
            <div className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3">
              <Search className="h-4 w-4 text-white/60" />
              <input
                type="text"
                placeholder="Search destinations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-premium mx-auto">
          <div className="flex items-center gap-2 mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
                  active === cat
                    ? "bg-secondary text-white"
                    : "bg-white text-text hover:bg-gold-50 dark:bg-navy-800 dark:text-white dark:hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((dest, i) => (
              <motion.div
                key={dest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Link
                  href={`/destinations/${dest.id}`}
                  className="group block overflow-hidden rounded-2xl bg-white luxury-shadow dark:bg-navy-800 dark:border dark:border-white/10"
                >
                  <div className="relative h-64 overflow-hidden">
                    <Image
                      src={dest.image}
                      alt={dest.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white">
                            {dest.name}
                          </h3>
                          <p className="text-sm text-white/80 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {dest.country}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-1">
                          <Star className="h-3 w-3 fill-secondary text-secondary" />
                          <span className="text-xs font-medium text-white">
                            {dest.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-text-light dark:text-white/60 line-clamp-2 mb-4">
                      {dest.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-text-light dark:text-white/40">
                          From
                        </span>
                        <p
                          className="text-xl font-bold text-secondary"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          ${dest.priceFrom.toLocaleString()}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-secondary">
                        View Details →
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-20 text-center text-text-light dark:text-white/60">
              <p className="text-lg">No destinations found.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
