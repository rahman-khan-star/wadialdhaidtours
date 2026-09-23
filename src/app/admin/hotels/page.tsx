"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Loader2,
  AlertTriangle,
  Star,
  MapPin,
} from "lucide-react";
import type { Hotel } from "@/types";
import Image from "next/image";
import { ImageUploadField } from "@/components/admin/image-upload-field";

const initialHotels = [
  {
    id: "1",
    name: "Atlantis The Royal",
    location: "Dubai, UAE",
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
    rating: 4.9,
    price: 899,
    amenities: ["Spa", "Pool", "Restaurant", "Beach"],
  },
  {
    id: "2",
    name: "Burj Al Arab",
    location: "Dubai, UAE",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    rating: 4.9,
    price: 1299,
    amenities: ["Spa", "Pool", "Restaurant", "Helipad"],
  },
  {
    id: "3",
    name: "Shangrila Skardu",
    location: "Skardu, Pakistan",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    rating: 4.7,
    price: 299,
    amenities: ["Lake View", "Restaurant", "Garden", "WiFi"],
  },
  {
    id: "4",
    name: "Serena Islamabad",
    location: "Islamabad, Pakistan",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
    rating: 4.8,
    price: 349,
    amenities: ["Pool", "Spa", "Restaurant", "Gym"],
  },
  {
    id: "5",
    name: "Emirates Palace",
    location: "Abu Dhabi, UAE",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
    rating: 4.8,
    price: 799,
    amenities: ["Beach", "Pool", "Spa", "Restaurant"],
  },
  {
    id: "6",
    name: "Pearl Continental",
    location: "Lahore, Pakistan",
    image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
    rating: 4.5,
    price: 199,
    amenities: ["Pool", "Gym", "Restaurant", "WiFi"],
  },
];

export default function AdminHotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>(initialHotels);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Hotel | null>(null);
  const [form, setForm] = useState({
    name: "",
    location: "",
    image: "",
    rating: 4.5,
    price: 500,
    amenities: [] as string[],
  });

  useEffect(() => {
    fetchHotels();
  }, []);

  async function fetchHotels() {
    try {
      setLoading(true);
      const res = await fetch("/api/hotels");
      if (!res.ok) {
        setHotels(initialHotels);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setHotels(data.hotels);
    } catch {
      setHotels(initialHotels);
    } finally {
      setLoading(false);
    }
  }

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: "",
      location: "",
      image: "",
      rating: 4.5,
      price: 500,
      amenities: [],
    });
    setShowModal(true);
  };

  const openEdit = (h: Hotel) => {
    setEditing(h);
    setForm({
      name: h.name,
      location: h.location,
      image: h.image,
      rating: h.rating,
      price: h.price,
      amenities: h.amenities.slice(),
    });
    setShowModal(true);
  };

  async function handleSave() {
    setSaving(true);
    try {
      const hotelData = {
        name: form.name,
        location: form.location,
        image: form.image || "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
        rating: form.rating,
        price: form.price,
        amenities: form.amenities,
      };

      const url = editing ? `/api/hotels/${editing.id}` : "/api/hotels";
      const method = editing ? "PUT" : "POST";
      const body = editing ? { ...hotelData, id: editing.id } : hotelData;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save hotel");
      }

      await fetchHotels();
      setShowModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save hotel";
      setError(msg);
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this hotel?")) return;
    try {
      const res = await fetch(`/api/hotels/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete hotel");
      await fetchHotels();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete hotel";
      setError(msg);
      setTimeout(() => setError(null), 5000);
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
            Hotels
          </h2>
          <p className="text-sm text-text-light dark:text-white/60">
            Manage your luxury hotel accommodations
          </p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-xl gradient-gold px-4 py-2.5 text-sm font-semibold text-white">
          <Plus className="h-4 w-4" />
          Add Hotel
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:bg-red-900/20 dark:border-red-800/50">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {hotels.map((h: Hotel, i) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl bg-white p-5 luxury-shadow dark:bg-navy-800 dark:border dark:border-white/10"
          >
            <div className="relative h-56 overflow-hidden">
              <Image
                src={h.image}
                alt={h.name}
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover"
              />
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-secondary text-secondary" />
                  <span className="text-xs font-medium text-text dark:text-white">
                    {h.rating}
                  </span>
                </div>
                <span className="text-xs text-text-light dark:text-white/40">
                  •
                </span>
                <span className="text-xs text-text-light dark:text-white/60 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {h.location}
                </span>
              </div>
              <h3 className="text-lg font-bold text-text dark:text-white mb-2">
                {h.name}
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {h.amenities.map((a) => (
                  <span
                    key={a}
                    className="rounded-full bg-gold-50 px-2.5 py-0.5 text-xs font-medium text-secondary dark:bg-gold-900/30"
                  >
                    {a}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border dark:border-white/10">
                <div>
                  <span className="text-xs text-text-light dark:text-white/40">
                    Per night from
                  </span>
                  <p
                    className="text-xl font-bold text-secondary"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    ${h.price}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(h)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-sky-50 dark:hover:bg-white/10"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-text-light dark:text-white/60" />
                  </button>
                  <button
                    onClick={() => handleDelete(h.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </button>
                </div>
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
                {editing ? "Edit Hotel" : "Add Hotel"}
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
                    Full Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                    placeholder="Atlantis The Royal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text dark:text-white mb-1">
                    Location
                  </label>
                  <input
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                    placeholder="Dubai, UAE"
                  />
                </div>
              </div>
              <ImageUploadField
                label="Image URL"
                value={form.image}
                onChange={(image) => setForm({ ...form, image })}
                folder="hotels"
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
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text dark:text-white mb-1">
                    Price Per Night ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: parseInt(e.target.value) })
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text dark:text-white mb-1">
                  Amenities (comma separated)
                </label>
                <input
                  value={form.amenities.join(", ")}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      amenities: e.target
                        .value
                        .split(",")
                        .map((t: string) => t.trim())
                        .filter((t: string) => t.length > 0),
                    })
                  }
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                  placeholder="Spa, Pool, Restaurant, Beach"
                />
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
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}