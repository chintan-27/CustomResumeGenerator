"use client";
import React, { useState, useMemo, useEffect } from "react";
import ContentEditor from "@/components/ui/ContentEditor";

interface GeneratedContent {
  id?: number;
  type: string;
  target_id: number;
  target_name: string;
  position?: string;
  original_text: string;
  generated_text: string;
  keywords_used: string[];
  grounding_source: string;
}

export interface ContentReview {
  content_id?: number;
  approved: boolean;
  edited_text?: string;
}

interface ReviewAndDownloadProps {
  generatedContent: GeneratedContent[];
  skillsOrganized: Record<string, string[]>;
  jobKeywords: string[];
  templateName: string;
  pageCount: number;
  pdfUrl: string;
  latexContent: string;
  onGeneratePDF: (reviews: ContentReview[]) => void;
  onStartOver: () => void;
  onBack: () => void;
  loading: boolean;
  hideRightSidebar?: boolean;
  onReviewsChange?: (reviews: Record<string, ContentReview>) => void;
}

/* ── ATS Score ring ──────────────────────────────────────────────────────── */
function ATSScoreRing({ score }: { score: number }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? "#2d6a4f" : score >= 50 ? "#c97d3f" : "#ef4444";
  const label = score >= 75 ? "Strong" : score >= 50 ? "Good" : "Needs Work";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="7" />
        <circle
          cx="40" cy="40" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text x="40" y="44" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1a1a1a">{score}</text>
      </svg>
      <div className="text-center">
        <p className="text-xs font-semibold" style={{ color }}>{label}</p>
        <p className="text-xs text-[#6b7280]">ATS Score</p>
      </div>
    </div>
  );
}

/* Keyword match helper — exact OR significant-word match for multi-word phrases */
function kwMatches(kw: string, text: string): boolean {
  const kwLower = kw.toLowerCase();
  if (text.includes(kwLower)) return true;
  const stopWords = new Set(["with", "and", "the", "for", "from", "that", "this", "into", "have", "will", "your"]);
  const sigWords = kwLower.split(/\s+/).filter((w) => w.length >= 4 && !stopWords.has(w));
  if (sigWords.length >= 2) return sigWords.every((w) => text.includes(w));
  return false;
}

