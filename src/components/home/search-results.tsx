"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Clock, MapPin, SearchX, Star } from "lucide-react";
import { formatDateLabel } from "@/components/flights/calendar-field";
import { TOUR_CATEGORIES } from "@/lib/search-filters";
import { formatPrice } from "@/lib/utils";
import type { Hotel, TourPackage } from "@/types";

export interface HotelSearchContext {
  query: string;
  checkIn: string | null;
  guests: string;
}

export interface TripSearchContext {
  query: string;
  category: string;
  days: number | null;
}

function ResultsHeader({ title, summary }: { title: string; summary: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-slate-800 dark:text-white">{title}</h2>
        {summary && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{summary}</p>
        )}
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Search results
      </span>
    </div>
  );
}

function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
        <SearchX className="h-6 w-6 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-white">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">
        {description}
      </p>
      <div className="mt-4 flex justify-center">
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-sky-600"
        >
          {actionLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function buildSummary(parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(" · ");
}

export function HotelSearchResults({
  context,
  hotels,
}: {
  context: HotelSearchContext;
  hotels: Hotel[];
}) {
  const summary = buildSummary([
    context.query ? `“${context.query}”` : "All destinations",
    context.checkIn ? `Check-in ${formatDateLabel(context.checkIn)}` : null,
    context.guests ? `${context.guests} guest${context.guests === "1" ? "" : "s"}` : null,
  ]);

  if (hotels.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5">
        <ResultsHeader title="No stays found" summary={summary} />
        <EmptyState
          title="No hotels match your search"
          description="Try a different city or hotel name, or browse every property we work with."
          actionLabel="Browse all hotels"
          actionHref="/hotels"
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5">
      <ResultsHeader
        title={`${hotels.length} stay${hotels.length === 1 ? "" : "s"} found`}
        summary={summary}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {hotels.map((hotel) => (
          <article
            key={hotel.id ?? hotel.name}
            className="flex gap-3 rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg sm:h-24 sm:w-32">
              <Image src={hotel.image} alt={hotel.name} fill className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="min-w-0 truncate text-sm font-semibold text-slate-800 dark:text-white">
                  {hotel.name}
                </h3>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20">
                  <Star className="h-3 w-3 fill-current" />
                  {hotel.rating}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
                <MapPin className="h-3 w-3 shrink-0" />
                {hotel.location}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {hotel.amenities.slice(0, 3).map((amenity) => (
                  <span
                    key={amenity}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                From{" "}
                <span className="text-sm font-bold text-slate-800 dark:text-white">
                  {formatPrice(hotel.price)}
                </span>{" "}
                / night
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Availability and rates for your dates are confirmed by our team.
        </p>
        <Link
          href="/hotels"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-500 hover:gap-2 transition-all"
        >
          View all hotels
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export function TripSearchResults({
  context,
  packages,
}: {
  context: TripSearchContext;
  packages: TourPackage[];
}) {
  const categoryLabel =
    TOUR_CATEGORIES.find((option) => option.value === context.category)?.label ?? "All";

  const summary = buildSummary([
    context.query ? `“${context.query}”` : null,
    context.category && context.category !== "all" ? categoryLabel : null,
    context.days ? `${context.days} days` : null,
  ]);

  if (packages.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5">
        <ResultsHeader title="No trips found" summary={summary} />
        <EmptyState
          title="No packages match your search"
          description="Try a different destination, trip type or trip length."
          actionLabel="Browse all packages"
          actionHref="/tour-packages"
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5">
      <ResultsHeader
        title={`${packages.length} package${packages.length === 1 ? "" : "s"} found`}
        summary={summary}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <Link
            key={pkg.id}
            href={`/tour-packages/${pkg.id}`}
            className="group overflow-hidden rounded-xl border border-slate-100 transition-all hover:shadow-md dark:border-slate-700"
          >
            <div className="relative h-28 overflow-hidden sm:h-32">
              <Image
                src={pkg.image}
                alt={pkg.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-slate-700 backdrop-blur-sm">
                <Clock className="h-3 w-3 text-sky-500" />
                {pkg.duration}
              </span>
            </div>
            <div className="p-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium capitalize text-sky-600 ring-1 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20">
                  {pkg.category}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {pkg.rating}
                </span>
              </div>
              <h3 className="mt-1.5 truncate text-sm font-semibold text-slate-800 dark:text-white">
                {pkg.title}
              </h3>
              <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
                <MapPin className="h-3 w-3 shrink-0" />
                {pkg.destination}
              </p>
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-700">
                <span className="text-sm font-bold text-slate-800 dark:text-white">
                  {formatPrice(pkg.price)}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-500 group-hover:gap-1.5 transition-all">
                  View package
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Every package can be tailored — tell us your dates and we will build it for you.
        </p>
        <Link
          href="/tour-packages"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-500 hover:gap-2 transition-all"
        >
          View all packages
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
