"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Star,
  MapPin,
  Clock,
  CheckCircle,
  Shield,
  Users,
  ChevronDown,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { TourPackage } from "@/types";

interface UmrahPackagesViewProps {
  packages: TourPackage[];
}

export function UmrahPackagesView({ packages }: UmrahPackagesViewProps) {
  const cardsRef = useRef<HTMLDivElement>(null);
  const umrahPackages = packages.filter((p) => p.category === "umrah");

  const scrollToCards = () => {
    if (cardsRef.current) {
      cardsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <section className="relative py-8 overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="relative z-10 container-premium mx-auto px-4 text-center">
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Umrah <span className="text-gradient-gold">Packages</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-6">
            A spiritually enriching journey with premium accommodations and
            complete peace of mind.
          </p>
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
          <div className="grid gap-8 lg:grid-cols-3 mb-16">
            {[
              {
                icon: Shield,
                title: "Visa Processing",
                desc: "Complete visa assistance included",
              },
              {
                icon: Star,
                title: "Premium Hotels",
                desc: "5-star accommodations near Haram",
              },
              {
                icon: Users,
                title: "Guided Tours",
                desc: "Licensed guides for Ziyarat tours",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex items-center gap-4 rounded-2xl bg-white p-6 luxury-shadow dark:bg-navy-800 dark:border dark:border-white/10"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-50 dark:bg-gold-900/20 shrink-0">
                  <item.icon className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-bold text-text dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm text-text-light dark:text-white/60">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {umrahPackages.map((pkg, i) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group overflow-hidden rounded-2xl bg-white luxury-shadow dark:bg-navy-800 dark:border dark:border-white/10"
              >
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={pkg.image}
                    alt={pkg.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute bottom-4 left-4">
                    <span className="rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {pkg.duration}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-text dark:text-white mb-1">
                    {pkg.title}
                  </h3>
                  <p className="text-sm text-text-light dark:text-white/60 flex items-center gap-1 mb-3">
                    <MapPin className="h-3 w-3" />
                    {pkg.destination}
                  </p>
                  <ul className="mb-4 space-y-1.5">
                    {pkg.highlights.slice(0, 3).map((h) => (
                      <li
                        key={h}
                        className="flex items-center gap-2 text-sm text-text-light dark:text-white/60"
                      >
                        <CheckCircle className="h-3.5 w-3.5 text-secondary shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between pt-4 border-t border-border dark:border-white/10">
                    <div>
                      <span className="text-xs text-text-light dark:text-white/40">
                        From
                      </span>
                      <p
                        className="text-xl font-bold text-secondary"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {formatPrice(pkg.price)}
                      </p>
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

          {umrahPackages.length === 0 && (
            <div className="py-12 text-center text-text-light dark:text-white/60">
              <p className="text-lg">No Umrah packages found.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
