"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Globe, Clock } from "lucide-react";
import type { VisaService } from "@/types";

interface VisaServicesProps {
  services: VisaService[];
}

export function VisaServices({ services }: VisaServicesProps) {
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
          <span className="text-sm font-semibold text-orange-500 uppercase tracking-wider">
            Visa
          </span>
          <h2
            className="mt-2 text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Visa Services
          </h2>
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
            Hassle-free visa processing with a 99.5% approval rate. We handle
            everything from documentation to submission.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((visa, i) => (
            <motion.div
              key={visa.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-6 group hover:shadow-xl transition-all duration-300"
            >
              <div className="text-4xl mb-4">{visa.flag}</div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                {visa.type}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {visa.country}
              </p>

              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <Clock className="h-4 w-4 text-sky-500" />
                  <span>{visa.processingTime}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <Globe className="h-4 w-4 text-sky-500" />
                  <span>{visa.duration} stay</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Starting from
                    </span>
                    <p className="text-xl font-bold text-sky-500">
                      ${visa.price}
                    </p>
                  </div>
                  <Link
                    href="/visa-services"
                    className="text-sm font-semibold text-sky-500 hover:underline"
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 p-8"
        >
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Need Help with Your Visa?
              </h3>
              <p className="text-sky-100">
                Our visa experts are here to guide you through every step.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 text-sm font-semibold text-sky-600 transition-all hover:shadow-lg shrink-0"
            >
              Get Free Consultation
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
