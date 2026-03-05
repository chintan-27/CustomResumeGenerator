"use client";

import React, { useState } from "react";

interface CoverLetterInputProps {
  onGenerate: (data: { jobDescription: string; tone: string; highlights: string }) => void;
  loading: boolean;
}

const TONES = [
  { id: "professional", label: "Professional", desc: "Formal and polished" },
  { id: "enthusiastic", label: "Enthusiastic", desc: "Energetic and passionate" },
  { id: "concise", label: "Concise", desc: "Brief and direct" },
];

export default function CoverLetterInput({ onGenerate, loading }: CoverLetterInputProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState("professional");
  const [highlights, setHighlights] = useState("");
  const [errors, setErrors] = useState<{ jobDescription?: string }>({});

  const handleSubmit = () => {
    const errs: typeof errors = {};
    if (jobDescription.trim().length < 100)
      errs.jobDescription = "Please paste the full job description (at least 100 characters).";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    onGenerate({ jobDescription, tone, highlights });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#0f1f18] flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#1a1a1a]">Cover Letter Generator</h2>
          <p className="text-sm text-[#6b7280]">Tailored to the job — grounded in your profile.</p>
        </div>
      </div>

      {/* Job Description */}
      <div>
        <label className="block text-sm font-semibold text-[#1a1a1a] mb-1.5">
          Job Description <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={8}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the full job description here…"
          className={`w-full px-4 py-3 rounded-xl border text-sm text-[#1a1a1a] bg-stone-50 resize-none focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] transition-all ${
            errors.jobDescription ? "border-red-300 bg-red-50" : "border-stone-200"
          }`}
        />
        {errors.jobDescription && (
          <p className="mt-1 text-xs text-red-500">{errors.jobDescription}</p>
        )}
      </div>

      {/* Tone */}
      <div>
        <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">Tone</label>
        <div className="grid grid-cols-3 gap-3">
          {TONES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTone(t.id)}
              className={`px-4 py-3 rounded-xl border text-left transition-all ${
                tone === t.id
                  ? "border-[#2d6a4f] bg-[#2d6a4f]/5"
                  : "border-stone-200 bg-white hover:border-stone-300"
              }`}
            >
              <p className={`text-sm font-semibold ${tone === t.id ? "text-[#2d6a4f]" : "text-[#1a1a1a]"}`}>{t.label}</p>
              <p className="text-xs text-[#6b7280] mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Highlights */}
      <div>
        <label className="block text-sm font-semibold text-[#1a1a1a] mb-1.5">
          Specific highlights to emphasize{" "}
          <span className="font-normal text-[#6b7280]">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={highlights}
          onChange={(e) => setHighlights(e.target.value)}
          placeholder="E.g. My internship at Stripe, my open-source project with 500+ stars…"
          className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-[#1a1a1a] bg-stone-50 resize-none focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] transition-all"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 rounded-full bg-[#1a1a1a] text-white text-sm font-semibold hover:bg-[#2d6a4f] transition-colors shadow-lg shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating…
          </>
        ) : (
          "Generate Cover Letter →"
        )}
      </button>
    </div>
  );
}
