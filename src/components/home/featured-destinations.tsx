"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import type { Destination } from "@/types";

interface FeaturedDestinationsProps {
  destinations: Destination[];
}

export function FeaturedDestinations({ destinations }: FeaturedDestinationsProps) {
  return (
    <section className="section-padding bg-slate-50 dark:bg-slate-900">
      <div className="container-premium mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <span className="text-sm font-semibold text-sky-500 uppercase tracking-wider">
            Destinations
          </span>
          <h2
            className="mt-2 text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Featured Destinations
          </h2>
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
            Handpicked destinations offering extraordinary experiences and
            unforgettable memories.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.slice(0, 6).map((dest, i) => (
            <motion.div
              key={dest.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link
                href={`/destinations/${dest.id}`}
                className="group block overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={dest.image}
                    alt={dest.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    style={{ willChange: "transform" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5">
                    <Star className="h-3.5 w-3.5 fill-orange-400 text-orange-400" />
                    <span className="text-xs font-semibold text-slate-800">
                      {dest.rating}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-xl font-bold text-white mb-1">
                      {dest.name}
                    </h3>
                    <p className="text-sm text-white/80">{dest.country}</p>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-4">
                    {dest.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 dark:text-slate-500">From</span>
                      <p className="text-xl font-bold text-sky-500">
                        ${dest.priceFrom.toLocaleString()}
                      </p>
                    </div>
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-sky-500 group-hover:gap-2.5 transition-all">
                      Explore
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          <Link
            href="/destinations"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-sky-500 bg-transparent px-8 py-3 text-sm font-semibold text-sky-500 transition-all duration-300 hover:bg-sky-500 hover:text-white"
          >
            View All Destinations
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
