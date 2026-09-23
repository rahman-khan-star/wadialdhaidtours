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
  Clock,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { tourPackages as initialPackages } from "@/data";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import type { TourPackage } from "@/types";

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<TourPackage[]>(initialPackages);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TourPackage | null>(null);
  const [form, setForm] = useState({
    title: "",
    destination: "",
    description: "",
    image: "",
    duration: "",
    price: 0,
    originalPrice: 0,
    rating: 4.5,
    category: "dubai" as "dubai" | "pakistan" | "umrah" | "visa",
    highlights: "",
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  async function fetchPackages() {
    try {
      setLoading(true);
      const res = await fetch("/api/packages");
      if (!res.ok) throw new Error("Failed to fetch packages");
      const data = await res.json();
      setPackages(data.packages);
    } catch {
      setError("Could not load packages. Showing cached data.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = packages.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.destination.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm({
      title: "",
      destination: "",
      description: "",
      image: "",
      duration: "",
      price: 0,
      originalPrice: 0,
      rating: 4.5,
      category: "dubai",
      highlights: "",
    });
    setShowModal(true);
  };

  const openEdit = (pkg: TourPackage) => {
    setEditing(pkg);
    setForm({
      title: pkg.title,
      destination: pkg.destination,
      description: pkg.description,
      image: pkg.image,
      duration: pkg.duration,
      price: pkg.price,
      originalPrice: pkg.originalPrice || 0,
      rating: pkg.rating,
      category: pkg.category,
      highlights: pkg.highlights.join("\n"),
    });
    setShowModal(true);
  };

  async function handleSave() {
    setSaving(true);
    try {
      const newPkg: TourPackage = {
        id: editing?.id || form.title.toLowerCase().replace(/\s+/g, "-"),
        title: form.title,
        destination: form.destination,
        description: form.description,
        image: form.image || "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
        duration: form.duration,
        price: form.price,
        originalPrice: form.originalPrice || undefined,
        rating: form.rating,
        reviewCount: editing?.reviewCount || 0,
        highlights: form.highlights
          .split("\n")
          .map((h) => h.trim())
          .filter(Boolean),
        included: editing?.included || [],
        category: form.category,
      };

      const url = editing ? `/api/packages/${editing.id}` : "/api/packages";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? newPkg : { ...newPkg, id: undefined }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save package");
      }

      await fetchPackages();
      setShowModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save package";
      setError(msg);
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this package?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/packages/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete package");
      await fetchPackages();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete package";
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
            Tour Packages
          </h2>
          <p className="text-sm text-text-light dark:text-white/60">
            Manage your tour packages and pricing
          </p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-xl gradient-gold px-4 py-2.5 text-sm font-semibold text-white">
          <Plus className="h-4 w-4" />
          Add Package
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
          placeholder="Search packages..."
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
                Package
              </th>
              <th className="px-5 py-4 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase tracking-wider">
                Category
              </th>
              <th className="px-5 py-4 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-5 py-4 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase tracking-wider">
                Price
              </th>
              <th className="px-5 py-4 text-left text-xs font-medium text-text-light dark:text-white/40 uppercase tracking-wider">
                Rating
              </th>
              <th className="px-5 py-4 text-right text-xs font-medium text-text-light dark:text-white/40 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-white/10">
            {filtered.map((pkg) => (
              <tr key={pkg.id}>
                <td className="px-5 py-4">
                  <p className="text-sm font-medium text-text dark:text-white">
                    {pkg.title}
                  </p>
                  <p className="text-xs text-text-light dark:text-white/60 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {pkg.destination}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-gold-50 px-2.5 py-0.5 text-xs font-medium text-secondary capitalize dark:bg-gold-900/30">
                    {pkg.category}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-text-light dark:text-white/60 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {pkg.duration}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <p
                    className="text-sm font-semibold text-secondary"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    ${pkg.price.toLocaleString()}
                  </p>
                  {pkg.originalPrice && (
                    <p className="text-xs text-text-light line-through dark:text-white/40">
                      ${pkg.originalPrice.toLocaleString()}
                    </p>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-secondary text-secondary" />
                    <span className="text-sm text-text dark:text-white">
                      {pkg.rating}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(pkg)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gold-50 dark:hover:bg-white/10"
                    >
                      <Edit2 className="h-4 w-4 text-text-light dark:text-white/60" />
                    </button>
                    <button
                      onClick={() => handleDelete(pkg.id)}
                      disabled={deleting === pkg.id}
                      className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 dark:bg-navy-800"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-text dark:text-white">
                {editing ? "Edit Package" : "Add Package"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gold-50 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text dark:text-white mb-1">
                  Title
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text dark:text-white mb-1">
                    Destination
                  </label>
                  <input
                    value={form.destination}
                    onChange={(e) =>
                      setForm({ ...form, destination: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text dark:text-white mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category: e.target.value as typeof form.category,
                      })
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                  >
                    <option value="dubai">Dubai</option>
                    <option value="pakistan">Pakistan</option>
                    <option value="umrah">Umrah</option>
                    <option value="visa">Visa</option>
                  </select>
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
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none resize-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text dark:text-white mb-1">
                    Duration
                  </label>
                  <input
                    value={form.duration}
                    onChange={(e) =>
                      setForm({ ...form, duration: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                    placeholder="5 Days / 4 Nights"
                  />
                </div>
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
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text dark:text-white mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: parseInt(e.target.value) })
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text dark:text-white mb-1">
                    Original Price ($)
                  </label>
                  <input
                    type="number"
                    value={form.originalPrice}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        originalPrice: parseInt(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                  />
                </div>
              </div>
              <ImageUploadField
                label="Image URL"
                value={form.image}
                onChange={(image) => setForm({ ...form, image })}
                folder="packages"
              />
              <div>
                <label className="block text-sm font-medium text-text dark:text-white mb-1">
                  Highlights (one per line)
                </label>
                <textarea
                  rows={4}
                  value={form.highlights}
                  onChange={(e) =>
                    setForm({ ...form, highlights: e.target.value })
                  }
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none resize-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                  placeholder="Private yacht dinner&#10;Burj Khalifa access&#10;Desert safari"
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
