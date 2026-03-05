"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

interface Job {
  id: number;
  company: string;
  role: string;
  status: "wishlist" | "applied" | "interview" | "offer";
  url?: string;
  notes?: string;
  salary?: string;
  location?: string;
  created_at?: string;
}

type Column = { id: Job["status"]; label: string; color: string; dot: string };

const COLUMNS: Column[] = [
  { id: "wishlist", label: "Wishlist", color: "border-stone-200", dot: "bg-stone-300" },
  { id: "applied", label: "Applied", color: "border-blue-200", dot: "bg-blue-400" },
  { id: "interview", label: "Interview", color: "border-amber-200", dot: "bg-amber-400" },
  { id: "offer", label: "Offer", color: "border-[#2d6a4f]", dot: "bg-[#2d6a4f]" },
];

const EMPTY_FORM = { company: "", role: "", url: "", notes: "", salary: "", location: "", status: "wishlist" as Job["status"] };

export default function JobsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<{ company?: string; role?: string }>({});
  const [saving, setSaving] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const authHeader = { Authorization: `Bearer ${session?.accessToken}` };

  const fetchJobs = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch("/python/jobs", { headers: authHeader });
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") fetchJobs();
  }, [status, fetchJobs]);

  const validate = () => {
    const errs: typeof formErrors = {};
    if (!form.company.trim()) errs.company = "Company is required";
    if (!form.role.trim()) errs.role = "Role is required";
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    try {
      if (editingJob) {
        const res = await fetch(`/python/jobs/${editingJob.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeader },
          body: JSON.stringify(form),
        });
        const updated = await res.json();
        setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
      } else {
        const res = await fetch("/python/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader },
          body: JSON.stringify(form),
        });
        const created = await res.json();
        setJobs((prev) => [created, ...prev]);
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditingJob(null);
      setFormErrors({});
    } catch { /* silent */ } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`/python/jobs/${id}`, { method: "DELETE", headers: authHeader });
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const openEdit = (job: Job) => {
    setForm({ company: job.company, role: job.role, url: job.url || "", notes: job.notes || "", salary: job.salary || "", location: job.location || "", status: job.status });
    setEditingJob(job);
    setShowForm(true);
  };

  const onDragEnd = async (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;
    const newStatus = destination.droppableId as Job["status"];
    const jobId = parseInt(draggableId, 10);
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j)));
    await fetch(`/python/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ status: newStatus }),
    });
  };

  const byStatus = (s: Job["status"]) => jobs.filter((j) => j.status === s);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {/* Top nav */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-stone-200 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-lg text-[#1a1a1a]">
          Pari<span className="text-[#2d6a4f]">chaya</span>
        </Link>
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setForm(EMPTY_FORM); setEditingJob(null); setFormErrors({}); setShowForm(true); }}
            className="px-4 py-2 rounded-full bg-[#1a1a1a] text-white text-sm font-semibold hover:bg-[#2d6a4f] transition-colors shadow-lg shadow-black/10"
          >
            + Add Job
          </button>
          <Link href="/dashboard" className="text-sm text-[#6b7280] hover:text-[#1a1a1a] transition-colors">
            ← Dashboard
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div className="px-6 py-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Job Tracker</h1>
        <p className="text-sm text-[#6b7280] mt-1">Drag cards to update status. {jobs.length} application{jobs.length !== 1 ? "s" : ""} tracked.</p>
      </div>

      {/* Kanban Board */}
      <div className="px-6 pb-10 max-w-7xl mx-auto overflow-x-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 min-w-[700px]">
            {COLUMNS.map((col) => (
              <div key={col.id} className="flex-1 min-w-[200px]">
                {/* Column header */}
                <div className={`flex items-center gap-2 px-3 py-2 mb-3 rounded-xl border ${col.color} bg-white`}>
                  <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className="text-sm font-semibold text-[#1a1a1a]">{col.label}</span>
                  <span className="ml-auto text-xs text-[#6b7280]" style={{ fontFamily: "var(--font-mono)" }}>
                    {byStatus(col.id).length}
                  </span>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[200px] rounded-2xl transition-colors ${
                        snapshot.isDraggingOver ? "bg-[#2d6a4f]/5" : "bg-transparent"
                      }`}
                    >
                      {byStatus(col.id).map((job, index) => (
                        <Draggable key={job.id} draggableId={String(job.id)} index={index}>
                          {(prov, snap) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className={`bg-white border border-stone-200 rounded-2xl p-4 mb-3 shadow-sm transition-shadow ${
                                snap.isDragging ? "shadow-lg shadow-black/10 rotate-1" : ""
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-[#1a1a1a] truncate">{job.role}</p>
                                  <p className="text-xs text-[#6b7280] truncate mt-0.5">{job.company}</p>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => openEdit(job)}
                                    className="p-1 rounded-lg hover:bg-stone-100 text-[#6b7280] hover:text-[#1a1a1a] transition-colors"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(job.id)}
                                    className="p-1 rounded-lg hover:bg-red-50 text-[#6b7280] hover:text-red-500 transition-colors"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              {job.location && (
                                <p className="text-xs text-[#6b7280] mt-2 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  </svg>
                                  {job.location}
                                </p>
                              )}
                              {job.salary && (
                                <p className="text-xs text-[#2d6a4f] mt-1 font-medium">{job.salary}</p>
                              )}
                              {job.url && (
                                <a
                                  href={job.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-[#2d6a4f] hover:underline mt-1 block truncate"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  View posting →
                                </a>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {byStatus(col.id).length === 0 && !snapshot.isDraggingOver && (
                        <div className="text-xs text-stone-300 text-center py-8">No jobs here yet</div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-4">
              {editingJob ? "Edit Application" : "Add Application"}
            </h2>

            <div className="space-y-3">
              {(["company", "role"] as const).map((field) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-[#1a1a1a] mb-1 capitalize">
                    {field} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form[field]}
                    onChange={(e) => { setForm((f) => ({ ...f, [field]: e.target.value })); setFormErrors((e2) => ({ ...e2, [field]: undefined })); }}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm text-[#1a1a1a] bg-stone-50 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] transition-all ${formErrors[field] ? "border-red-300 bg-red-50" : "border-stone-200"}`}
                  />
                  {formErrors[field] && <p className="mt-1 text-xs text-red-500">{formErrors[field]}</p>}
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-[#1a1a1a] mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Job["status"] }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-[#1a1a1a] bg-stone-50 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] transition-all"
                >
                  {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>

              {(["location", "salary", "url"] as const).map((field) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-[#1a1a1a] mb-1 capitalize">{field}</label>
                  <input
                    type="text"
                    value={form[field]}
                    onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                    placeholder={field === "url" ? "https://…" : field === "salary" ? "$100k – $130k" : ""}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-[#1a1a1a] bg-stone-50 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] transition-all"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-[#1a1a1a] mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-[#1a1a1a] bg-stone-50 resize-none focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setShowForm(false); setEditingJob(null); setFormErrors({}); }}
                className="flex-1 py-2.5 rounded-full border border-stone-200 text-sm font-semibold text-[#1a1a1a] hover:border-stone-300 hover:bg-stone-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-full bg-[#1a1a1a] text-white text-sm font-semibold hover:bg-[#2d6a4f] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                {editingJob ? "Save Changes" : "Add Job"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
