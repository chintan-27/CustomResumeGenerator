"use client";
import React, { useMemo } from "react";
import type { ContentReview } from "./ReviewAndDownload";

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

interface LiveResumePreviewProps {
  generatedContent: GeneratedContent[];
  reviews: Record<string, ContentReview>;
  skillsOrganized: Record<string, string[]>;
  jobKeywords: string[];
  templateId: string;
  pageCount: number;
  userName?: string;
  pdfUrl?: string;
  loading?: boolean;
  approvedCount: number;
  onGeneratePDF: () => void;
  onStartOver: () => void;
}

/* ── ATS Score ring ──────────────────────────────────────────────────────── */
function ATSRing({ score }: { score: number }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? "#2d6a4f" : score >= 50 ? "#c97d3f" : "#ef4444";
  const label = score >= 75 ? "Strong" : score >= 50 ? "Good" : "Needs Work";
  return (
    <div className="flex items-center gap-3">
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 32 32)"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
        <text x="32" y="36" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1a1a1a">{score}</text>
      </svg>
      <div>
        <p className="text-sm font-semibold text-[#1a1a1a]">ATS Score</p>
        <p className="text-xs font-medium" style={{ color }}>{label}</p>
      </div>
    </div>
  );
}

/* ── Keyword match helper ─────────────────────────────────────────────────── */
function kwMatches(kw: string, text: string): boolean {
  const kwLower = kw.toLowerCase();
  if (text.includes(kwLower)) return true;
  const stopWords = new Set(["with", "and", "the", "for", "from", "that", "this", "into", "have", "will", "your"]);
  const sigWords = kwLower.split(/\s+/).filter((w) => w.length >= 4 && !stopWords.has(w));
  if (sigWords.length >= 2) return sigWords.every((w) => text.includes(w));
  return false;
}

/* ── Template base styles ─────────────────────────────────────────────────── */
type TemplateStyle = {
  fontFamily: string;
  sectionHeaderStyle: React.CSSProperties;
  dividerStyle: React.CSSProperties;
  nameStyle: React.CSSProperties;
  bulletPrefix: string;
  accentColor: string;
};

const TEMPLATE_STYLES: Record<string, TemplateStyle> = {
  jake: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    sectionHeaderStyle: { fontSize: 10, fontWeight: "bold", letterSpacing: 0.5 },
    dividerStyle: { borderTop: "0.6px solid #555", margin: "2px 0 4px" },
    nameStyle: { fontSize: 14, fontWeight: "bold", textAlign: "center" },
    bulletPrefix: "•",
    accentColor: "#111",
  },
  modern: {
    fontFamily: "system-ui, sans-serif",
    sectionHeaderStyle: { fontSize: 9, fontWeight: "bold", letterSpacing: 1, color: "#1e40af", textTransform: "uppercase" },
    dividerStyle: { borderTop: "1.5px solid #2563eb", margin: "1px 0 4px" },
    nameStyle: { fontSize: 14, fontWeight: "bold" },
    bulletPrefix: "▪",
    accentColor: "#1e40af",
  },
  minimal: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    sectionHeaderStyle: { fontSize: 8.5, letterSpacing: 1.5, textTransform: "uppercase", color: "#555" },
    dividerStyle: { display: "none" } as React.CSSProperties,
    nameStyle: { fontSize: 14, fontWeight: "bold", textAlign: "center" },
    bulletPrefix: "—",
    accentColor: "#333",
  },
  "skills-first": {
    fontFamily: "system-ui, sans-serif",
    sectionHeaderStyle: { fontSize: 9, fontWeight: "bold", color: "#003366", textTransform: "uppercase" },
    dividerStyle: { borderTop: "0.8px solid #003366", margin: "1px 0 4px" },
    nameStyle: { fontSize: 14, fontWeight: "bold", color: "#003366" },
    bulletPrefix: "•",
    accentColor: "#003366",
  },
  executive: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    sectionHeaderStyle: { fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: "#222" },
    dividerStyle: { borderTop: "1px solid #333", margin: "2px 0 4px" },
    nameStyle: { fontSize: 16, fontWeight: "bold", textAlign: "center", textTransform: "uppercase", letterSpacing: 1 },
    bulletPrefix: "•",
    accentColor: "#111",
  },
  "ats-clean": {
    fontFamily: "'Courier New', Courier, monospace",
    sectionHeaderStyle: { fontSize: 9, fontWeight: "bold", textTransform: "uppercase" },
    dividerStyle: { borderTop: "0.8px solid #000", margin: "2px 0 3px" },
    nameStyle: { fontSize: 13, fontWeight: "bold", textTransform: "uppercase" },
    bulletPrefix: "*",
    accentColor: "#000",
  },
};

