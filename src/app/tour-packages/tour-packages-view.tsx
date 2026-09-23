"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, MapPin, Clock, Search, ChevronDown } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { TourPackage } from "@/types";

const categories = [
  { label: "All", value: "all" },
  { label: "Dubai Tours", value: "dubai" },
  { label: "Pakistan Tours", value: "pakistan" },
  { label: "Umrah Packages", value: "umrah" },
];

interface TourPackagesViewProps {
  packages: TourPackage[];
}

export function TourPackagesView({ packages }: TourPackagesViewProps) {
  const [active, setActive] = useState("all");
  const [search, setSearch] = useState("");
  const cardsRef = useRef<HTMLDivElement>(null);

  const scrollToCards = () => {
    if (cardsRef.current) {
      cardsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const filtered = packages.filter((pkg) => {
    const matchesCategory = active === "all" || pkg.category === active;
    const matchesSearch =
      pkg.title.toLowerCase().includes(search.toLowerCase()) ||
      pkg.destination.toLowerCase().includes(search.toLowerCase());
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
            Tour <span className="text-gradient-gold">Packages</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8">
            Curated travel packages designed to deliver exceptional experiences
            at the best value.
          </p>
          <div className="mx-auto max-w-md mb-6">
            <div className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3">
              <Search className="h-4 w-4 text-white/60" />
              <input
                type="text"
                placeholder="Search packages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
              />
            </div>
          </div>
          <button
            onClick={scrollToCards}
            className="inline-flex items-center gap-2 text-sm font-medium text-white hover:text-sky-200 transition-colors"
          >
            Scroll Down
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </button>
        </div>
      </section>

      <section ref={cardsRef} className="section-padding">
        <div className="container-premium mx-auto">
          <div className="flex flex-wrap items-center gap-2 mb-8">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActive(cat.value)}
                className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
                  active === cat.value
                    ? "bg-secondary text-white"
                    : "bg-white text-text hover:bg-gold-50 dark:bg-navy-800 dark:text-white dark:hover:bg-white/10"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((pkg, i) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group overflow-hidden rounded-2xl bg-white luxury-shadow dark:bg-navy-800 dark:border dark:border-white/10"
              >
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={pkg.image}
                    alt={pkg.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {pkg.originalPrice && (
                    <div className="absolute top-4 left-4 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">
                      Save {formatPrice(pkg.originalPrice - pkg.price)}
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4">
                    <span className="rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {pkg.duration}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="rounded-full bg-gold-50 px-2.5 py-0.5 text-xs font-medium text-secondary dark:bg-gold-900/30 capitalize">
                      {pkg.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-secondary text-secondary" />
                      <span className="text-xs font-medium text-text dark:text-white">
                        {pkg.rating}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-text dark:text-white mb-1">
                    {pkg.title}
                  </h3>
                  <p className="text-sm text-text-light dark:text-white/60 flex items-center gap-1 mb-3">
                    <MapPin className="h-3 w-3" />
                    {pkg.destination}
                  </p>
                  <p className="text-sm text-text-light dark:text-white/60 line-clamp-2 mb-4">
                    {pkg.description}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-border dark:border-white/10">
                    <div>
                      <span className="text-xs text-text-light dark:text-white/40">
                        From
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xl font-bold text-secondary"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {formatPrice(pkg.price)}
                        </span>
                        {pkg.originalPrice && (
                          <span className="text-sm text-text-light line-through dark:text-white/40">
                            {formatPrice(pkg.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/tour-packages/${pkg.id}`}
                      className="rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-gold-600 transition-colors"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-20 text-center text-text-light dark:text-white/60">
              <p className="text-lg">No packages found.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
