"use client";

import Image from "next/image";
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
} from "lucide-react";
import { teamMembers as initialTeamMembers } from "@/data";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import type { TeamMember } from "@/types";

export default function AdminTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [form, setForm] = useState({
    name: "",
    designation: "",
    photo: "",
    phone: "",
    whatsapp: "",
    description: "",
    isActive: true,
    displayOrder: 1,
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    try {
      setLoading(true);
      const res = await fetch("/api/team");
      if (!res.ok) throw new Error("Failed to fetch team members");
      const data = await res.json();
      setMembers(data.members);
    } catch {
      setError("Could not load team members. Showing cached data.");
    } finally {
      setLoading(false);
    }
  }

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: "",
      designation: "",
      photo: "",
      phone: "",
      whatsapp: "",
      description: "",
      isActive: true,
      displayOrder: members.length + 1,
    });
    setShowModal(true);
  };

  const openEdit = (m: TeamMember) => {
    setEditing(m);
    setForm({
      name: m.name,
      designation: m.designation,
      photo: m.photo,
      phone: m.phone,
      whatsapp: m.whatsapp,
      description: m.description || "",
      isActive: m.isActive,
      displayOrder: m.displayOrder,
    });
    setShowModal(true);
  };

  async function handleSave() {
    setSaving(true);
    try {
      const memberData = {
        name: form.name,
        designation: form.designation,
        photo: form.photo || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
        phone: form.phone,
        whatsapp: form.whatsapp,
        description: form.description,
        isActive: form.isActive,
        displayOrder: form.displayOrder,
      };

      const url = editing ? `/api/team/${editing.id}` : "/api/team";
      const method = editing ? "PUT" : "POST";
      const body = editing ? { ...memberData, id: editing.id } : memberData;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save team member");
      }

      await fetchMembers();
      setShowModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save team member";
      setError(msg);
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this team member?")) return;
    try {
      const res = await fetch(`/api/team/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete team member");
      await fetchMembers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete team member";
      setError(msg);
      setTimeout(() => setError(null), 5000);
    }
  }

  async function toggleActive(m: TeamMember) {
    try {
      const res = await fetch(`/api/team/${m.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !m.isActive }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      await fetchMembers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      setError(msg);
      setTimeout(() => setError(null), 5000);
    }
  }

  async function moveUp(index: number) {
    if (index === 0) return;
    const sorted = [...members].sort((a, b) => a.displayOrder - b.displayOrder);
    const temp = sorted[index].displayOrder;
    sorted[index].displayOrder = sorted[index - 1].displayOrder;
    sorted[index - 1].displayOrder = temp;
    setReordering(true);
    try {
      await Promise.all([
        fetch(`/api/team/${sorted[index].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: sorted[index].displayOrder }),
        }),
        fetch(`/api/team/${sorted[index - 1].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: sorted[index - 1].displayOrder }),
        }),
      ]);
      await fetchMembers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reorder";
      setError(msg);
      setTimeout(() => setError(null), 5000);
    } finally {
      setReordering(false);
    }
  }

  async function moveDown(index: number) {
    const sorted = [...members].sort((a, b) => a.displayOrder - b.displayOrder);
    if (index >= sorted.length - 1) return;
    const temp = sorted[index].displayOrder;
    sorted[index].displayOrder = sorted[index + 1].displayOrder;
    sorted[index + 1].displayOrder = temp;
    setReordering(true);
    try {
      await Promise.all([
        fetch(`/api/team/${sorted[index].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: sorted[index].displayOrder }),
        }),
        fetch(`/api/team/${sorted[index + 1].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: sorted[index + 1].displayOrder }),
        }),
      ]);
      await fetchMembers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reorder";
      setError(msg);
      setTimeout(() => setError(null), 5000);
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

  const sorted = [...members].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text dark:text-white">
            Team Members
          </h2>
          <p className="text-sm text-text-light dark:text-white/60">
            Manage your agency team members and their profiles
          </p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-xl gradient-gold px-4 py-2.5 text-sm font-semibold text-white">
          <Plus className="h-4 w-4" />
          Add Member
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:bg-red-900/20 dark:border-red-800/50">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {sorted.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-2xl bg-white p-5 luxury-shadow dark:bg-navy-800 dark:border dark:border-white/10 ${
              !m.isActive ? "opacity-50" : ""
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Image
                  src={m.photo}
                  alt={m.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-sm font-bold text-text dark:text-white">
                    {m.name}
                  </h3>
                  <p className="text-xs text-sky-500 font-medium">
                    {m.designation}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveUp(i)}
                  disabled={i === 0 || reordering}
                  className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-sky-50 dark:hover:bg-white/10 disabled:opacity-30"
                >
                  <GripVertical className="h-3.5 w-3.5 rotate-180 text-text-light dark:text-white/60" />
                </button>
                <button
                  onClick={() => moveDown(i)}
                  disabled={i === sorted.length - 1 || reordering}
                  className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-sky-50 dark:hover:bg-white/10 disabled:opacity-30"
                >
                  <GripVertical className="h-3.5 w-3.5 text-text-light dark:text-white/60" />
                </button>
              </div>
            </div>

            {m.description && (
              <p className="text-xs text-text-light dark:text-white/60 line-clamp-2 mb-3">
                {m.description}
              </p>
            )}

            <div className="flex items-center gap-2 text-xs text-text-light dark:text-white/40 mb-3">
              <span>{m.phone}</span>
              <span>|</span>
              <span>{m.whatsapp}</span>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => toggleActive(m)}
                disabled={reordering}
                className="flex items-center gap-1.5 text-xs font-medium"
              >
                {m.isActive ? (
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
                  onClick={() => openEdit(m)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-sky-50 dark:hover:bg-white/10"
                >
                  <Edit2 className="h-3.5 w-3.5 text-text-light dark:text-white/60" />
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
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
                {editing ? "Edit Team Member" : "Add Team Member"}
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
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text dark:text-white mb-1">
                    Designation
                  </label>
                  <input
                    value={form.designation}
                    onChange={(e) =>
                      setForm({ ...form, designation: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                    placeholder="e.g. CEO, Travel Consultant"
                  />
                </div>
              </div>
              <ImageUploadField
                label="Profile Photo URL"
                value={form.photo}
                onChange={(photo) => setForm({ ...form, photo })}
                folder="team"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text dark:text-white mb-1">
                    Phone Number
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                    placeholder="+971..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text dark:text-white mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    value={form.whatsapp}
                    onChange={(e) =>
                      setForm({ ...form, whatsapp: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none dark:bg-navy-900 dark:border-white/10 dark:text-white"
                    placeholder="+971..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text dark:text-white mb-1">
                  Short Description
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
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.displayOrder}
                    onChange={(e) =>
                      setForm({ ...form, displayOrder: parseInt(e.target.value) || 1 })
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
