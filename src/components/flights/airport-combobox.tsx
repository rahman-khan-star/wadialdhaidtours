"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, MapPin, Plane } from "lucide-react";
import type { AirportOption } from "@/types";

interface AirportComboboxProps {
  label: string;
  icon?: typeof MapPin;
  value: AirportOption | null;
  onChange: (airport: AirportOption | null) => void;
  placeholder: string;
  initialQuery?: string;
  disabled?: boolean;
}

function formatAirport(airport: AirportOption): string {
  return `${airport.city} (${airport.iata})`;
}

// Airport/city autocomplete. Talks only to /api/flights/airports, which is
// backed by the server-side provider — so swapping in a real provider later
// requires no change here.
export function AirportCombobox({
  label,
  icon: Icon = MapPin,
  value,
  onChange,
  placeholder,
  initialQuery,
  disabled = false,
}: AirportComboboxProps) {
  // `text` only tracks what the user typed while nothing is selected; once an
  // airport is chosen the visible label is derived from `value`, so swapping
  // or clearing the selection from the outside never needs a syncing effect.
  const [text, setText] = useState(initialQuery ?? "");
  const displayed = value ? formatAirport(value) : text;
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<AirportOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const resolvedInitial = useRef(false);
  const listboxId = useId();

  // Resolve an incoming free-text value (home page search) to a real airport
  // when it maps to exactly one option.
  useEffect(() => {
    if (resolvedInitial.current) return;
    resolvedInitial.current = true;

    const query = (initialQuery ?? "").trim();
    if (!query || value) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/flights/airports?q=${encodeURIComponent(query)}&limit=6`);
        if (!res.ok) return;
        const data = (await res.json()) as { airports?: AirportOption[] };
        const list = data.airports ?? [];
        const needle = query.toLowerCase();
        const exact = list.find(
          (airport) =>
            airport.iata.toLowerCase() === needle ||
            airport.city.toLowerCase() === needle ||
            airport.name.toLowerCase() === needle
        );
        if (!cancelled && exact) onChange(exact);
      } catch {
        // Keep whatever the visitor typed; nothing to resolve.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialQuery, value, onChange]);

  // Debounced provider-backed lookup while the dropdown is open.
  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const timer = window.setTimeout(
      async () => {
        setLoading(true);
        try {
          const res = await fetch(
            `/api/flights/airports?q=${encodeURIComponent(text)}&limit=8`,
            { signal: controller.signal }
          );
          if (!res.ok) throw new Error("lookup failed");
          const data = (await res.json()) as { airports?: AirportOption[] };
          if (controller.signal.aborted) return;
          setResults(data.airports ?? []);
          setFailed(false);
          setHighlight(0);
        } catch {
          if (controller.signal.aborted) return;
          setResults([]);
          setFailed(true);
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      },
      text.trim() ? 250 : 0
    );

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [text, open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const select = (airport: AirportOption) => {
    onChange(airport);
    setText(formatAirport(airport));
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open) {
      if (event.key === "ArrowDown") setOpen(true);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((current) => Math.min(current + 1, Math.max(results.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      const airport = results[highlight];
      if (airport) {
        event.preventDefault();
        select(airport);
      }
    }
  };

  return (
    <div className="space-y-1.5" ref={rootRef}>
      <label className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {label}
      </label>

      <div className="relative">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2.5 focus-within:border-sky-400">
          <Icon className="h-4 w-4 shrink-0 text-sky-500" />
          <input
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            autoComplete="off"
            disabled={disabled}
            placeholder={placeholder}
            value={displayed}
            onChange={(event) => {
              setText(event.target.value);
              if (value) onChange(null);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none disabled:cursor-not-allowed"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-sky-500 shrink-0" />}
        </div>

        <div
          id={listboxId}
          hidden={!open}
          className="absolute left-0 right-0 top-full mt-2 z-40 max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl"
        >
          {loading && results.length === 0 ? (
            <p className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
              Searching airports...
            </p>
          ) : failed ? (
            <p className="px-3 py-3 text-xs text-red-500">
              Airport lookup is unavailable. Please try again.
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
              No airports found. Try a city or IATA code.
            </p>
          ) : (
            <ul role="listbox" aria-label={label}>
              {results.map((airport, index) => (
                  <li key={airport.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === highlight}
                      onClick={() => select(airport)}
                      onMouseEnter={() => setHighlight(index)}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                        index === highlight
                          ? "bg-sky-50 dark:bg-sky-500/10"
                          : "hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      <Plane className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800 dark:text-white">
                          {airport.city}, {airport.country}
                        </span>
                        <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                          {airport.name}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-md bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-slate-600 dark:text-slate-300">
                        {airport.iata}
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
