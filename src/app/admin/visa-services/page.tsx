"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  GripVertical,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { visaServices as initialVisaServices } from "@/data";
import type { VisaService } from "@/types";

type VisaForm = {
  country: string;
  flag: string;
  type: string;
  duration: string;
  price: number;
  processingTime: string;
  requirements: string[];
  isActive: boolean;
  displayOrder: number;
};

function toSorted(services: VisaService[]): VisaService[] {
  return [...services].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
  );
}

export default function AdminVisaServicesPage() {
  const [services, setServices] = useState<VisaService[]>(initialVisaServices);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<VisaService | null>(null);
  const [form, setForm] = useState<VisaForm>({
    country: "",
    flag: "",
    type: "",
    duration: "",
    price: 150,
    processingTime: "",
    requirements: [],
    isActive: true,
    displayOrder: 1,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  function showError(message: string) {
    setError(message);
    setTimeout(() => setError(null), 5000);
  }

  async function fetchServices() {
    try {
      setLoading(true);
      const res = await fetch("/api/visa-services");
      if (!res.ok) throw new Error("Failed to fetch visa services");
      const data = await res.json();
      setServices(data.visaServices);
    } catch {
      setError("Could not load visa services. Showing cached data.");
    } finally {
      setLoading(false);
    }
  }

  const openAdd = () => {
    setEditing(null);
    setForm({
      country: "",
      flag: "",
      type: "",
      duration: "",
      price: 150,
      processingTime: "",
      requirements: [],
      isActive: true,
      displayOrder: services.length + 1,
    });
    setShowModal(true);
  };

  const openEdit = (service: VisaService) => {
    setEditing(service);
    setForm({
      country: service.country,
      flag: service.flag,
      type: service.type,
      duration: service.duration,
      price: service.price,
      processingTime: service.processingTime,
      requirements: service.requirements.slice(),
      isActive: service.isActive ?? true,
      displayOrder: service.displayOrder ?? services.length + 1,
    });
    setShowModal(true);
  };

  async function handleSave() {
    if (!form.country.trim() || !form.type.trim()) {
      showError("Country and visa type are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        country: form.country,
        flag: form.flag,
        type: form.type,
        duration: form.duration,
        price: form.price,
        processingTime: form.processingTime,
        requirements: form.requirements,
        isActive: form.isActive,
        displayOrder: form.displayOrder,
      };

      const url = editing ? `/api/visa-services/${editing.id}` : "/api/visa-services";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save visa service");
      }

      await fetchServices();
      setShowModal(false);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Failed to save visa service");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this visa service?")) return;
    try {
      const res = await fetch(`/api/visa-services/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete visa service");
      }
      await fetchServices();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Failed to delete visa service");
    }
  }

  async function toggleActive(service: VisaService) {
    try {
      const res = await fetch(`/api/visa-services/${service.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !(service.isActive ?? true) }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      await fetchServices();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  // Re-sends the full ordering so duplicated or unset positions cannot strand
  // a card in the wrong place.
  async function move(offset: number, index: number) {
    const sorted = toSorted(services);
    const target = index + offset;
    if (target < 0 || target >= sorted.length) return;

    [sorted[index], sorted[target]] = [sorted[target], sorted[index]];

    setReordering(true);
    try {
      const results = await Promise.all(
        sorted.map((service, position) =>
          fetch(`/api/visa-services/${service.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ displayOrder: position + 1 }),
          })
        )
      );
      const failed = results.find((res) => !res.ok);
      if (failed) throw new Error("Failed to reorder");
      await fetchServices();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Failed to reorder");
    } finally {
      setReordering(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  const sorted = toSorted(services);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text dark:text-white">
            Visa Services
          </h2>
          <p className="text-sm text-text-light dark:text-white/60">
            Manage the visas offered on your public website
          </p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-xl gradient-gold px-4 py-2.5 text-sm font-semibold text-white">
          <Plus className="h-4 w-4" />
          Add Visa Service
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:bg-red-900/20 dark:border-red-800/50">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {sorted.map((service, i) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-2xl bg-white p-5 luxury-shadow dark:bg-navy-800 dark:border dark:border-white/10 ${
              !(service.isActive ?? true) ? "opacity-50" : ""
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{service.flag}</span>
                <div>
                  <h3 className="text-sm font-bold text-text dark:text-white">
                    {service.type}
                  </h3>
                  <p className="text-xs text-sky-500 font-medium">
                    {service.country} — {service.duration} stay
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => move(-1, i)}
                  disabled={i === 0 || reordering}
                  className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-sky-50 dark:hover:bg-white/10 disabled:opacity-30"
                >
                  <GripVertical className="h-3.5 w-3.5 rotate-180 text-text-light dark:text-white/60" />
                </button>
                <button
                  onClick={() => move(1, i)}
                  disabled={i === sorted.length - 1 || reordering}
                  className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-sky-50 dark:hover:bg-white/10 disabled:opacity-30"
                >
                  <GripVertical className="h-3.5 w-3.5 text-text-light dark:text-white/60" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-light dark:text-white/40 mb-3">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {service.processingTime}
              </span>
              <span>{service.requirements.length} requirements</span>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => toggleActive(service)}
                disabled={reordering}
                className="flex items-center gap-1.5 text-xs font-medium"
              >
                {(service.isActive ?? true) ? (
                  <>
                    <ToggleRight className="h-5 w-5 text-emerald-500" />
                    <span className="text-emerald-500">Active</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-5 w-5 text-slate-400" />
                    <span className="text-slate-400">Inactive</span>
                  </>
                )}
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(service)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-sky-50 dark:hover:bg-white/10"
                >
                  <Edit2 className="h-3.5 w-3.5 text-text-light dark:text-white/60" />
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  disabled={reordering}
                  className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 dark:bg-navy-800"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-text dark:text-white">
                {editing ? "Edit Visa Service" : "Add Visa Service"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-sky-50 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text dark:text-white mb-1">
                    Country
                  </label>
                  <input
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                    placeholder="United Arab Emirates"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text dark:text-white mb-1">
                    Flag
                  </label>
                  <input
                    value={form.flag}
                    onChange={(e) => setForm({ ...form, flag: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                    placeholder="🇦🇪"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text dark:text-white mb-1">
                    Visa Type
                  </label>
                  <input
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                    placeholder="Tourist Visa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text dark:text-white mb-1">
                    Stay Duration
                  </label>
                  <input
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                    placeholder="30 Days"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text dark:text-white mb-1">
                    Visa Fee ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: parseInt(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text dark:text-white mb-1">
                    Processing Time
                  </label>
                  <input
                    value={form.processingTime}
                    onChange={(e) =>
                      setForm({ ...form, processingTime: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                    placeholder="3-5 Business Days"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text dark:text-white mb-1">
                  Requirements (comma separated)
                </label>
                <input
                  value={form.requirements.join(", ")}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      requirements: e.target.value
                        .split(",")
                        .map((item: string) => item.trim())
                        .filter((item: string) => item.length > 0),
                    })
                  }
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                  placeholder="Valid passport (6+ months), Passport-size photographs"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text dark:text-white mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.displayOrder}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        displayOrder: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text dark:text-white mb-1">
                    Status
                  </label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                    className="flex items-center gap-2 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                  >
                    {form.isActive ? (
                      <>
                        <ToggleRight className="h-5 w-5 text-emerald-500" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-5 w-5 text-slate-400" />
                        <span>Inactive</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text dark:text-white dark:border-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl gradient-gold px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editing ? "Update" : "Save"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
