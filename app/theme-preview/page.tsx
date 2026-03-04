"use client";

import React, { useState } from "react";
import Link from "next/link";

// ─── Theme Definitions ────────────────────────────────────────────────────────

const THEMES = [
  {
    id: 1,
    name: "Clean SaaS",
    desc: "Vercel/Linear style — polished, modern, gradient accents",
    style: {
      page: { background: "#ffffff", color: "#0f172a", fontFamily: "Inter, system-ui, sans-serif" },
      nav: { background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0" },
      logo: { background: "linear-gradient(135deg, #7c3aed, #4f46e5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
      badge: { background: "#ede9fe", color: "#6d28d9", borderRadius: "9999px", border: "none" },
      headline: { color: "#0f172a" },
      headlineSpan: { background: "linear-gradient(135deg, #7c3aed, #4f46e5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
      sub: { color: "#64748b" },
      primaryBtn: { background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "#fff", border: "none", borderRadius: "12px", boxShadow: "0 4px 14px rgba(124,58,237,0.35)" },
      secondaryBtn: { background: "#fff", color: "#374151", border: "2px solid #e2e8f0", borderRadius: "12px" },
      statBox: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px" },
      statNum: { background: "linear-gradient(135deg, #7c3aed, #4f46e5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
      statLabel: { color: "#64748b" },
      card: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)" },
      featureIcon: { background: "#ede9fe", color: "#7c3aed", borderRadius: "10px" },
    },
  },
  {
    id: 3,
    name: "Warm Minimal",
    desc: "Calm & professional — linen bg, forest green accent, no-fuss",
    style: {
      page: { background: "#faf8f4", color: "#1c1917", fontFamily: "'DM Sans', system-ui, sans-serif" },
      nav: { background: "#faf8f4", borderBottom: "1px solid #d6d3d1" },
      logo: { color: "#1c1917" },
      badge: { background: "#dcfce7", color: "#15803d", borderRadius: "4px", border: "1px solid #bbf7d0" },
      headline: { color: "#1c1917" },
      headlineSpan: { color: "#16a34a" },
      sub: { color: "#57534e" },
      primaryBtn: { background: "#16a34a", color: "#fff", border: "none", borderRadius: "8px" },
      secondaryBtn: { background: "transparent", color: "#1c1917", border: "1.5px solid #a8a29e", borderRadius: "8px" },
      statBox: { background: "#fff", border: "1px solid #d6d3d1", borderRadius: "8px" },
      statNum: { color: "#16a34a" },
      statLabel: { color: "#78716c" },
      card: { background: "#fff", border: "1px solid #d6d3d1", borderRadius: "8px" },
      featureIcon: { background: "#dcfce7", color: "#16a34a", borderRadius: "8px" },
    },
  },
  {
    id: 5,
    name: "Glassmorphism",
    desc: "Deep navy with frosted glass cards — sleek and premium",
    style: {
      page: { background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)", color: "#f1f5f9", fontFamily: "Inter, system-ui, sans-serif" },
      nav: { background: "rgba(255,255,255,0.05)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.1)" },
      logo: { color: "#f1f5f9" },
      badge: { background: "rgba(20,184,166,0.15)", color: "#2dd4bf", borderRadius: "9999px", border: "1px solid rgba(20,184,166,0.3)" },
      headline: { color: "#f1f5f9" },
      headlineSpan: { color: "#2dd4bf" },
      sub: { color: "#94a3b8" },
      primaryBtn: { background: "#14b8a6", color: "#0f172a", border: "none", borderRadius: "12px", boxShadow: "0 0 20px rgba(20,184,166,0.4)" },
      secondaryBtn: { background: "rgba(255,255,255,0.08)", color: "#f1f5f9", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px" },
      statBox: { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px", backdropFilter: "blur(12px)" },
      statNum: { color: "#2dd4bf" },
      statLabel: { color: "#94a3b8" },
      card: { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "20px", backdropFilter: "blur(16px)" },
      featureIcon: { background: "rgba(20,184,166,0.15)", color: "#2dd4bf", borderRadius: "10px" },
    },
  },
  {
    id: 6,
    name: "Newspaper / Editorial",
    desc: "High contrast, bold serifs, single accent — commanding and distinctive",
    style: {
      page: { background: "#fffef7", color: "#111111", fontFamily: "'Georgia', serif" },
      nav: { background: "#111111", borderBottom: "3px solid #111111" },
      logo: { color: "#fffef7", fontFamily: "'Georgia', serif" },
      badge: { background: "transparent", color: "#dc2626", borderRadius: "0", border: "1.5px solid #dc2626" },
      headline: { color: "#111111", fontFamily: "'Georgia', serif" },
      headlineSpan: { color: "#dc2626" },
      sub: { color: "#444444", fontFamily: "system-ui, sans-serif" },
      primaryBtn: { background: "#111111", color: "#fffef7", border: "2px solid #111111", borderRadius: "0" },
      secondaryBtn: { background: "transparent", color: "#111111", border: "2px solid #111111", borderRadius: "0" },
      statBox: { background: "transparent", border: "none", borderRight: "2px solid #111111", borderRadius: "0" },
      statNum: { color: "#dc2626", fontFamily: "'Georgia', serif" },
      statLabel: { color: "#444444", fontFamily: "system-ui, sans-serif" },
      card: { background: "#fff", border: "1.5px solid #111111", borderRadius: "0" },
      featureIcon: { background: "#dc2626", color: "#fff", borderRadius: "0" },
    },
  },
  {
    id: 7,
    name: "Soft Pastel",
    desc: "Friendly & approachable — lavender bg, indigo accent, rounded everything",
    style: {
      page: { background: "#f0f4ff", color: "#1e293b", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" },
      nav: { background: "rgba(240,244,255,0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid #c7d2fe" },
      logo: { color: "#4f46e5" },
      badge: { background: "#e0e7ff", color: "#4338ca", borderRadius: "9999px", border: "none" },
      headline: { color: "#1e293b" },
      headlineSpan: { color: "#6366f1" },
      sub: { color: "#64748b" },
      primaryBtn: { background: "#6366f1", color: "#fff", border: "none", borderRadius: "20px", boxShadow: "0 4px 14px rgba(99,102,241,0.3)" },
      secondaryBtn: { background: "#fff", color: "#4338ca", border: "2px solid #c7d2fe", borderRadius: "20px" },
      statBox: { background: "#fff", border: "1px solid #c7d2fe", borderRadius: "20px" },
      statNum: { color: "#6366f1" },
      statLabel: { color: "#64748b" },
      card: { background: "#fff", border: "1px solid #c7d2fe", borderRadius: "20px", boxShadow: "0 4px 12px rgba(99,102,241,0.08)" },
      featureIcon: { background: "#e0e7ff", color: "#6366f1", borderRadius: "12px" },
    },
  },
  {
    id: 8,
    name: "Apple-inspired",
    desc: "Ultra-clean and spacious — pure white, Apple blue, generous padding",
    style: {
      page: { background: "#ffffff", color: "#1d1d1f", fontFamily: "-apple-system, 'SF Pro Display', system-ui, sans-serif" },
      nav: { background: "rgba(255,255,255,0.72)", backdropFilter: "saturate(180%) blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.1)" },
      logo: { color: "#0071e3" },
      badge: { background: "#f5f5f7", color: "#6e6e73", borderRadius: "6px", border: "none" },
      headline: { color: "#1d1d1f" },
      headlineSpan: { color: "#0071e3" },
      sub: { color: "#6e6e73" },
      primaryBtn: { background: "#0071e3", color: "#fff", border: "none", borderRadius: "980px" },
      secondaryBtn: { background: "transparent", color: "#0071e3", border: "none", borderRadius: "980px", textDecoration: "underline" },
      statBox: { background: "#f5f5f7", border: "none", borderRadius: "12px" },
      statNum: { color: "#1d1d1f" },
      statLabel: { color: "#6e6e73" },
      card: { background: "#f5f5f7", border: "none", borderRadius: "18px" },
      featureIcon: { background: "#e8f0fb", color: "#0071e3", borderRadius: "10px" },
    },
  },
];

// ─── Mini Theme Card ───────────────────────────────────────────────────────────

const FEATURES = [
  { title: "ATS Optimized", body: "Every resume passes ATS scanners." },
  { title: "Zero Hallucinations", body: "Grounded in your real experience." },
  { title: "6 Pro Templates", body: "Classic, modern, minimal and more." },
];

function ThemeCard({ theme, selected, onSelect }: { theme: typeof THEMES[0]; selected: boolean; onSelect: () => void }) {
  const s = theme.style;

  return (
    <div
      onClick={onSelect}
      className="cursor-pointer transition-all duration-200"
      style={{
        outline: selected ? "3px solid #6366f1" : "3px solid transparent",
        outlineOffset: "4px",
        borderRadius: "8px",
      }}
    >
      {/* Mini preview */}
      <div
        style={{
          ...s.page,
          height: "420px",
          overflow: "hidden",
          position: "relative",
          borderRadius: "8px",
          border: "1px solid rgba(0,0,0,0.1)",
          fontSize: "10px",
          transform: "scale(1)",
          userSelect: "none",
        }}
      >
        {/* Nav */}
        <div style={{ ...s.nav, padding: "8px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
          <span style={{ ...s.logo, fontWeight: 800, fontSize: "11px" }}>ResumeAI</span>
          <div style={{ display: "flex", gap: "6px" }}>
            <span style={{ fontSize: "9px", color: s.sub?.color, padding: "3px 6px" }}>Login</span>
            <span style={{ ...s.primaryBtn, fontSize: "9px", padding: "3px 8px", fontWeight: 700, display: "inline-block" }}>Get Started</span>
          </div>
        </div>

        {/* Hero */}
        <div style={{ padding: "20px 16px 12px" }}>
          <span style={{ ...s.badge, fontSize: "8px", padding: "2px 6px", fontWeight: 600, display: "inline-block", marginBottom: "10px" }}>
            AI · ATS-Optimized · 2026
          </span>
          <h1 style={{ ...s.headline, fontSize: "20px", fontWeight: 900, lineHeight: 1.1, marginBottom: "8px" }}>
            Land Your<br />Dream Job{" "}
            <span style={s.headlineSpan}>with AI.</span>
          </h1>
          <p style={{ ...s.sub, fontSize: "9px", marginBottom: "12px", lineHeight: 1.5, maxWidth: "200px" }}>
            AI-powered resumes tailored to every job description. Zero hallucinations.
          </p>
          <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
            <span style={{ ...s.primaryBtn, fontSize: "9px", padding: "5px 10px", fontWeight: 700, display: "inline-block" }}>
              Start Free →
            </span>
            <span style={{ ...s.secondaryBtn, fontSize: "9px", padding: "5px 10px", fontWeight: 600, display: "inline-block" }}>
              How it works
            </span>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
            {[["50K+", "Resumes"], ["89%", "Interview Rate"], ["6", "Templates"]].map(([v, l]) => (
              <div key={l} style={{ ...s.statBox, padding: "6px 8px", flex: 1, textAlign: "center" as const }}>
                <div style={{ ...s.statNum, fontSize: "12px", fontWeight: 900 }}>{v}</div>
                <div style={{ ...s.statLabel, fontSize: "7px" }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Feature cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{ ...s.card, padding: "8px" }}>
                <div style={{ ...s.featureIcon, width: "14px", height: "14px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "4px", fontSize: "8px" }}>
                  ✓
                </div>
                <div style={{ fontSize: "8px", fontWeight: 700, marginBottom: "2px" }}>{f.title}</div>
                <div style={{ ...s.sub, fontSize: "7px", lineHeight: 1.4 }}>{f.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Label */}
      <div className="mt-3 px-1">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-sm text-gray-900">
              {theme.id}. {theme.name}
            </span>
            {selected && (
              <span className="ml-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                Selected
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{theme.desc}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ThemePreviewPage() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-sm text-indigo-600 hover:underline mb-4 block">
            ← Back to site
          </Link>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Choose Your Design</h1>
          <p className="text-gray-500">Click a theme to select it, then hit Apply below.</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {THEMES.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              selected={selected === theme.id}
              onSelect={() => setSelected(selected === theme.id ? null : theme.id)}
            />
          ))}
        </div>

        {/* Apply bar */}
        {selected !== null && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg px-8 py-4 flex items-center justify-between z-50">
            <div>
              <span className="font-bold text-gray-900">
                Selected: {THEMES.find((t) => t.id === selected)?.name}
              </span>
              <span className="text-gray-500 ml-2 text-sm">— tell me to apply this theme</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <div className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold">
                Theme {selected}: {THEMES.find((t) => t.id === selected)?.name} ✓
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
