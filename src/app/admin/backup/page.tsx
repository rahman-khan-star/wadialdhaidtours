"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Database, Download, Upload } from "lucide-react";

type RestoreTableResult = {
  table: string;
  upserted: number;
  error?: string;
};

type RestoreResponse = {
  success?: boolean;
  restoredRows?: number;
  skippedRows?: number;
  results?: RestoreTableResult[];
  error?: string;
};

export default function AdminBackupPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [restoreResults, setRestoreResults] = useState<RestoreTableResult[] | null>(null);

  async function handleExport() {
    setExporting(true);
    setMessage(null);
    setRestoreResults(null);
    try {
      const res = await fetch("/api/backup", { method: "POST" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Backup export failed");
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] || `wadi-backup-${Date.now()}.json`;

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);

      setMessage({ type: "success", text: `Backup downloaded as ${filename}` });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Backup export failed",
      });
    } finally {
      setExporting(false);
    }
  }

  async function handleRestoreFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: "error", text: "Backup file is too large (max 10MB)." });
      return;
    }

    const confirmed = window.confirm(
      "Restore will merge rows from this backup into the database (matched by ID). Existing records NOT in the backup are kept. Continue?"
    );
    if (!confirmed) return;

    setRestoring(true);
    setMessage(null);
    setRestoreResults(null);

    try {
      const text = await file.text();
      const res = await fetch("/api/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: text,
      });
      const data = (await res.json()) as RestoreResponse;

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Restore failed");
      }

      setRestoreResults(data.results ?? []);
      setMessage({
        type: "success",
        text: `Restore completed: ${data.restoredRows ?? 0} rows upserted${
          data.skippedRows ? `, ${data.skippedRows} rows skipped` : ""
        }.`,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Restore failed",
      });
    } finally {
      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-text dark:text-white">Backup &amp; Restore</h2>
        <p className="text-sm text-text-light dark:text-white/60">
          Export or restore website content. All operations run server-side.
        </p>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-4 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
              : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
          }`}
        >
          {message.text}
        </motion.div>
      )}

      <div className="rounded-2xl bg-white p-6 luxury-shadow dark:bg-navy-800 dark:border dark:border-white/10">
        <div className="flex items-start gap-3 mb-4">
          <Download className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-bold text-text dark:text-white">Export Backup</h3>
            <p className="text-sm text-text-light dark:text-white/60">
              Downloads a JSON file containing all website content tables (destinations,
              packages, bookings, messages, settings, and more). Admin credentials and audit
              logs are never included.
            </p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-xl gradient-gold px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {exporting ? "Preparing backup..." : "Download Backup"}
        </button>
      </div>

      <div className="rounded-2xl bg-white p-6 luxury-shadow dark:bg-navy-800 dark:border dark:border-white/10">
        <div className="flex items-start gap-3 mb-4">
          <Upload className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-bold text-text dark:text-white">Restore from Backup</h3>
            <p className="text-sm text-text-light dark:text-white/60">
              Upload a previously exported backup file. Rows are merged by ID — nothing outside
              the backup file is deleted, and only known tables/columns are accepted. Restore
              does not modify admin credentials.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleRestoreFile(file);
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={restoring}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium text-text dark:text-white dark:border-white/20 disabled:opacity-50"
          >
            <Database className="h-4 w-4" />
            {restoring ? "Restoring..." : "Choose Backup File"}
          </button>
        </div>

        {restoreResults && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border dark:border-white/10">
                  <th className="pb-2 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase">Table</th>
                  <th className="pb-2 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase">Rows Upserted</th>
                  <th className="pb-2 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-white/10">
                {restoreResults.map((result) => (
                  <tr key={result.table}>
                    <td className="py-2 text-sm text-text dark:text-white">{result.table}</td>
                    <td className="py-2 text-sm text-text dark:text-white">{result.upserted}</td>
                    <td className="py-2 text-sm">
                      {result.error ? (
                        <span className="text-red-500">{result.error}</span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-text-light dark:text-white/40">
        Limitations: this is a logical JSON export of application tables — it is not a physical
        database snapshot. For full disaster recovery, also use Supabase&apos;s automatic
        database backups / point-in-time recovery.
      </p>
    </div>
  );
}
