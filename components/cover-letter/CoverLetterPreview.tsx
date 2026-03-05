"use client";

import React from "react";

interface CoverLetterPreviewProps {
  content: string;
  onRestart: () => void;
}

export default function CoverLetterPreview({ content, onRestart }: CoverLetterPreviewProps) {
  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cover-letter.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="space-y-6">
      {/* Success panel */}
      <div className="bg-[#0f1f18] rounded-2xl px-6 py-8 text-center">
        <div className="w-12 h-12 rounded-full bg-[#2d6a4f] flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-1">Cover Letter Ready</h2>
        <p className="text-sm text-white/50">Download or copy to use anywhere.</p>
      </div>

      {/* Preview */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6">
        <pre className="text-sm text-[#1a1a1a] leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>
          {content}
        </pre>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleCopy}
          className="flex-1 py-3 rounded-full border border-stone-200 text-sm font-semibold text-[#1a1a1a] hover:border-[#2d6a4f]/40 hover:text-[#2d6a4f] hover:bg-[#2d6a4f]/5 transition-all"
        >
          Copy to clipboard
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 py-3 rounded-full bg-[#1a1a1a] text-white text-sm font-semibold hover:bg-[#2d6a4f] transition-colors shadow-lg shadow-black/10"
        >
          Download .txt
        </button>
      </div>

      <button
        onClick={onRestart}
        className="w-full py-2.5 text-sm text-[#6b7280] hover:text-[#2d6a4f] transition-colors"
      >
        Generate another cover letter →
      </button>
    </div>
  );
}
