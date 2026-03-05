"use client";

import React, { useState } from "react";

interface CoverLetterReviewProps {
  content: string;
  onConfirm: (finalContent: string) => void;
  onBack: () => void;
}

export default function CoverLetterReview({ content, onConfirm, onBack }: CoverLetterReviewProps) {
  const [text, setText] = useState(content);
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#0f1f18] flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#1a1a1a]">Review &amp; Edit</h2>
          <p className="text-sm text-[#6b7280]">Make any changes before downloading.</p>
        </div>
      </div>

      {/* Anti-hallucination badge */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#0f1f18] rounded-xl">
        <svg className="w-4 h-4 text-[#4ade80] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <p className="text-xs text-white/70">
          Generated using only your profile data — no invented claims.
        </p>
      </div>

      {/* Editable textarea */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-semibold text-[#1a1a1a]">Cover Letter</label>
          <span className="text-xs text-[#6b7280]" style={{ fontFamily: "var(--font-mono)" }}>
            {wordCount} words
          </span>
        </div>
        <textarea
          rows={20}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-[#1a1a1a] bg-stone-50 resize-none focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] transition-all leading-relaxed"
          style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-full border border-stone-200 text-sm font-semibold text-[#1a1a1a] hover:border-stone-300 hover:bg-stone-50 transition-all"
        >
          ← Back
        </button>
        <button
          onClick={() => onConfirm(text)}
          className="flex-1 py-3 rounded-full bg-[#1a1a1a] text-white text-sm font-semibold hover:bg-[#2d6a4f] transition-colors shadow-lg shadow-black/10"
        >
          Download →
        </button>
      </div>
    </div>
  );
}
