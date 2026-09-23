"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { History, RefreshCw } from "lucide-react";

type LoginHistoryEntry = {
  id: string;
  username: string;
  status: "success" | "failed" | "rate_limited" | "logout";
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

function formatTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

function statusBadgeClass(status: LoginHistoryEntry["status"]): string {
  switch (status) {
    case "success":
      return "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400";
    case "failed":
      return "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400";
    case "rate_limited":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white/60";
  }
}

export default function AdminLoginHistoryPage() {
  const [entries, setEntries] = useState<LoginHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEntries();
  }, []);

  async function fetchEntries() {
    try {
      const res = await fetch("/api/login-history?limit=100");
      if (!res.ok) throw new Error("Failed to load login history");
      const data = await res.json();
      setEntries(data.entries ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load login history");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text dark:text-white">Login History</h2>
          <p className="text-sm text-text-light dark:text-white/60">
            Authentication attempts recorded server-side (no passwords stored)
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchEntries();
          }}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text dark:text-white dark:border-white/20 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white p-6 luxury-shadow dark:bg-navy-800 dark:border dark:border-white/10"
      >
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <History className="h-6 w-6 animate-pulse text-sky-500" />
          </div>
        ) : entries.length === 0 ? (
          <p className="py-10 text-center text-sm text-text-light dark:text-white/60">
            No login activity recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border dark:border-white/10">
                  <th className="pb-3 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase">Time</th>
                  <th className="pb-3 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase">Username</th>
                  <th className="pb-3 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase">Status</th>
                  <th className="pb-3 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase">IP</th>
                  <th className="pb-3 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase">User Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-white/10">
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-3 text-xs text-text-light dark:text-white/60 whitespace-nowrap">
                      {formatTime(entry.created_at)}
                    </td>
                    <td className="py-3 text-sm font-medium text-text dark:text-white">{entry.username}</td>
                    <td className="py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(entry.status)}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-text-light dark:text-white/60">{entry.ip_address ?? "—"}</td>
                    <td className="py-3 max-w-[20rem] truncate text-xs text-text-light dark:text-white/60" title={entry.user_agent ?? ""}>
                      {entry.user_agent ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
