"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, User, Mail, Phone, Globe, Lock, Percent, Coins } from "lucide-react";
import {
  DEFAULT_FLIGHT_PRICING,
  FLIGHT_MARKUP_MODES,
  FLIGHT_PRICING_COLUMNS,
  FLIGHT_PRICING_LIMITS,
  type FlightMarkupMode,
} from "@/lib/flights/pricing-config";

// Settings arrive from /api/settings as raw column values; keep only what we
// understand so a bad row can never put nonsense into the form.
function readNumber(value: unknown, fallback: number): string {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? String(parsed) : String(fallback);
}

function readMode(value: unknown): FlightMarkupMode {
  return typeof value === "string" &&
    (FLIGHT_MARKUP_MODES as readonly string[]).includes(value.trim().toLowerCase())
    ? (value.trim().toLowerCase() as FlightMarkupMode)
    : DEFAULT_FLIGHT_PRICING.mode;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    companyName: "Wadi Al Dhaid Tours LLC",
    email: "info@luxurytravel.com",
    phone: "+92 342 900 5290",
    website: "https://luxurytravel.com",
    address: "Dubai, United Arab Emirates",
    currency: "USD",
    timezone: "Asia/Dubai",
  });

  // Flight selling-price rules. Kept as strings so an empty or malformed field
  // is rejected by the API instead of silently becoming 0.
  const [pricing, setPricing] = useState({
    mode: DEFAULT_FLIGHT_PRICING.mode,
    markupPercent: String(DEFAULT_FLIGHT_PRICING.markupPercent),
    fixedChargePkr: String(DEFAULT_FLIGHT_PRICING.fixedChargePkr),
    pkrPerAed: String(DEFAULT_FLIGHT_PRICING.pkrPerAed),
    aedPerProviderUnit: String(DEFAULT_FLIGHT_PRICING.aedPerProviderUnit),
  });

  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error("Failed to fetch settings");
        const data = await res.json();
        if (data.settings) {
          setSettings({
            companyName: data.settings.company_name,
            email: data.settings.email,
            phone: data.settings.phone,
            website: data.settings.website,
            address: data.settings.address,
            currency: data.settings.currency,
            timezone: data.settings.timezone,
          });
          setPricing({
            mode: readMode(data.settings[FLIGHT_PRICING_COLUMNS.mode]),
            markupPercent: readNumber(
              data.settings[FLIGHT_PRICING_COLUMNS.markupPercent],
              DEFAULT_FLIGHT_PRICING.markupPercent
            ),
            fixedChargePkr: readNumber(
              data.settings[FLIGHT_PRICING_COLUMNS.fixedChargePkr],
              DEFAULT_FLIGHT_PRICING.fixedChargePkr
            ),
            pkrPerAed: readNumber(
              data.settings[FLIGHT_PRICING_COLUMNS.pkrPerAed],
              DEFAULT_FLIGHT_PRICING.pkrPerAed
            ),
            aedPerProviderUnit: readNumber(
              data.settings[FLIGHT_PRICING_COLUMNS.aedPerProviderUnit],
              DEFAULT_FLIGHT_PRICING.aedPerProviderUnit
            ),
          });
        }
      } catch {
        // Keep defaults on error
      }
    }

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaveError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: settings.companyName,
          email: settings.email,
          phone: settings.phone,
          whatsapp: "",
          website: settings.website,
          address: settings.address,
          currency: settings.currency,
          timezone: settings.timezone,
          // Sent as raw strings: the API validates every value and answers
          // 400 with the exact problem (negatives, bad rates, unknown mode).
          [FLIGHT_PRICING_COLUMNS.mode]: pricing.mode,
          [FLIGHT_PRICING_COLUMNS.markupPercent]: pricing.markupPercent,
          [FLIGHT_PRICING_COLUMNS.fixedChargePkr]: pricing.fixedChargePkr,
          [FLIGHT_PRICING_COLUMNS.pkrPerAed]: pricing.pkrPerAed,
          [FLIGHT_PRICING_COLUMNS.aedPerProviderUnit]: pricing.aedPerProviderUnit,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setSaveError(data.error || "Failed to save settings");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError("Failed to save settings. Please try again.");
    }
  };

  const handlePasswordSave = () => {
    // Password change handled separately (not persisted to Supabase in this step)
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-text dark:text-white">
          Settings
        </h2>
        <p className="text-sm text-text-light dark:text-white/60">
          Manage your admin account and website settings
        </p>
      </div>

      {saved && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-green-50 p-4 text-sm text-green-700 dark:bg-green-500/10 dark:text-green-400"
        >
          Settings saved successfully!
        </motion.div>
      )}

      {saveError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400"
        >
          {saveError}
        </motion.div>
      )}

      {/* Company Info */}
      <div className="rounded-2xl bg-white p-6 luxury-shadow dark:bg-navy-800 dark:border dark:border-white/10">
        <h3 className="text-lg font-bold text-text dark:text-white mb-4">
          Company Information
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text dark:text-white mb-1">
              Company Name
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 dark:bg-navy-900 dark:border-white/10">
              <User className="h-4 w-4 text-text-light dark:text-white/40" />
              <input
                value={settings.companyName}
                onChange={(e) =>
                  setSettings({ ...settings, companyName: e.target.value })
                }
                className="flex-1 bg-transparent text-sm text-text outline-none dark:text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text dark:text-white mb-1">
                Email
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 dark:bg-navy-900 dark:border-white/10">
                <Mail className="h-4 w-4 text-text-light dark:text-white/40" />
                <input
                  value={settings.email}
                  onChange={(e) =>
                    setSettings({ ...settings, email: e.target.value })
                  }
                  className="flex-1 bg-transparent text-sm text-text outline-none dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text dark:text-white mb-1">
                Phone
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 dark:bg-navy-900 dark:border-white/10">
                <Phone className="h-4 w-4 text-text-light dark:text-white/40" />
                <input
                  value={settings.phone}
                  onChange={(e) =>
                    setSettings({ ...settings, phone: e.target.value })
                  }
                  className="flex-1 bg-transparent text-sm text-text outline-none dark:text-white"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text dark:text-white mb-1">
              Address
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 dark:bg-navy-900 dark:border-white/10">
              <Globe className="h-4 w-4 text-text-light dark:text-white/40" />
              <input
                value={settings.address}
                onChange={(e) =>
                  setSettings({ ...settings, address: e.target.value })
                }
                className="flex-1 bg-transparent text-sm text-text outline-none dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Flight Pricing */}
      <div className="rounded-2xl bg-white p-6 luxury-shadow dark:bg-navy-800 dark:border dark:border-white/10">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-text dark:text-white mb-1">
              Flight Pricing
            </h3>
            <p className="text-xs text-text-light dark:text-white/60">
              Markup added to provider fares and shown to customers as the final
              price in AED and PKR. Provider fares and these settings never
              reach the browser.
            </p>
          </div>
          <Percent className="h-4 w-4 shrink-0 text-text-light dark:text-white/40" />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text dark:text-white mb-1">
              Markup mode
            </label>
            <select
              value={pricing.mode}
              onChange={(e) =>
                setPricing({ ...pricing, mode: e.target.value as FlightMarkupMode })
              }
              className="w-full cursor-pointer rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed charge</option>
              <option value="both">Percentage + fixed charge</option>
            </select>
          </div>

          {(pricing.mode === "percentage" || pricing.mode === "both") && (
            <div>
              <label className="block text-sm font-medium text-text dark:text-white mb-1">
                Markup percentage
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 dark:bg-navy-900 dark:border-white/10">
                <Percent className="h-4 w-4 text-text-light dark:text-white/40" />
                <input
                  type="number"
                  min={0}
                  max={FLIGHT_PRICING_LIMITS.maxMarkupPercent}
                  step="0.5"
                  value={pricing.markupPercent}
                  onChange={(e) =>
                    setPricing({ ...pricing, markupPercent: e.target.value })
                  }
                  className="flex-1 bg-transparent text-sm text-text outline-none dark:text-white"
                />
                <span className="text-xs text-text-light dark:text-white/40">%</span>
              </div>
              <p className="mt-1 text-[11px] text-text-light dark:text-white/50">
                Typical values: 5%, 10%, 15% or 20%.
              </p>
            </div>
          )}

          {(pricing.mode === "fixed" || pricing.mode === "both") && (
            <div>
              <label className="block text-sm font-medium text-text dark:text-white mb-1">
                Fixed charge
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 dark:bg-navy-900 dark:border-white/10">
                <Coins className="h-4 w-4 text-text-light dark:text-white/40" />
                <input
                  type="number"
                  min={0}
                  max={FLIGHT_PRICING_LIMITS.maxFixedChargePkr}
                  step="100"
                  value={pricing.fixedChargePkr}
                  onChange={(e) =>
                    setPricing({ ...pricing, fixedChargePkr: e.target.value })
                  }
                  className="flex-1 bg-transparent text-sm text-text outline-none dark:text-white"
                />
                <span className="text-xs text-text-light dark:text-white/40">PKR</span>
              </div>
              <p className="mt-1 text-[11px] text-text-light dark:text-white/50">
                Examples: PKR 2,000, 3,000 or 5,000. Added once per itinerary —
                never per passenger.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-text dark:text-white mb-1">
                PKR per AED
              </label>
              <input
                type="number"
                min="0.01"
                max={FLIGHT_PRICING_LIMITS.maxRate}
                step="0.01"
                value={pricing.pkrPerAed}
                onChange={(e) => setPricing({ ...pricing, pkrPerAed: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
              />
              <p className="mt-1 text-[11px] text-text-light dark:text-white/50">
                PKR received for 1 AED — sets every PKR amount shown.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text dark:text-white mb-1">
                AED per provider unit
              </label>
              <input
                type="number"
                min="0.01"
                max={FLIGHT_PRICING_LIMITS.maxRate}
                step="0.0001"
                value={pricing.aedPerProviderUnit}
                onChange={(e) =>
                  setPricing({ ...pricing, aedPerProviderUnit: e.target.value })
                }
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
              />
              <p className="mt-1 text-[11px] text-text-light dark:text-white/50">
                Converts the provider fare currency. Ignav quotes USD: keep
                3.6725 (AED peg); use 1.00 for AED.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-2xl bg-white p-6 luxury-shadow dark:bg-navy-800 dark:border dark:border-white/10">
        <h3 className="text-lg font-bold text-text dark:text-white mb-4">
          Change Password
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text dark:text-white mb-1">
              Current Password
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 dark:bg-navy-900 dark:border-white/10">
              <Lock className="h-4 w-4 text-text-light dark:text-white/40" />
              <input
                type="password"
                value={password.current}
                onChange={(e) =>
                  setPassword({ ...password, current: e.target.value })
                }
                className="flex-1 bg-transparent text-sm text-text outline-none dark:text-white"
                placeholder="••••••••"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text dark:text-white mb-1">
                New Password
              </label>
              <input
                type="password"
                value={password.new}
                onChange={(e) =>
                  setPassword({ ...password, new: e.target.value })
                }
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text dark:text-white mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={password.confirm}
                onChange={(e) =>
                  setPassword({ ...password, confirm: e.target.value })
                }
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                placeholder="••••••••"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-xl gradient-gold px-6 py-3 text-sm font-semibold text-white"
        >
          <Save className="h-4 w-4" />
          Save Settings
        </button>
        <button
          onClick={handlePasswordSave}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium text-text dark:text-white dark:border-white/20"
        >
          <Lock className="h-4 w-4" />
          Change Password
        </button>
      </div>
    </div>
  );
}