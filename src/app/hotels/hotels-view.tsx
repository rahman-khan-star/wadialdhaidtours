"use client";

import { motion } from "framer-motion";
import { Star, MapPin } from "lucide-react";
import Image from "next/image";
import type { Hotel } from "@/types";

interface HotelsViewProps {
  hotels: Hotel[];
}

export function HotelsView({ hotels }: HotelsViewProps) {
  return (
    <>
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="relative z-10 container-premium mx-auto px-4 text-center">
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Premium <span className="text-gradient-gold">Hotels</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Handpicked luxury accommodations for an unforgettable stay.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-premium mx-auto">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {hotels.map((hotel, i) => (
              <motion.div
                key={hotel.id ?? hotel.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group overflow-hidden rounded-2xl bg-white luxury-shadow dark:bg-navy-800 dark:border dark:border-white/10"
              >
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={hotel.image}
                    alt={hotel.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-secondary text-secondary" />
                      <span className="text-xs font-medium text-text dark:text-white">
                        {hotel.rating}
                      </span>
                    </div>
                    <span className="text-xs text-text-light dark:text-white/40">
                      •
                    </span>
                    <span className="text-xs text-text-light dark:text-white/60 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {hotel.location}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-text dark:text-white mb-2">
                    {hotel.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {hotel.amenities.map((a) => (
                      <span
                        key={a}
                        className="rounded-full bg-gold-50 px-2.5 py-0.5 text-xs font-medium text-secondary dark:bg-gold-900/30"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border dark:border-white/10">
                    <div>
                      <span className="text-xs text-text-light dark:text-white/40">
                        Per night from
                      </span>
                      <p
                        className="text-xl font-bold text-secondary"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        ${hotel.price}
                      </p>
                    </div>
                    <button className="rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-gold-600 transition-colors">
                      Book Now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {hotels.length === 0 && (
            <div className="py-20 text-center text-text-light dark:text-white/60">
              <p className="text-lg">No hotels found.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
