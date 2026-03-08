"use client";
import React, { useState, useEffect, useCallback } from "react";

export interface ScoredExperience {
  id: number;
  position: string;
  company: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  current?: boolean;
  relevance_score: number;
  recommendation_reason: string;
  suggested_highlight: string;
}

export interface ScoredProject {
  id: number;
  name: string;
  description?: string;
  details?: string;
  relevance_score: number;
  recommendation_reason: string;
  suggested_highlight: string;
}

interface SelectContentStepProps {
  experiences: ScoredExperience[];
  projects: ScoredProject[];
  pageCount: number;
  selectedTemplateId: string;
  onSubmit: (
    selectedExpIds: number[],
    selectedProjIds: number[],
    comments: Record<string, string>
  ) => void;
  onBack: () => void;
  loading: boolean;
  hideRightSidebar?: boolean;
  onSelectionChange?: (expCount: number, projCount: number) => void;
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 60 ? "#2d6a4f" : score >= 30 ? "#c97d3f" : "#9ca3af";
  const label =
    score >= 60 ? "High match" : score >= 30 ? "Partial match" : "Low match";
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-medium" style={{ color, fontFamily: "var(--font-mono)" }}>
        {score}% — {label}
      </span>
    </div>
  );
}

const TEMPLATE_NAMES: Record<string, string> = {
  jake: "Jake's Resume",
  modern: "Modern Blue",
  minimal: "Minimal",
  "skills-first": "Skills First",
  executive: "Executive",
  "ats-clean": "ATS Clean",
};

