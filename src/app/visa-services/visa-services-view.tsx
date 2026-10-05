"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import {
  FileCheck,
  Globe,
  Shield,
  Clock,
  CheckCircle,
  Phone,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import type { VisaService } from "@/types";
import Link from "next/link";

interface VisaServicesViewProps {
  services: VisaService[];
}

export function VisaServicesView({ services }: VisaServicesViewProps) {
  const cardsRef = useRef<HTMLDivElement>(null);

  const scrollToCards = () => {
    if (cardsRef.current) {
      cardsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="relative z-10 container-premium mx-auto px-4 text-center">
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Visa <span className="text-sky-200">Services</span>
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-6">
            Hassle-free visa processing with a 99.5% approval rate. We handle
            everything from documentation to submission.
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
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-16">
            {[
              { icon: FileCheck, title: "99.5% Approval", desc: "Industry-leading success rate" },
              { icon: Clock, title: "Fast Processing", desc: "3-10 business days" },
              { icon: Shield, title: "Secure & Safe", desc: "Your documents are protected" },
              { icon: Globe, title: "All Countries", desc: "Visa services worldwide" },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 text-center shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-900/50">
                  <item.icon className="h-6 w-6 text-sky-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>

          <div ref={cardsRef} className="grid gap-6 sm:grid-cols-2">
            {services.map((visa, i) => (
              <motion.div
                key={visa.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4 mb-6">
                  <span className="text-5xl">{visa.flag}</span>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                      {visa.type}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {visa.country} — {visa.duration} stay
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 p-3">
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Processing Time
                    </p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                      {visa.processingTime}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 p-3">
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Visa Fee
                    </p>
                    <p className="text-sm font-semibold text-sky-500">
                      ${visa.price}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">
                    Requirements
                  </h4>
                  <ul className="space-y-2">
                    {visa.requirements.map((req) => (
                      <li
                        key={req}
                        className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"
                      >
                        <CheckCircle className="h-4 w-4 text-sky-500 mt-0.5 shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/contact"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-600 transition-colors"
                >
                  Apply Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 p-8 sm:p-12"
          >
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Need Help with Your Visa?
                </h3>
                <p className="text-sky-100">
                  Our visa experts are available 24/7 to assist you.
                </p>
              </div>
              <a
                href="tel:+923429005290"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-semibold text-sky-600 transition-all hover:shadow-lg shrink-0"
              >
                <Phone className="h-4 w-4" />
                Call Now
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
