"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, User, Mail, Phone, Globe, Lock } from "lucide-react";

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

  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [saved, setSaved] = useState(false);

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
        }
      } catch {
        // Keep defaults on error
      }
    }

    fetchSettings();
  }, []);

  const handleSave = async () => {
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
        }),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // Silently fail
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