const SelectContentStep: React.FC<SelectContentStepProps> = ({
  experiences,
  projects,
  pageCount,
  selectedTemplateId,
  onSubmit,
  onBack,
  loading,
  hideRightSidebar = false,
  onSelectionChange,
}) => {
  const defaultExpCount = pageCount === 1 ? 3 : 5;
  const defaultProjCount = pageCount === 1 ? 2 : 4;

  // Pre-select top N by relevance_score
  const topExpIds = [...experiences]
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, defaultExpCount)
    .map((e) => e.id);
  const topProjIds = [...projects]
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, defaultProjCount)
    .map((p) => p.id);

  const [selectedExpIds, setSelectedExpIds] = useState<Set<number>>(new Set(topExpIds));
  const [selectedProjIds, setSelectedProjIds] = useState<Set<number>>(new Set(topProjIds));
  const [comments, setComments] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  // Re-initialize defaults when data changes
  useEffect(() => {
    if (experiences.length) {
      const ids = [...experiences]
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, defaultExpCount)
        .map((e) => e.id);
      setSelectedExpIds(new Set(ids));
    }
    if (projects.length) {
      const ids = [...projects]
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, defaultProjCount)
        .map((p) => p.id);
      setSelectedProjIds(new Set(ids));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experiences.length, projects.length]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableOnSelectionChange = useCallback(onSelectionChange ?? (() => {}), [onSelectionChange]);
  useEffect(() => {
    stableOnSelectionChange(selectedExpIds.size, selectedProjIds.size);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExpIds.size, selectedProjIds.size]);

  const toggleExp = (id: number) => {
    setSelectedExpIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleProj = (id: number) => {
    setSelectedProjIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleComment = (key: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleSubmit = () => {
    onSubmit(Array.from(selectedExpIds), Array.from(selectedProjIds), comments);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className={`${hideRightSidebar ? "mb-4" : "text-center mb-8"}`}>
        {!hideRightSidebar && (
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0f1f18] mb-5 shadow-lg shadow-black/20">
            <svg className="w-8 h-8 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
        )}
        <h2 className={`font-bold text-[#1a1a1a] ${hideRightSidebar ? "text-xl mb-1" : "text-3xl mb-3"}`}>Select Content to Include</h2>
        <p className={`text-[#6b7280] ${hideRightSidebar ? "text-sm" : "text-lg max-w-xl mx-auto"}`}>
          Choose which experiences and projects to include. We&apos;ve ranked them by relevance to the job.
        </p>
      </div>

      <div className="flex gap-6 items-start">
        {/* LEFT: Cards */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Experience cards */}
          {experiences.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
              <div className="px-5 py-4 bg-[#0f1f18] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-white">Experience</h3>
                <span className="ml-auto text-sm text-white/50">
                  {selectedExpIds.size} of {experiences.length} selected
                </span>
              </div>
              <div className="divide-y divide-stone-100">
                {[...experiences]
                  .sort((a, b) => b.relevance_score - a.relevance_score)
                  .map((exp) => {
                    const key = `exp_${exp.id}`;
                    const checked = selectedExpIds.has(exp.id);
                    const isRecommended = exp.relevance_score >= 50;
                    const commentOpen = expandedComments.has(key);
                    return (
                      <div key={exp.id} className={`p-4 transition-colors ${checked ? "bg-[#2d6a4f]/3" : "bg-white"}`}>
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleExp(exp.id)}
                            className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                              checked ? "bg-[#2d6a4f] border-[#2d6a4f]" : "border-stone-300 hover:border-[#2d6a4f]"
                            }`}
                          >
                            {checked && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-[#1a1a1a] text-sm">{exp.position}</span>
                              <span className="text-[#6b7280] text-sm">at {exp.company}</span>
                              {isRecommended && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[#2d6a4f]/10 text-[#2d6a4f] border border-[#2d6a4f]/20">
                                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  Recommended
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#6b7280] mt-0.5">
                              {exp.start_date}{exp.end_date ? ` – ${exp.end_date}` : exp.current ? " – Present" : ""}
                            </div>
                            <ScoreBar score={exp.relevance_score} />
                            {checked && (
                              <p className="text-xs text-[#2d6a4f] mt-1.5 italic">{exp.suggested_highlight}</p>
                            )}

                            {/* Comment toggle */}
                            <button
                              onClick={() => toggleComment(key)}
                              className="mt-2 text-xs text-stone-400 hover:text-[#1a1a1a] transition-colors flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                              {commentOpen ? "Hide hint" : "Add context for AI"}
                            </button>
                            {commentOpen && (
                              <textarea
                                value={comments[key] || ""}
                                onChange={(e) => setComments((p) => ({ ...p, [key]: e.target.value }))}
                                placeholder="Optional: add metrics, context, or focus areas for the AI..."
                                rows={2}
                                className="mt-2 w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] outline-none resize-none"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Project cards */}
          {projects.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
              <div className="px-5 py-4 bg-[#0f1f18] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-white">Projects</h3>
                <span className="ml-auto text-sm text-white/50">
                  {selectedProjIds.size} of {projects.length} selected
                </span>
              </div>
              <div className="divide-y divide-stone-100">
                {[...projects]
                  .sort((a, b) => b.relevance_score - a.relevance_score)
                  .map((proj) => {
                    const key = `proj_${proj.id}`;
                    const checked = selectedProjIds.has(proj.id);
                    const isRecommended = proj.relevance_score >= 50;
                    const commentOpen = expandedComments.has(key);
                    return (
                      <div key={proj.id} className={`p-4 transition-colors ${checked ? "bg-[#2d6a4f]/3" : "bg-white"}`}>
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleProj(proj.id)}
                            className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                              checked ? "bg-[#2d6a4f] border-[#2d6a4f]" : "border-stone-300 hover:border-[#2d6a4f]"
                            }`}
                          >
                            {checked && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-[#1a1a1a] text-sm">{proj.name}</span>
                              {isRecommended && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[#2d6a4f]/10 text-[#2d6a4f] border border-[#2d6a4f]/20">
                                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  Recommended
                                </span>
                              )}
                            </div>
                            {proj.description && (
                              <p className="text-xs text-[#6b7280] mt-0.5 line-clamp-2">{proj.description}</p>
                            )}
                            <ScoreBar score={proj.relevance_score} />
                            {checked && (
                              <p className="text-xs text-[#2d6a4f] mt-1.5 italic">{proj.suggested_highlight}</p>
                            )}

                            {/* Comment toggle */}
                            <button
                              onClick={() => toggleComment(key)}
                              className="mt-2 text-xs text-stone-400 hover:text-[#1a1a1a] transition-colors flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                              {commentOpen ? "Hide hint" : "Add context for AI"}
                            </button>
                            {commentOpen && (
                              <textarea
                                value={comments[key] || ""}
                                onChange={(e) => setComments((p) => ({ ...p, [key]: e.target.value }))}
                                placeholder="Optional: technologies to highlight, impact to emphasize..."
                                rows={2}
                                className="mt-2 w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] outline-none resize-none"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Sticky summary sidebar */}
        <div className={`${hideRightSidebar ? "hidden" : "hidden lg:block"} w-64 flex-shrink-0`}>
          <div className="sticky top-24 bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
            <h4 className="font-semibold text-[#1a1a1a] text-sm">Summary</h4>

            {/* Template preview mini */}
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
              <p className="text-xs text-stone-400 mb-1" style={{ fontFamily: "var(--font-mono)" }}>Template</p>
              <p className="font-medium text-[#1a1a1a] text-sm">
                {TEMPLATE_NAMES[selectedTemplateId] || selectedTemplateId}
              </p>
              <p className="text-xs text-[#6b7280]">{pageCount}-page resume</p>
            </div>

            {/* Selection counts */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#6b7280]">Experience</span>
                <span className={`font-semibold ${selectedExpIds.size === 0 ? "text-red-500" : "text-[#1a1a1a]"}`}>
                  {selectedExpIds.size} selected
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6b7280]">Projects</span>
                <span className={`font-semibold ${selectedProjIds.size === 0 ? "text-amber-500" : "text-[#1a1a1a]"}`}>
                  {selectedProjIds.size} selected
                </span>
              </div>
              {Object.values(comments).some(Boolean) && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#6b7280]">Context hints</span>
                  <span className="font-semibold text-[#2d6a4f]">
                    {Object.values(comments).filter(Boolean).length}
                  </span>
                </div>
              )}
            </div>

            {selectedExpIds.size === 0 && (
              <p className="text-xs text-red-500">Select at least one experience</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || selectedExpIds.size === 0}
              className={`w-full py-3 rounded-full font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                loading || selectedExpIds.size === 0
                  ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                  : "bg-[#1a1a1a] text-white shadow-lg shadow-black/10 hover:bg-[#2d6a4f]"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-stone-300 border-t-transparent rounded-full animate-spin" />
                  Generating questions...
                </>
              ) : (
                <>
                  Generate with these
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4 flex items-center justify-between gap-3 z-40 shadow-xl">
        <div className="text-sm text-[#6b7280]">
          <span className="font-semibold text-[#1a1a1a]">{selectedExpIds.size}</span> exp,{" "}
          <span className="font-semibold text-[#1a1a1a]">{selectedProjIds.size}</span> projects
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || selectedExpIds.size === 0}
          className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
            loading || selectedExpIds.size === 0
              ? "bg-stone-100 text-stone-400 cursor-not-allowed"
              : "bg-[#1a1a1a] text-white hover:bg-[#2d6a4f]"
          }`}
        >
          {loading ? "Generating..." : "Continue →"}
        </button>
      </div>

      {/* Navigation (back only on mobile, back+next on desktop) */}
      <div className="mt-8 flex justify-between items-center pb-24 lg:pb-0">
        <button
          onClick={onBack}
          className="px-6 py-3 text-[#6b7280] font-medium rounded-full hover:bg-stone-100 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || selectedExpIds.size === 0}
          className={`hidden lg:flex group px-8 py-3.5 rounded-full font-semibold text-sm transition-all duration-300 items-center gap-2 ${
            loading || selectedExpIds.size === 0
              ? "bg-stone-100 text-stone-400 cursor-not-allowed"
              : "bg-[#1a1a1a] text-white shadow-lg shadow-black/10 hover:bg-[#2d6a4f] hover:-translate-y-0.5"
          }`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-stone-300 border-t-transparent rounded-full animate-spin" />
              Generating questions...
            </>
          ) : (
            <>
              Generate with these
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SelectContentStep;