/* ── Placeholder line ─────────────────────────────────────────────────────── */
function PlaceholderLine({ width = "80%" }: { width?: string }) {
  return (
    <div
      className="rounded-sm animate-pulse"
      style={{ height: 6, width, background: "repeating-linear-gradient(90deg, #e5e7eb 0px, #e5e7eb 6px, transparent 6px, transparent 10px)", marginBottom: 3 }}
    />
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */
const LiveResumePreview: React.FC<LiveResumePreviewProps> = ({
  generatedContent,
  reviews,
  skillsOrganized,
  jobKeywords,
  templateId,
  userName,
  pdfUrl,
  loading = false,
  approvedCount,
  onGeneratePDF,
  onStartOver,
}) => {
  const style = TEMPLATE_STYLES[templateId] ?? TEMPLATE_STYLES.jake;
  const hasPdf = !!pdfUrl;

  /* Group content by entity */
  const expGroups = useMemo(() => {
    const map = new Map<string, { items: (GeneratedContent & { _idx: number })[] }>();
    generatedContent.forEach((c, i) => {
      if (c.type !== "experience") return;
      const key = `${c.target_id}-${c.target_name}`;
      if (!map.has(key)) map.set(key, { items: [] });
      map.get(key)!.items.push({ ...c, _idx: c.id ?? i });
    });
    return map;
  }, [generatedContent]);

  const projGroups = useMemo(() => {
    const map = new Map<string, { items: (GeneratedContent & { _idx: number })[] }>();
    generatedContent.forEach((c, i) => {
      if (c.type !== "project") return;
      const key = `${c.target_id}-${c.target_name}`;
      if (!map.has(key)) map.set(key, { items: [] });
      map.get(key)!.items.push({ ...c, _idx: c.id ?? i });
    });
    return map;
  }, [generatedContent]);

  /* ATS score */
  const resumeFullText = useMemo(() => {
    return generatedContent.map((c) => c.generated_text).join(" ").toLowerCase() + " " +
      Object.values(skillsOrganized).flat().join(" ").toLowerCase();
  }, [generatedContent, skillsOrganized]);

  const atsScore = useMemo(() => {
    if (!jobKeywords.length) return 0;
    const matched = jobKeywords.filter((kw) => kwMatches(kw, resumeFullText));
    return Math.round((matched.length / jobKeywords.length) * 100);
  }, [resumeFullText, jobKeywords]);

  /* Render a single bullet */
  const renderBullet = (item: GeneratedContent & { _idx: number }, widths: string[]) => {
    const review = reviews[String(item._idx)];
    const text = review?.edited_text || item.generated_text;
    const isApproved = review?.approved === true;
    const isRejected = review?.approved === false;

    if (isRejected) return null;

    return (
      <div key={item._idx} style={{ display: "flex", alignItems: "flex-start", gap: 3, marginBottom: 2 }}>
        <span style={{ fontSize: 7, marginTop: 1, flexShrink: 0, fontFamily: style.fontFamily, color: style.accentColor }}>
          {style.bulletPrefix}
        </span>
        {isApproved ? (
          <span style={{ fontSize: 7, lineHeight: 1.4, fontFamily: style.fontFamily, color: "#222", flex: 1 }}>
            {text}
          </span>
        ) : (
          <div style={{ flex: 1, paddingTop: 2 }}>
            <PlaceholderLine width={widths[item._idx % widths.length]} />
          </div>
        )}
      </div>
    );
  };

  const bulletWidths = ["85%", "75%", "90%", "70%", "80%"];

  /* Paper dimensions (in CSS px, will be scaled) */
  const PAPER_W = 640;

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable paper preview */}
      <div className="flex-1 overflow-y-auto px-3 pt-3 pb-2">
        {/* Header label */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-stone-400 font-medium" style={{ fontFamily: "var(--font-mono)" }}>
            Live Preview
          </span>
          <span className="text-xs text-stone-400" style={{ fontFamily: "var(--font-mono)" }}>
            {approvedCount}/{generatedContent.length} reviewed
          </span>
        </div>

        {/* Scaled paper card */}
        <div style={{ width: "100%", overflow: "hidden" }}>
          <div
            style={{
              width: PAPER_W,
              transformOrigin: "top left",
              transform: `scale(${(340) / PAPER_W})`,
              marginBottom: `-${PAPER_W * (11 / 8.5) * (1 - 340 / PAPER_W)}px`,
              background: "#fff",
              padding: "24px 32px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
              borderRadius: 4,
              fontFamily: style.fontFamily,
            }}
          >
            {/* Name / header */}
            <div style={{ marginBottom: 8, textAlign: (style.nameStyle.textAlign as "center" | "left" | undefined) ?? "left" }}>
              <div style={{ ...style.nameStyle, fontFamily: style.fontFamily }}>
                {userName || "Your Name"}
              </div>
              <div style={{ fontSize: 7, color: "#666", marginTop: 2, fontFamily: style.fontFamily }}>
                your.email@example.com · linkedin.com/in/yourname · github.com/yourname
              </div>
            </div>

            {/* Top divider (Jake/Executive style) */}
            {(templateId === "jake" || templateId === "executive") && (
              <div style={{ borderTop: "0.8px solid #333", marginBottom: 8 }} />
            )}

            {/* Skills-first: show skills at top */}
            {templateId === "skills-first" && Object.keys(skillsOrganized).length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ ...style.sectionHeaderStyle, fontFamily: style.fontFamily }}>Skills</div>
                <div style={{ ...style.dividerStyle }} />
                {Object.entries(skillsOrganized).map(([cat, skills]) => (
                  <div key={cat} style={{ marginBottom: 2 }}>
                    <span style={{ fontSize: 7, fontWeight: "bold", fontFamily: style.fontFamily, color: "#003366" }}>{cat}: </span>
                    <span style={{ fontSize: 7, fontFamily: style.fontFamily, color: "#333" }}>{skills.join(", ")}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Experience section */}
            {expGroups.size > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ ...style.sectionHeaderStyle, fontFamily: style.fontFamily }}>Experience</div>
                <div style={style.dividerStyle.display === "none" ? {} : { ...style.dividerStyle }} />
                {style.dividerStyle.display !== "none" && (
                  <div style={{ ...style.dividerStyle }} />
                )}
                {Array.from(expGroups.entries()).map(([, group]) => (
                  <div key={group.items[0].target_id} style={{ marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: 8, fontWeight: "bold", fontFamily: style.fontFamily, color: "#111" }}>
                        {group.items[0].position}
                      </span>
                      <span style={{ fontSize: 7, fontFamily: style.fontFamily, color: style.accentColor }}>
                        {group.items[0].target_name}
                      </span>
                    </div>
                    <div style={{ marginTop: 3 }}>
                      {group.items.map((item) => renderBullet(item, bulletWidths))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Projects section */}
            {projGroups.size > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ ...style.sectionHeaderStyle, fontFamily: style.fontFamily }}>Projects</div>
                {style.dividerStyle.display !== "none" && (
                  <div style={{ ...style.dividerStyle }} />
                )}
                {Array.from(projGroups.entries()).map(([, group]) => (
                  <div key={group.items[0].target_id} style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 8, fontWeight: "bold", fontFamily: style.fontFamily, color: "#111" }}>
                      {group.items[0].target_name}
                    </span>
                    <div style={{ marginTop: 3 }}>
                      {group.items.map((item) => renderBullet(item, bulletWidths))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Skills (non-skills-first templates) */}
            {templateId !== "skills-first" && Object.keys(skillsOrganized).length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ ...style.sectionHeaderStyle, fontFamily: style.fontFamily }}>Technical Skills</div>
                {style.dividerStyle.display !== "none" && (
                  <div style={{ ...style.dividerStyle }} />
                )}
                {Object.entries(skillsOrganized).map(([cat, skills]) => (
                  <div key={cat} style={{ marginBottom: 2 }}>
                    <span style={{ fontSize: 7, fontWeight: "bold", fontFamily: style.fontFamily }}>{cat}: </span>
                    <span style={{ fontSize: 7, fontFamily: style.fontFamily, color: "#333" }}>{skills.join(", ")}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Placeholder rows when no content yet */}
            {generatedContent.length === 0 && (
              <div style={{ paddingTop: 16 }}>
                {["Experience", "Projects", "Skills"].map((section) => (
                  <div key={section} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 9, fontWeight: "bold", fontFamily: style.fontFamily, color: "#bbb", marginBottom: 4 }}>{section}</div>
                    <PlaceholderLine width="60%" />
                    <PlaceholderLine width="85%" />
                    <PlaceholderLine width="75%" />
                  </div>
                ))}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: 80 }}>
                  <p style={{ fontSize: 10, color: "#aaa", textAlign: "center", fontFamily: "system-ui" }}>
                    Your resume preview builds here
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ATS ring + action buttons */}
      <div className="flex-shrink-0 border-t border-stone-200 bg-white px-3 py-3 space-y-3">
        {generatedContent.length > 0 && <ATSRing score={atsScore} />}

        {!hasPdf ? (
          <button
            onClick={onGeneratePDF}
            disabled={loading}
            className={`w-full py-3 rounded-full font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
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
              className="w-full py-3 rounded-full font-semibold text-sm bg-[#2d6a4f] text-white shadow-lg shadow-[#2d6a4f]/20 hover:bg-[#2d6a4f]/90 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </a>
            <button
              onClick={onStartOver}
              className="w-full py-2.5 rounded-full font-medium text-sm text-[#2d6a4f] border border-[#2d6a4f]/30 hover:bg-[#2d6a4f]/5 transition-colors"
            >
              Generate for another job
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveResumePreview;
