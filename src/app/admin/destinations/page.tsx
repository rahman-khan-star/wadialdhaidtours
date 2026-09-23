"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Star,
  X,
  MapPin,
  Save,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { destinations as initialDestinations } from "@/data";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import type { Destination } from "@/types";

export default function AdminDestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>(initialDestinations);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Destination | null>(null);
  const [form, setForm] = useState({
    name: "",
    country: "",
    description: "",
    image: "",
    rating: 4.5,
    priceFrom: 500,
    tags: "",
  });

  useEffect(() => {
    fetchDestinations();
  }, []);

  async function fetchDestinations() {
    try {
      setLoading(true);
      const res = await fetch("/api/destinations");
      if (!res.ok) throw new Error("Failed to fetch destinations");
      const data = await res.json();
      setDestinations(data.destinations);
    } catch {
      setError("Could not load destinations. Showing cached data.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = destinations.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.country.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: "",
      country: "",
      description: "",
      image: "",
      rating: 4.5,
      priceFrom: 500,
      tags: "",
    });
    setShowModal(true);
  };

  const openEdit = (dest: Destination) => {
    setEditing(dest);
    setForm({
      name: dest.name,
      country: dest.country,
      description: dest.description,
      image: dest.image,
      rating: dest.rating,
      priceFrom: dest.priceFrom,
      tags: dest.tags.join(", "),
    });
    setShowModal(true);
  };

  async function handleSave() {
    setSaving(true);
    try {
      const newDest: Destination = {
        id: editing?.id || form.name.toLowerCase().replace(/\s+/g, "-"),
        name: form.name,
        country: form.country,
        description: form.description,
        image: form.image || "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
        rating: form.rating,
        priceFrom: form.priceFrom,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      const url = editing ? `/api/destinations/${editing.id}` : "/api/destinations";
      const method = editing ? "PUT" : "POST";
      const body = editing ? newDest : { ...newDest, id: undefined };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save destination");
      }

      await fetchDestinations();
      setShowModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save destination";
      setError(msg);
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this destination?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/destinations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete destination");
      await fetchDestinations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete destination";
      setError(msg);
      setTimeout(() => setError(null), 5000);
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
          <h2 className="text-2xl font-bold text-text dark:text-white">
            Destinations
          </h2>
          <p className="text-sm text-text-light dark:text-white/60">
            Manage your travel destinations
          </p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-xl gradient-gold px-4 py-2.5 text-sm font-semibold text-white">
          <Plus className="h-4 w-4" />
          Add Destination
        </button>
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
          placeholder="Search destinations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm text-text outline-none dark:text-white"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((dest, i) => (
          <motion.div
            key={dest.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl bg-white p-5 luxury-shadow dark:bg-navy-800 dark:border dark:border-white/10"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-text dark:text-white">
                  {dest.name}
                </h3>
                <p className="text-xs text-text-light dark:text-white/60 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {dest.country}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-secondary text-secondary" />
                <span className="text-xs font-medium text-text dark:text-white">
                  {dest.rating}
                </span>
              </div>
            </div>
            <p className="text-sm text-text-light dark:text-white/60 line-clamp-2 mb-3">
              {dest.description}
            </p>
            <div className="flex items-center justify-between">
              <p
                className="text-lg font-bold text-secondary"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                ${dest.priceFrom.toLocaleString()}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(dest)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gold-50 dark:hover:bg-white/10"
                >
                  <Edit2 className="h-4 w-4 text-text-light dark:text-white/60" />
                </button>
                <button
                  onClick={() => handleDelete(dest.id)}
                  disabled={deleting === dest.id}
                  className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
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
            className="w-full max-w-lg rounded-2xl bg-white p-6 dark:bg-navy-800"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-text dark:text-white">
                {editing ? "Edit Destination" : "Add Destination"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gold-50 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text dark:text-white mb-1">
                    Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none focus:ring-2 focus:ring-secondary/20 dark:bg-navy-900 dark:border-white/10 dark:text-white"
                    placeholder="Dubai"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text dark:text-white mb-1">
                    Country
                  </label>
                  <input
                    value={form.country}
                    onChange={(e) =>
                      setForm({ ...form, country: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none focus:ring-2 focus:ring-secondary/20 dark:bg-navy-900 dark:border-white/10 dark:text-white"
                    placeholder="UAE"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text dark:text-white mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none focus:ring-2 focus:ring-secondary/20 resize-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                  placeholder="Describe the destination..."
                />
              </div>
              <ImageUploadField
                label="Image URL"
                value={form.image}
                onChange={(image) => setForm({ ...form, image })}
                folder="destinations"
                inputClassName="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none focus:ring-2 focus:ring-secondary/20 dark:bg-navy-900 dark:border-white/10 dark:text-white"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text dark:text-white mb-1">
                    Rating
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={form.rating}
                    onChange={(e) =>
                      setForm({ ...form, rating: parseFloat(e.target.value) })
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none focus:ring-2 focus:ring-secondary/20 dark:bg-navy-900 dark:border-white/10 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text dark:text-white mb-1">
                    Price From ($)
                  </label>
                  <input
                    type="number"
                    value={form.priceFrom}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        priceFrom: parseInt(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none focus:ring-2 focus:ring-secondary/20 dark:bg-navy-900 dark:border-white/10 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text dark:text-white mb-1">
                  Tags (comma separated)
                </label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none focus:ring-2 focus:ring-secondary/20 dark:bg-navy-900 dark:border-white/10 dark:text-white"
                  placeholder="luxury, beach, adventure"
                />
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
