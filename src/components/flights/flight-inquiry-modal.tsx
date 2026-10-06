"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Send,
  X,
} from "lucide-react";
import type { FlightRequest, FlightSearchQuery, FlightSearchResult } from "@/types";
import { SITE_CONTACT } from "@/lib/site-contact";

interface FlightInquiryModalProps {
  flight: FlightSearchResult;
  query: FlightSearchQuery;
  onClose: () => void;
}

function placeLabel(place: FlightSearchQuery["origin"]): string {
  if (!place) return "—";
  return `${place.city} (${place.iata})`;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-right text-xs font-semibold text-slate-800 dark:text-white">
        {value}
      </dd>
    </div>
  );
}

// Existing customer inquiry flow, extended with the selected flight. The trip
// details are read-only: the server re-derives them from the signed search
// token, so nothing here is trusted from the browser.
export function FlightInquiryModal({ flight, query, onClose }: FlightInquiryModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<FlightRequest | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/flights/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchToken: flight.requestToken,
          name,
          phone,
          email,
          message,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        flightRequest?: FlightRequest;
      };
      if (!res.ok || !data.flightRequest) {
        throw new Error(data.error || "Failed to submit your request");
      }
      setCreated(data.flightRequest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit your request");
    } finally {
      setSending(false);
    }
  };

  const returnLabel = query.returnDate
    ? query.returnDate
    : flight.tripType === "roundtrip" && flight.inbound
      ? flight.inbound.departureTime.slice(0, 10)
      : "One-way";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800"
        role="dialog"
        aria-modal="true"
        aria-label="Request this flight"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              {created ? "Request received" : "Request This Flight"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {created
                ? "No payment is taken online — we contact you with your quotation."
                : "Our team contacts you personally with a quotation."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {created ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-center dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                Thank you, {created.name.split(" ")[0] || "traveller"}!
              </p>
              <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-400/80">
                Your request for {created.airline} {created.flightNumber} has been received. A
                travel specialist will contact you shortly.
              </p>
            </div>

            <dl className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/40">
              <SummaryRow
                label="Flight"
                value={`${created.airline} · ${created.flightNumber}`}
              />
              <SummaryRow
                label="Route"
                value={`${created.originCode} → ${created.destinationCode}`}
              />
              <SummaryRow label="Departure" value={created.departureDate} />
              <SummaryRow label="Return" value={returnLabel} />
              <SummaryRow
                label="Passengers"
                value={`${created.passengers} · ${created.cabin}`}
              />
            </dl>

            <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-700">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Prefer to speak with us?
              </p>
              <div className="space-y-2">
                <a
                  href={SITE_CONTACT.phoneHref}
                  className="flex items-center gap-2 text-sm text-slate-700 hover:text-sky-500 dark:text-slate-200"
                >
                  <Phone className="h-4 w-4 text-sky-500" />
                  {SITE_CONTACT.phone}
                </a>
                <a
                  href={SITE_CONTACT.emailHref}
                  className="flex items-center gap-2 text-sm text-slate-700 hover:text-sky-500 dark:text-slate-200"
                >
                  <Mail className="h-4 w-4 text-sky-500" />
                  {SITE_CONTACT.email}
                </a>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <a
                href={SITE_CONTACT.contactPath}
                className="text-xs font-medium text-sky-500 hover:underline"
              >
                Go to contact page
              </a>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-sky-600"
              >
                Continue searching
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/40">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Selected flight
              </p>
              <dl>
                <SummaryRow
                  label="Flight"
                  value={`${flight.outbound.airline} · ${flight.outbound.flightNumber}`}
                />
                <SummaryRow label="Origin" value={placeLabel(query.origin)} />
                <SummaryRow label="Destination" value={placeLabel(query.destination)} />
                <SummaryRow label="Departure date" value={query.departureDate} />
                <SummaryRow label="Return date" value={returnLabel} />
                <SummaryRow
                  label="Passengers"
                  value={`${query.passengers} · ${query.cabin}`}
                />
              </dl>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Phone number
                </label>
                <input
                  type="tel"
                  required
                  maxLength={50}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+92 342 900 5290"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Email
                </label>
                <input
                  type="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="john@example.com"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Message <span className="text-slate-400">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  maxLength={5000}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Baggage needs, flexible dates, extra services..."
                  className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>

            <p className="flex items-start gap-2 rounded-lg bg-sky-50 px-3 py-2 text-[11px] leading-relaxed text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Wadi Zaid does not sell tickets online. We review your request and contact you
              with the available quotation, then handle booking and payment directly.
            </p>

            <button
              type="submit"
              disabled={sending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-sky-600 disabled:opacity-60"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {sending ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
