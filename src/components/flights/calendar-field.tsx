"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { addDaysIso, isDateString, todayIsoDate } from "@/lib/flights/flight-math";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatDateLabel(value: string): string {
  if (!isDateString(value)) return "";
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

interface CalendarFieldProps {
  label: string;
  value: string | null;
  // Earliest selectable day ("YYYY-MM-DD"). Past dates are always disabled.
  minDate: string;
  maxDate?: string;
  disabled?: boolean;
  align?: "start" | "end";
  placeholder: string;
  onChange: (value: string | null) => void;
}

function monthIndex(year: number, month: number): number {
  return year * 12 + month;
}

export function CalendarField({
  label,
  value,
  minDate,
  maxDate,
  disabled = false,
  align = "start",
  placeholder,
  onChange,
}: CalendarFieldProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fallback = isDateString(minDate) ? minDate : todayIsoDate();
  const seed = value && isDateString(value) ? value : fallback;
  const [seedYear, seedMonth] = seed.split("-").map(Number);

  const [view, setView] = useState({ year: seedYear, month: seedMonth - 1 });

  // Jump the grid to the selected month when the picker opens, instead of
  // syncing from props inside an effect.
  const toggleOpen = () => {
    if (!open && value && isDateString(value)) {
      const [year, month] = value.split("-").map(Number);
      setView((current) =>
        current.year === year && current.month === month - 1
          ? current
          : { year, month: month - 1 }
      );
    }
    setOpen((current) => !current);
  };

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const minMonth = useMemo(() => {
    const [year, month] = (isDateString(minDate) ? minDate : fallback).split("-").map(Number);
    return monthIndex(year, month - 1);
  }, [minDate, fallback]);

  const maxMonth = useMemo(() => {
    if (!maxDate || !isDateString(maxDate)) return Number.POSITIVE_INFINITY;
    const [year, month] = maxDate.split("-").map(Number);
    return monthIndex(year, month - 1);
  }, [maxDate]);

  const today = todayIsoDate();

  const cells = useMemo(() => {
    const firstWeekday = new Date(Date.UTC(view.year, view.month, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();
    const output: (string | null)[] = Array.from({ length: firstWeekday }, () => null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      output.push(
        `${view.year}-${String(view.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      );
    }
    return output;
  }, [view]);

  const canGoBack = monthIndex(view.year, view.month) > minMonth;
  const canGoForward = monthIndex(view.year, view.month) < maxMonth;

  const moveMonth = (offset: number) => {
    setView((current) => {
      const next = new Date(Date.UTC(current.year, current.month + offset, 1));
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
    });
  };

  const select = (iso: string) => {
    onChange(iso);
    setOpen(false);
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {label}
      </label>

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={toggleOpen}
          className="flex w-full items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2.5 text-left transition-colors hover:border-sky-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CalendarDays className="h-4 w-4 text-emerald-500 shrink-0" />
          <span
            className={`flex-1 truncate text-sm ${
              value
                ? "text-slate-800 dark:text-white"
                : "text-slate-400 dark:text-slate-500"
            }`}
          >
            {value ? formatDateLabel(value) : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
        </button>

        {open && (
          <div
            className={`absolute top-full mt-2 z-40 w-full max-w-[calc(100vw-2rem)] sm:w-72 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-3 shadow-xl ${
              align === "end" ? "right-0" : "left-0"
            }`}
            role="dialog"
            aria-label={label}
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => moveMonth(-1)}
                disabled={!canGoBack}
                aria-label="Previous month"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-slate-800 dark:text-white">
                {MONTHS[view.month]} {view.year}
              </span>
              <button
                type="button"
                onClick={() => moveMonth(1)}
                disabled={!canGoForward}
                aria-label="Next month"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="py-1 text-center text-[10px] font-semibold text-slate-400 dark:text-slate-500"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((iso, index) => {
                if (!iso) {
                  return <div key={`blank-${index}`} className="h-8" />;
                }

                const isPast = iso < (isDateString(minDate) ? minDate : fallback);
                const isBeyond = Boolean(maxDate && iso > maxDate);
                const isSelected = iso === value;
                const isToday = iso === today;

                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={isPast || isBeyond}
                    onClick={() => select(iso)}
                    aria-pressed={isSelected}
                    className={`h-8 rounded-lg text-xs font-medium transition-colors ${
                      isSelected
                        ? "bg-sky-500 text-white shadow-sm"
                        : isPast || isBeyond
                          ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                          : isToday
                            ? "text-sky-600 dark:text-sky-400 ring-1 ring-sky-400/50 hover:bg-sky-50 dark:hover:bg-sky-500/10"
                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {Number(iso.slice(8, 10))}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="mt-2 w-full rounded-lg py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Convenience for computing the earliest allowed return date.
export function earliestReturnDate(departureDate: string | null): string {
  const today = todayIsoDate();
  if (departureDate && isDateString(departureDate) && departureDate >= today) {
    return departureDate;
  }
  return today;
}

export function latestSelectableDate(): string {
  return addDaysIso(todayIsoDate(), 330);
}
