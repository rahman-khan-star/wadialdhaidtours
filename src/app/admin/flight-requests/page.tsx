"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Eye,
  Loader2,
  Mail,
  Phone,
  Plane,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { FLIGHT_REQUEST_STATUSES, type FlightRequest, type FlightRequestStatus } from "@/types";

const STATUS_CLASSES: Record<FlightRequestStatus, string> = {
  New: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
  Contacted: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  "In Progress": "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  Completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <dt className="text-xs text-text-light dark:text-white/50">{label}</dt>
      <dd className="text-right text-xs font-semibold text-text dark:text-white">{value}</dd>
    </div>
  );
}

export default function AdminFlightRequestsPage() {
  const [requests, setRequests] = useState<FlightRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewing, setViewing] = useState<FlightRequest | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/flights/requests")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch flight requests");
        return res.json() as Promise<{ flightRequests: FlightRequest[] }>;
      })
      .then((data) => {
        if (!cancelled) setRequests(data.flightRequests);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load flight requests.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function showError(message: string) {
    setError(message);
    setTimeout(() => setError(null), 5000);
  }

  const needle = search.trim().toLowerCase();
  const filtered = requests.filter((request) =>
    [request.name, request.email, request.phone, request.flightNumber, request.airline, request.originCode, request.destinationCode, request.originName, request.destinationName]
      .join(" ")
      .toLowerCase()
      .includes(needle)
  );

  async function handleStatusChange(id: string, status: FlightRequestStatus) {
    try {
      const res = await fetch(`/api/flights/requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const data = await res.json();
      setRequests((prev) =>
        prev.map((request) => (request.id === id ? data.flightRequest : request))
      );
      setViewing((current) => (current && current.id === id ? data.flightRequest : current));
    } catch {
      showError("Failed to update request status.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this flight request?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/flights/requests/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete flight request");
      setRequests((prev) => prev.filter((request) => request.id !== id));
      setViewing((current) => (current && current.id === id ? null : current));
    } catch {
      showError("Failed to delete flight request.");
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text dark:text-white">Flight Requests</h2>
          <p className="text-sm text-text-light dark:text-white/60">
            Customer flight inquiries awaiting a quotation
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-xs font-medium text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
          <Plane className="h-4 w-4" />
          {requests.length} total
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:bg-red-900/20 dark:border-red-800/50">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-3 dark:bg-navy-800 dark:border-white/10">
        <Search className="h-4 w-4 text-text-light dark:text-white/40" />
        <input
          type="text"
          placeholder="Search by customer, route or flight number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm text-text outline-none dark:text-white"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white luxury-shadow dark:bg-navy-800 dark:border dark:border-white/10">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border dark:border-white/10">
              <th className="px-5 py-4 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-5 py-4 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase tracking-wider">
                Flight
              </th>
              <th className="px-5 py-4 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase tracking-wider">
                Route
              </th>
              <th className="px-5 py-4 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase tracking-wider">
                Travel
              </th>
              <th className="px-5 py-4 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase tracking-wider">
                Passengers
              </th>
              <th className="px-5 py-4 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase tracking-wider">
                Status
              </th>
              <th className="px-5 py-4 text-right text-xs font-medium text-text-light dark:text-white/40 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-white/10">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-text-light dark:text-white/50">
                  No flight requests found.
                </td>
              </tr>
            )}
            {filtered.map((request, i) => (
              <motion.tr
                key={request.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
              >
                <td className="px-5 py-4">
                  <p className="text-sm font-medium text-text dark:text-white">{request.name}</p>
                  <p className="text-xs text-text-light dark:text-white/50">{request.email}</p>
                  <p className="text-xs text-text-light dark:text-white/50">{request.phone}</p>
                </td>
                <td className="px-5 py-4">
                  <p className="text-sm text-text dark:text-white">{request.airline}</p>
                  <p className="text-xs text-text-light dark:text-white/50" style={{ fontFamily: "var(--font-mono)" }}>
                    {request.flightNumber}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <p className="text-sm text-text dark:text-white">
                    {request.originCode} → {request.destinationCode}
                  </p>
                  <p className="text-xs text-text-light dark:text-white/50">
                    {request.originName} to {request.destinationName}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <p className="text-sm text-text dark:text-white" style={{ fontFamily: "var(--font-mono)" }}>
                    {request.departureDate}
                  </p>
                  <p className="text-xs text-text-light dark:text-white/50">
                    {request.returnDate ? `Return ${request.returnDate}` : "One-way"}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <p className="text-sm text-text dark:text-white">{request.passengers}</p>
                  <p className="text-xs text-text-light dark:text-white/50">{request.cabin}</p>
                </td>
                <td className="px-5 py-4">
                  <select
                    value={request.status}
                    onChange={(e) =>
                      handleStatusChange(request.id, e.target.value as FlightRequestStatus)
                    }
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium border-none cursor-pointer ${
                      STATUS_CLASSES[request.status] ?? STATUS_CLASSES.New
                    }`}
                  >
                    {FLIGHT_REQUEST_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setViewing(request)}
                      title="View request"
                      className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-sky-50 dark:hover:bg-white/10"
                    >
                      <Eye className="h-4 w-4 text-text-light dark:text-white/60" />
                    </button>
                    <button
                      onClick={() => handleDelete(request.id)}
                      disabled={deleting === request.id}
                      title="Delete request"
                      className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 dark:bg-navy-800"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-text dark:text-white">Flight Request</h3>
                <p className="text-xs text-text-light dark:text-white/50">
                  Received {viewing.date}
                </p>
              </div>
              <button
                onClick={() => setViewing(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gold-50 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5 text-text-light dark:text-white/60" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-background px-4 py-3 dark:border-white/10 dark:bg-navy-900">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-light dark:text-white/40">
                  Customer
                </p>
                <p className="text-sm font-semibold text-text dark:text-white">{viewing.name}</p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-light dark:text-white/60">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {viewing.phone}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {viewing.email}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background px-4 py-3 dark:border-white/10 dark:bg-navy-900">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-light dark:text-white/40">
                  Selected flight
                </p>
                <dl>
                  <DetailRow label="Airline" value={viewing.airline} />
                  <DetailRow label="Flight number" value={viewing.flightNumber} />
                  <DetailRow
                    label="Origin"
                    value={`${viewing.originName} (${viewing.originCode})`}
                  />
                  <DetailRow
                    label="Destination"
                    value={`${viewing.destinationName} (${viewing.destinationCode})`}
                  />
                  <DetailRow label="Departure date" value={viewing.departureDate} />
                  <DetailRow
                    label="Return date"
                    value={viewing.returnDate ?? "One-way"}
                  />
                  <DetailRow
                    label="Passengers"
                    value={`${viewing.passengers} · ${viewing.cabin}`}
                  />
                </dl>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-text-light dark:text-white/50">
                  Status
                </label>
                <select
                  value={viewing.status}
                  onChange={(e) =>
                    handleStatusChange(viewing.id, e.target.value as FlightRequestStatus)
                  }
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                >
                  {FLIGHT_REQUEST_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-text-light dark:text-white/50">
                  Customer notes
                </label>
                <p className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-text whitespace-pre-wrap dark:bg-navy-900 dark:border-white/10 dark:text-white">
                  {viewing.message?.trim() ? viewing.message : "No additional notes provided."}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
