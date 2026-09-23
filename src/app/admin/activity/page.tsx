"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, ScrollText } from "lucide-react";

type ActivityLog = {
  id: string;
  action: string;
  resource: string;
  resource_id: string | null;
  actor: string;
  ip_address: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

function formatTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

function actionBadgeClass(action: string): string {
  if (action === "login_failed" || action === "rate_limit_blocked") {
    return "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400";
  }
  if (action === "delete") {
    return "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400";
  }
  if (action === "login" || action === "create" || action === "backup_create") {
    return "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400";
  }
  if (action === "settings_update" || action === "backup_restore" || action === "update" || action === "status_change") {
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400";
  }
  return "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white/60";
}

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      const res = await fetch("/api/activity-logs?limit=100");
      if (!res.ok) throw new Error("Failed to load activity logs");
      const data = await res.json();
      setLogs(data.logs ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text dark:text-white">Activity Logs</h2>
          <p className="text-sm text-text-light dark:text-white/60">
            Server-recorded admin actions and security events
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchLogs();
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
            <ScrollText className="h-6 w-6 animate-pulse text-sky-500" />
          </div>
        ) : logs.length === 0 ? (
          <p className="py-10 text-center text-sm text-text-light dark:text-white/60">
            No activity recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border dark:border-white/10">
                  <th className="pb-3 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase">Time</th>
                  <th className="pb-3 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase">Action</th>
                  <th className="pb-3 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase">Resource</th>
                  <th className="pb-3 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase">Record</th>
                  <th className="pb-3 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase">Actor</th>
                  <th className="pb-3 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase">IP</th>
                  <th className="pb-3 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-white/10">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-3 text-xs text-text-light dark:text-white/60 whitespace-nowrap">
                      {formatTime(log.created_at)}
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${actionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-text dark:text-white">{log.resource}</td>
                    <td className="py-3 max-w-[10rem] truncate text-xs text-text-light dark:text-white/60" title={log.resource_id ?? ""}>
                      {log.resource_id ?? "—"}
                    </td>
                    <td className="py-3 text-sm text-text dark:text-white">{log.actor}</td>
                    <td className="py-3 text-xs text-text-light dark:text-white/60">{log.ip_address ?? "—"}</td>
                    <td className="py-3 max-w-[16rem] truncate text-xs text-text-light dark:text-white/60" title={JSON.stringify(log.metadata)}>
                      {Object.keys(log.metadata ?? {}).length > 0 ? JSON.stringify(log.metadata) : "—"}
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
