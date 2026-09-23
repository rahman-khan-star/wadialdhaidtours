"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { Search, ArrowRight, Plane, MapPin, Calendar } from "lucide-react";

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <section className="relative min-h-[80vh] flex items-end overflow-hidden pb-56">
      <Image
        src="/HEROBACK.png"
        alt="Travel background"
        fill
        sizes="100vw"
        className="object-cover object-top"
        priority
      />

      <div className="absolute inset-0 bg-black/10" />

      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

      <div className="relative z-10 container-premium mx-auto px-4 w-full">
        <div className="flex flex-col items-start gap-6 sm:items-end sm:flex-row sm:justify-between sm:gap-8">
          {/* Left: Empty */}
          <div className="max-w-xs sm:max-w-lg" />

          {/* Right: Buttons + Stats */}
          <div className="flex flex-col items-start sm:items-end gap-3 sm:gap-4 w-full sm:w-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex gap-1.5 sm:gap-2"
            >
              <Link
                href="/tour-packages"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-sky-500 px-3 py-2 text-[11px] font-semibold text-white transition-all duration-300 hover:bg-sky-600 hover:shadow-lg hover:shadow-sky-500/30 sm:px-4 sm:py-2.5 sm:text-xs"
              >
                Start Exploring
                <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/10 backdrop-blur-sm px-3 py-2 text-[11px] font-semibold text-white border border-white/30 transition-all duration-300 hover:bg-white/20 hover:shadow-lg sm:px-4 sm:py-2.5 sm:text-xs"
              >
                Plan Your Trip
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center gap-2 sm:gap-3"
            >
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                </div>
                <div>
                  <div className="font-bold text-white text-[11px] sm:text-xs">50+</div>
                  <div className="text-[9px] sm:text-[10px] text-white/70">Destinations</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                </div>
                <div>
                  <div className="font-bold text-white text-[11px] sm:text-xs">10K+</div>
                  <div className="text-[9px] sm:text-[10px] text-white/70">Happy Travelers</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <Search className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                </div>
                <div>
                  <div className="font-bold text-white text-[11px] sm:text-xs">4.9/5</div>
                  <div className="text-[9px] sm:text-[10px] text-white/70">Rating</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