const ReviewAndDownload: React.FC<ReviewAndDownloadProps> = ({
  generatedContent,
  skillsOrganized,
  jobKeywords,
  templateName,
  pageCount,
  pdfUrl,
  latexContent,
  onGeneratePDF,
  onStartOver,
  onBack,
  loading,
  hideRightSidebar = false,
  onReviewsChange,
}) => {
  const [reviews, setReviews] = useState<Record<string, ContentReview>>({});
  const [showLatex, setShowLatex] = useState(false);

  useEffect(() => {
    onReviewsChange?.(reviews);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviews]);

  /* Group content by entity */
  const experienceContent = useMemo(() => {
    const map: Record<string, (GeneratedContent & { _index: number })[]> = {};
    generatedContent.forEach((c, i) => {
      if (c.type !== "experience") return;
      const key = `${c.target_id}-${c.target_name}`;
      if (!map[key]) map[key] = [];
      map[key].push({ ...c, _index: c.id ?? i });
    });
    return map;
  }, [generatedContent]);

  const projectContent = useMemo(() => {
    const map: Record<string, (GeneratedContent & { _index: number })[]> = {};
    generatedContent.forEach((c, i) => {
      if (c.type !== "project") return;
      const key = `${c.target_id}-${c.target_name}`;
      if (!map[key]) map[key] = [];
      map[key].push({ ...c, _index: c.id ?? i });
    });
    return map;
  }, [generatedContent]);

  /* ATS score — checks bullets + skills section (both appear in the resume) */
  const resumeFullText = useMemo(() => {
    const bullets = generatedContent.map((c) => c.generated_text).join(" ").toLowerCase();
    const skills = Object.values(skillsOrganized).flat().join(" ").toLowerCase();
    return bullets + " " + skills;
  }, [generatedContent, skillsOrganized]);

  const atsScore = useMemo(() => {
    if (!jobKeywords.length) return 0;
    const matched = jobKeywords.filter((kw) => kwMatches(kw, resumeFullText));
    return Math.round((matched.length / jobKeywords.length) * 100);
  }, [resumeFullText, jobKeywords]);

  const matchedKeywords = useMemo(
    () => jobKeywords.filter((kw) => kwMatches(kw, resumeFullText)),
    [resumeFullText, jobKeywords]
  );

  const missingKeywords = useMemo(
    () => jobKeywords.filter((kw) => !kwMatches(kw, resumeFullText)),
    [resumeFullText, jobKeywords]
  );

  const handleApprove = (index: number, approved: boolean, editedText?: string) => {
    setReviews((prev) => ({ ...prev, [index]: { approved, edited_text: editedText } }));
  };

  const handleGeneratePDF = () => {
    const list = Object.entries(reviews).map(([idx, r]) => ({
      content_id: parseInt(idx),
      ...r,
    }));
    onGeneratePDF(list);
  };

  const approvedCount = Object.values(reviews).filter((r) => r.approved).length;
  const hasPdf = !!pdfUrl;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0f1f18] mb-5 shadow-lg shadow-black/20">
          {hasPdf ? (
            <svg className="w-8 h-8 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <h2 className="text-3xl font-bold text-[#1a1a1a] mb-2">
          {hasPdf ? "Your Resume is Ready!" : "Review & Download"}
        </h2>
        <p className="text-[#6b7280] max-w-xl mx-auto">
          {hasPdf
            ? `Template: ${templateName} · ${pageCount}-page`
            : "Review and approve each bullet point, then generate your PDF."}
        </p>
      </div>

      <div className="flex gap-6 items-start">
        {/* LEFT: Bullets review + Skills */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Anti-hallucination notice */}
          <div className="p-4 bg-[#0f1f18] rounded-2xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Grounded Content Guarantee</p>
              <p className="text-xs text-white/60 mt-0.5">
                Every bullet is generated only from your data. No metrics or skills were invented.{" "}
                <span className="bg-[#c97d3f]/20 text-[#c97d3f] px-1.5 py-0.5 rounded text-xs">Keywords highlighted</span>{" "}
                are from the job description.
              </p>
            </div>
            <div className="ml-auto flex-shrink-0 text-sm text-white/50">
              {approvedCount}/{generatedContent.length} approved
            </div>
          </div>

          {/* Experience bullets */}
          {Object.keys(experienceContent).length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
              <div className="px-5 py-4 bg-[#0f1f18] flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-white text-sm">Experience Bullets</h3>
              </div>
              <div className="p-5 space-y-6">
                {Object.entries(experienceContent).map(([key, bullets]) => (
                  <div key={key}>
                    <h4 className="font-medium text-[#1a1a1a] text-sm mb-3 pb-2 border-b border-stone-100">
                      {bullets[0]?.position} at {bullets[0]?.target_name}
                    </h4>
                    <div className="space-y-3">
                      {bullets.map((b) => (
                        <ContentEditor
                          key={b._index}
                          originalText={b.original_text}
                          generatedText={b.generated_text}
                          keywordsUsed={b.keywords_used}
                          entityType="experience"
                          entityName={b.target_name}
                          entityDescription={b.original_text}
                          onApprove={(approved, editedText) => handleApprove(b._index, approved, editedText)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Project bullets */}
          {Object.keys(projectContent).length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
              <div className="px-5 py-4 bg-[#0f1f18] flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-white text-sm">Project Bullets</h3>
              </div>
              <div className="p-5 space-y-6">
                {Object.entries(projectContent).map(([key, bullets]) => (
                  <div key={key}>
                    <h4 className="font-medium text-[#1a1a1a] text-sm mb-3 pb-2 border-b border-stone-100">
                      {bullets[0]?.target_name}
                    </h4>
                    <div className="space-y-3">
                      {bullets.map((b) => (
                        <ContentEditor
                          key={b._index}
                          originalText={b.original_text}
                          generatedText={b.generated_text}
                          keywordsUsed={b.keywords_used}
                          entityType="project"
                          entityName={b.target_name}
                          entityDescription={b.original_text}
                          onApprove={(approved, editedText) => handleApprove(b._index, approved, editedText)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {Object.keys(skillsOrganized).length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
              <div className="px-5 py-4 bg-[#0f1f18] flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-white text-sm">Skills (by Category)</h3>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(skillsOrganized).map(([cat, skills]) => (
                  <div key={cat}>
                    <p className="text-xs font-semibold text-[#1a1a1a] mb-2">{cat}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((s, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 bg-[#2d6a4f]/10 text-[#2d6a4f] rounded-full border border-[#2d6a4f]/20">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PDF Preview (after generation) */}
          {hasPdf && (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
              <div className="px-5 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <span className="ml-2 text-xs text-[#6b7280]" style={{ fontFamily: "var(--font-mono)" }}>resume.pdf</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowLatex(!showLatex)}
                    className="px-3 py-1.5 text-xs font-medium text-[#6b7280] hover:text-[#1a1a1a] hover:bg-stone-100 rounded-xl transition-colors"
                  >
                    {showLatex ? "Show PDF" : "View LaTeX"}
                  </button>
                  <a
                    href={pdfUrl}
                    download="resume.pdf"
                    className="px-4 py-1.5 text-xs font-semibold bg-[#1a1a1a] text-white rounded-full hover:bg-[#2d6a4f] transition-colors"
                  >
                    Download
                  </a>
                </div>
              </div>
              <div className="p-4">
                {showLatex ? (
                  <pre className="bg-[#0f1f18] text-[#4ade80] p-5 rounded-2xl overflow-x-auto text-xs max-h-[500px] overflow-y-auto font-mono">
                    {latexContent}
                  </pre>
                ) : (
                  <div className="bg-stone-100 rounded-2xl overflow-hidden">
                    <iframe src={pdfUrl} className="w-full h-[600px] border-0" title="Resume Preview" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Sticky sidebar */}
        <div className={`${hideRightSidebar ? "hidden" : "hidden lg:block"} w-64 flex-shrink-0`}>
          <div className="sticky top-24 space-y-4">

            {/* Template info */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
              <p className="text-xs text-stone-400 mb-2" style={{ fontFamily: "var(--font-mono)" }}>Selected template</p>
              <p className="font-semibold text-[#1a1a1a] text-sm">{templateName}</p>
              <p className="text-xs text-[#6b7280]">{pageCount}-page resume</p>
            </div>

            {/* ATS Score */}
            {generatedContent.length > 0 && (
              <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm flex flex-col items-center">
                <ATSScoreRing score={atsScore} />
                <div className="w-full mt-4 space-y-3">
                  {matchedKeywords.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#1a1a1a] mb-1.5">
                        Matched ({matchedKeywords.length}/{jobKeywords.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {matchedKeywords.slice(0, 8).map((kw, i) => (
                          <span key={i} className="text-xs px-1.5 py-0.5 rounded-full bg-[#2d6a4f]/10 text-[#2d6a4f] border border-[#2d6a4f]/20">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {missingKeywords.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#1a1a1a] mb-1.5">
                        Missing ({missingKeywords.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {missingKeywords.slice(0, 6).map((kw, i) => (
                          <span key={i} className="text-xs px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Generate PDF button */}
            {!hasPdf ? (
              <button
                onClick={handleGeneratePDF}
                disabled={loading}
                className={`w-full py-3.5 rounded-full font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                  loading
                    ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                    : "bg-[#1a1a1a] text-white shadow-lg shadow-black/10 hover:bg-[#2d6a4f]"
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-stone-300 border-t-transparent rounded-full animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Generate PDF
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-2">
                <a
                  href={pdfUrl}
                  download="resume.pdf"
                  className="w-full py-3.5 rounded-full font-semibold text-sm bg-[#2d6a4f] text-white shadow-lg shadow-[#2d6a4f]/20 hover:bg-[#2d6a4f]/90 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PDF
                </a>
                <button
                  onClick={onStartOver}
                  className="w-full py-3 rounded-full font-medium text-sm text-[#2d6a4f] border border-[#2d6a4f]/30 hover:bg-[#2d6a4f]/5 transition-colors"
                >
                  Generate for another job
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-10 flex justify-between items-center">
        <button
          onClick={onBack}
          className="px-6 py-3 text-[#6b7280] font-medium rounded-full hover:bg-stone-100 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          Back
        </button>
        {!hasPdf ? (
          <button
            onClick={handleGeneratePDF}
            disabled={loading}
            className={`group px-8 py-3.5 rounded-full font-semibold text-sm transition-all duration-300 flex items-center gap-2 lg:hidden ${
              loading
                ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                : "bg-[#1a1a1a] text-white shadow-lg shadow-black/10 hover:bg-[#2d6a4f] hover:-translate-y-0.5"
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-stone-300 border-t-transparent rounded-full animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                Generate PDF
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-3 lg:hidden">
            <button onClick={onStartOver} className="px-5 py-2.5 rounded-full text-sm font-medium text-[#2d6a4f] border border-[#2d6a4f]/30 hover:bg-[#2d6a4f]/5 transition-colors">
              New resume
            </button>
            <a
              href={pdfUrl}
              download="resume.pdf"
              className="px-6 py-2.5 rounded-full text-sm font-semibold bg-[#2d6a4f] text-white hover:bg-[#2d6a4f]/90 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewAndDownload;
