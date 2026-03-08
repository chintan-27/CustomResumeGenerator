"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import type { ContentReview } from "./ReviewAndDownload";
import { TEMPLATE_STYLES, SECTION_ORDER } from "./templateStyles";

/* ── Types ─────────────────────────────────────────────────────────────────── */

export interface GeneratedContent {
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

export interface UserProfile {
  name?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface EducationEntry {
  university?: string;
  degree?: string;
  major?: string;
  gpa?: string;
  start_date?: string;
  end_date?: string;
}

interface BulletState {
  text: string;
  deleted: boolean;
  originalText: string;
  isNew?: boolean; // user-added bullets
}

interface ResumeEditorProps {
  generatedContent: GeneratedContent[];
  skillsOrganized: Record<string, string[]>;
  jobKeywords: string[];
  userName?: string;
  userProfile?: UserProfile;
  education?: EducationEntry[];
  templateId: string;
  onReviewsChange: (reviews: Record<string, ContentReview>) => void;
}

/* ── Editable bullet ────────────────────────────────────────────────────────── */

const EditableBullet: React.FC<{
  id: string;
  text: string;
  prefix: string;
  fontFamily: string;
  accentColor: string;
  fontSize: number;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}> = ({ id, text, prefix, fontFamily, accentColor, fontSize, onUpdate, onDelete }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [editing, setEditing] = useState(false);

  // Sync DOM → state only when not editing (prevents mid-type resets)
  useEffect(() => {
    if (ref.current && !editing) {
      ref.current.textContent = text;
    }
  }, [text, editing]);

  const startEdit = () => {
    setEditing(true);
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    });
  };

  const commit = () => {
    setEditing(false);
    const newText = (ref.current?.textContent ?? "").trim();
    if (newText && newText !== text) onUpdate(id, newText);
    else if (!newText) onDelete(id); // delete if cleared
  };

  return (
    <div className="group/bullet flex items-start gap-1.5 my-0.5">
      <span style={{ fontSize, flexShrink: 0, marginTop: 2, fontFamily, color: accentColor, userSelect: "none" }}>
        {prefix}
      </span>
      <span
        ref={ref}
        contentEditable={editing}
        suppressContentEditableWarning
        onClick={startEdit}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); commit(); }
          if (e.key === "Escape") { if (ref.current) ref.current.textContent = text; setEditing(false); }
        }}
        style={{
          fontSize,
          lineHeight: 1.5,
          fontFamily,
          color: "#222",
          flex: 1,
          outline: "none",
          cursor: editing ? "text" : "pointer",
          borderBottom: editing ? "1.5px solid #2d6a4f" : "1px solid transparent",
          paddingBottom: 1,
          display: "block",
          whiteSpace: "pre-wrap",
          minWidth: 0,
        }}
      />
      <button
        onMouseDown={(e) => { e.preventDefault(); onDelete(id); }}
        className="opacity-0 group-hover/bullet:opacity-100 flex-shrink-0 transition-opacity mt-0.5 rounded hover:bg-red-50 px-0.5"
        style={{ fontSize: 13, color: "#aaa", lineHeight: 1 }}
        aria-label="Delete bullet"
      >
        ×
      </button>
    </div>
  );
};

/* ── Section divider ─────────────────────────────────────────────────────────── */
const SectionDivider: React.FC<{ label: string; style: React.CSSProperties; divider: React.CSSProperties | null; fontFamily: string }> = ({
  label, style, divider, fontFamily,
}) => (
  <div style={{ marginBottom: 6, marginTop: 14 }}>
    <div style={{ ...style, fontFamily }}>{label}</div>
    {divider && <div style={divider} />}
  </div>
);

/* ── ATS ring (small) ───────────────────────────────────────────────────────── */
export function ATSRing({ score }: { score: number }) {
  const r = 22, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? "#2d6a4f" : score >= 50 ? "#c97d3f" : "#ef4444";
  const label = score >= 75 ? "Strong" : score >= 50 ? "Good" : "Needs Work";
  return (
    <div className="flex items-center gap-3">
      <svg width="54" height="54" viewBox="0 0 54 54">
        <circle cx="27" cy="27" r={r} fill="none" stroke="#e5e7eb" strokeWidth="5" />
        <circle cx="27" cy="27" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 27 27)" style={{ transition: "stroke-dashoffset 1s ease" }} />
        <text x="27" y="31" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1a1a1a">{score}</text>
      </svg>
      <div>
        <p className="text-sm font-semibold text-[#1a1a1a]">ATS Score</p>
        <p className="text-xs font-medium" style={{ color }}>{label}</p>
      </div>
    </div>
  );
}

function kwMatches(kw: string, text: string): boolean {
  const kwLower = kw.toLowerCase();
  if (text.includes(kwLower)) return true;
  const stopWords = new Set(["with","and","the","for","from","that","this","into","have","will","your"]);
  const sigWords = kwLower.split(/\s+/).filter((w) => w.length >= 4 && !stopWords.has(w));
  if (sigWords.length >= 2) return sigWords.every((w) => text.includes(w));
  return false;
}

/* ── Main component ──────────────────────────────────────────────────────────── */
const ResumeEditor: React.FC<ResumeEditorProps> = ({
  generatedContent,
  skillsOrganized,
  jobKeywords,
  userName,
  userProfile,
  education,
  templateId,
  onReviewsChange,
}) => {
  const ts = TEMPLATE_STYLES[templateId] ?? TEMPLATE_STYLES.jake;
  const sectionOrder = SECTION_ORDER[templateId] ?? SECTION_ORDER.jake;

  /* ── Bullet state: keyed by String(c.id ?? i) ───────────────────────────── */
  const [bullets, setBullets] = useState<Record<string, BulletState>>(() => {
    const s: Record<string, BulletState> = {};
    generatedContent.forEach((c, i) => {
      const key = String(c.id ?? i);
      s[key] = { text: c.generated_text, deleted: false, originalText: c.generated_text };
    });
    return s;
  });

  /* ── Skills state ────────────────────────────────────────────────────────── */
  const [skills, setSkills] = useState<Record<string, string[]>>(() => {
    const clone: Record<string, string[]> = {};
    Object.entries(skillsOrganized).forEach(([k, v]) => { clone[k] = [...v]; });
    return clone;
  });

  /* Reset when new content arrives */
  useEffect(() => {
    setBullets(() => {
      const s: Record<string, BulletState> = {};
      generatedContent.forEach((c, i) => {
        const key = String(c.id ?? i);
        s[key] = { text: c.generated_text, deleted: false, originalText: c.generated_text };
      });
      return s;
    });
    setSkills(() => {
      const clone: Record<string, string[]> = {};
      Object.entries(skillsOrganized).forEach(([k, v]) => { clone[k] = [...v]; });
      return clone;
    });
  }, [generatedContent, skillsOrganized]);

  /* ── Derive and emit reviews ─────────────────────────────────────────────── */
  const reviews = useMemo<Record<string, ContentReview>>(() => {
    const result: Record<string, ContentReview> = {};
    generatedContent.forEach((c, i) => {
      const key = String(c.id ?? i);
      const b = bullets[key];
      if (!b) return;
      result[key] = {
        approved: !b.deleted,
        ...(b.text !== b.originalText && !b.deleted ? { edited_text: b.text } : {}),
      };
    });
    return result;
  }, [bullets, generatedContent]);

  const stableOnReviewsChange = useCallback(onReviewsChange, [onReviewsChange]);
  useEffect(() => { stableOnReviewsChange(reviews); }, [reviews, stableOnReviewsChange]);

  /* ── ATS score ─────────────────────────────────────────────────────────────── */
  const atsScore = useMemo(() => {
    if (!jobKeywords.length) return 0;
    const resumeText = Object.values(bullets)
      .filter((b) => !b.deleted)
      .map((b) => b.text)
      .concat(Object.values(skills).flat())
      .join(" ").toLowerCase();
    const matched = jobKeywords.filter((kw) => kwMatches(kw, resumeText));
    return Math.round((matched.length / jobKeywords.length) * 100);
  }, [bullets, skills, jobKeywords]);

  /* ── Bullet helpers ──────────────────────────────────────────────────────── */
  const updateBullet = useCallback((key: string, text: string) => {
    setBullets((prev) => ({ ...prev, [key]: { ...prev[key], text } }));
  }, []);

  const deleteBullet = useCallback((key: string) => {
    setBullets((prev) => ({ ...prev, [key]: { ...prev[key], deleted: true } }));
  }, []);

  const addBullet = useCallback((entityKey: string) => {
    const newKey = `new-${entityKey}-${Date.now()}`;
    setBullets((prev) => ({
      ...prev,
      [newKey]: { text: "", deleted: false, originalText: "", isNew: true },
    }));
  }, []);

  /* ── Group content by entity ─────────────────────────────────────────────── */
  const expGroups = useMemo(() => {
    const map = new Map<string, { items: (GeneratedContent & { _key: string })[]; position: string; company: string }>();
    generatedContent.forEach((c, i) => {
      if (c.type !== "experience") return;
      const gk = `exp-${c.target_id}`;
      if (!map.has(gk)) map.set(gk, { items: [], position: c.position || "", company: c.target_name });
      map.get(gk)!.items.push({ ...c, _key: String(c.id ?? i) });
    });
    return map;
  }, [generatedContent]);

  const projGroups = useMemo(() => {
    const map = new Map<string, { items: (GeneratedContent & { _key: string })[]; name: string }>();
    generatedContent.forEach((c, i) => {
      if (c.type !== "project") return;
      const gk = `proj-${c.target_id}`;
      if (!map.has(gk)) map.set(gk, { items: [], name: c.target_name });
      map.get(gk)!.items.push({ ...c, _key: String(c.id ?? i) });
    });
    return map;
  }, [generatedContent]);

  /* ── Paper scale ─────────────────────────────────────────────────────────── */
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const PAPER_W = 794;

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const available = containerRef.current.clientWidth - 32;
        setScale(Math.min(1, available / PAPER_W));
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const paperH = PAPER_W * (11 / 8.5);

  /* ── Skill tag editing ───────────────────────────────────────────────────── */
  const [addingSkillCat, setAddingSkillCat] = useState<string | null>(null);
  const [newSkillText, setNewSkillText] = useState("");

  const removeSkill = (cat: string, idx: number) => {
    setSkills((prev) => ({ ...prev, [cat]: prev[cat].filter((_, i) => i !== idx) }));
  };

  const commitNewSkill = (cat: string) => {
    const s = newSkillText.trim();
    if (s) setSkills((prev) => ({ ...prev, [cat]: [...(prev[cat] || []), s] }));
    setNewSkillText("");
    setAddingSkillCat(null);
  };

  /* ── Section renderers ───────────────────────────────────────────────────── */
  const renderExperience = () => (
    <div>
      <SectionDivider label="Experience" style={ts.sectionHeaderStyle} divider={ts.divider} fontFamily={ts.fontFamily} />
      {Array.from(expGroups.entries()).map(([gk, grp]) => {
        const visibleBullets = grp.items.filter((item) => !bullets[item._key]?.deleted);
        return (
          <div key={gk} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
              <span style={{ fontSize: ts.headerFontSize, fontWeight: "bold", fontFamily: ts.fontFamily, color: "#111" }}>
                {grp.position}
              </span>
              <span style={{ fontSize: ts.bodyFontSize, fontFamily: ts.fontFamily, color: ts.accentColor }}>
                {grp.company}
              </span>
            </div>
            <div>
              {grp.items.map((item) => {
                const b = bullets[item._key];
                if (!b || b.deleted) return null;
                return (
                  <EditableBullet
                    key={item._key}
                    id={item._key}
                    text={b.text}
                    prefix={ts.bulletPrefix}
                    fontFamily={ts.fontFamily}
                    accentColor={ts.accentColor}
                    fontSize={ts.bodyFontSize}
                    onUpdate={updateBullet}
                    onDelete={deleteBullet}
                  />
                );
              })}
              {/* User-added bullets for this entity */}
              {Object.entries(bullets)
                .filter(([k, b]) => b.isNew && !b.deleted && k.startsWith(`new-${gk}`))
                .map(([k, b]) => (
                  <EditableBullet key={k} id={k} text={b.text}
                    prefix={ts.bulletPrefix} fontFamily={ts.fontFamily}
                    accentColor={ts.accentColor} fontSize={ts.bodyFontSize}
                    onUpdate={updateBullet} onDelete={deleteBullet} />
                ))}
              {visibleBullets.length > 0 && (
                <button
                  onClick={() => addBullet(gk)}
                  style={{ fontSize: 9, color: "#2d6a4f", cursor: "pointer", marginTop: 2, background: "none", border: "none", padding: 0 }}
                >
                  + add bullet
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderProjects = () => (
    <div>
      <SectionDivider label="Projects" style={ts.sectionHeaderStyle} divider={ts.divider} fontFamily={ts.fontFamily} />
      {Array.from(projGroups.entries()).map(([gk, grp]) => {
        const visibleBullets = grp.items.filter((item) => !bullets[item._key]?.deleted);
        return (
          <div key={gk} style={{ marginBottom: 10 }}>
            <span style={{ fontSize: ts.headerFontSize, fontWeight: "bold", fontFamily: ts.fontFamily, color: "#111" }}>
              {grp.name}
            </span>
            <div style={{ marginTop: 2 }}>
              {grp.items.map((item) => {
                const b = bullets[item._key];
                if (!b || b.deleted) return null;
                return (
                  <EditableBullet
                    key={item._key}
                    id={item._key}
                    text={b.text}
                    prefix={ts.bulletPrefix}
                    fontFamily={ts.fontFamily}
                    accentColor={ts.accentColor}
                    fontSize={ts.bodyFontSize}
                    onUpdate={updateBullet}
                    onDelete={deleteBullet}
                  />
                );
              })}
              {Object.entries(bullets)
                .filter(([k, b]) => b.isNew && !b.deleted && k.startsWith(`new-${gk}`))
                .map(([k, b]) => (
                  <EditableBullet key={k} id={k} text={b.text}
                    prefix={ts.bulletPrefix} fontFamily={ts.fontFamily}
                    accentColor={ts.accentColor} fontSize={ts.bodyFontSize}
                    onUpdate={updateBullet} onDelete={deleteBullet} />
                ))}
              {visibleBullets.length > 0 && (
                <button
                  onClick={() => addBullet(gk)}
                  style={{ fontSize: 9, color: "#2d6a4f", cursor: "pointer", marginTop: 2, background: "none", border: "none", padding: 0 }}
                >
                  + add bullet
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderSkills = () => (
    <div>
      <SectionDivider label="Technical Skills" style={ts.sectionHeaderStyle} divider={ts.divider} fontFamily={ts.fontFamily} />
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {Object.entries(skills).map(([cat, items]) => (
          <div key={cat} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: ts.bodyFontSize, fontWeight: "bold", fontFamily: ts.fontFamily, marginRight: 2 }}>{cat}:</span>
            {items.map((skill, idx) => (
              <span
                key={idx}
                className="group/skill inline-flex items-center gap-0.5"
                style={{ fontSize: ts.bodyFontSize, fontFamily: ts.fontFamily, color: "#333" }}
              >
                {idx > 0 && <span style={{ color: "#777" }}>,&nbsp;</span>}
                {skill}
                <button
                  onClick={() => removeSkill(cat, idx)}
                  className="opacity-0 group-hover/skill:opacity-100 transition-opacity ml-0.5"
                  style={{ fontSize: 10, color: "#aaa", lineHeight: 1 }}
                >×</button>
              </span>
            ))}
            {addingSkillCat === cat ? (
              <input
                autoFocus
                value={newSkillText}
                onChange={(e) => setNewSkillText(e.target.value)}
                onBlur={() => commitNewSkill(cat)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitNewSkill(cat);
                  if (e.key === "Escape") { setNewSkillText(""); setAddingSkillCat(null); }
                }}
                style={{ fontSize: ts.bodyFontSize, fontFamily: ts.fontFamily, borderBottom: "1px solid #2d6a4f", outline: "none", width: 80 }}
                placeholder="add skill…"
              />
            ) : (
              <button
                onClick={() => setAddingSkillCat(cat)}
                style={{ fontSize: 9, color: "#2d6a4f", cursor: "pointer", background: "none", border: "none", padding: 0 }}
              >+ add</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderEducation = () => {
    if (!education?.length) return null;
    return (
      <div>
        <SectionDivider label="Education" style={ts.sectionHeaderStyle} divider={ts.divider} fontFamily={ts.fontFamily} />
        {education.map((edu, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: ts.headerFontSize, fontWeight: "bold", fontFamily: ts.fontFamily, color: "#111" }}>
                {edu.university}
              </span>
              <span style={{ fontSize: ts.bodyFontSize, fontFamily: ts.fontFamily, color: "#777" }}>
                {edu.start_date}{edu.end_date ? ` – ${edu.end_date}` : ""}
              </span>
            </div>
            <div style={{ fontSize: ts.bodyFontSize, fontFamily: ts.fontFamily, color: "#444" }}>
              {[edu.degree, edu.major].filter(Boolean).join(", ")}
              {edu.gpa ? `  ·  GPA: ${edu.gpa}` : ""}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const SECTION_RENDERERS: Record<string, () => React.ReactNode> = {
    experience: renderExperience,
    projects: renderProjects,
    skills: renderSkills,
    education: renderEducation,
  };

  /* ── Resume header ───────────────────────────────────────────────────────── */
  const displayName = userProfile?.name || userName || "Your Name";
  const contactParts = [
    userProfile?.phone,
    userProfile?.linkedin && `linkedin.com/in/${userProfile.linkedin.replace(/.*linkedin\.com\/in\//i, "")}`,
    userProfile?.email,
    userProfile?.github && `github.com/${userProfile.github.replace(/.*github\.com\//i, "")}`,
  ].filter(Boolean);

  /* ── Modern template header is 2-column ─────────────────────────────────── */
  const renderHeader = () => {
    if (templateId === "modern") {
      return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div style={{ ...ts.nameStyle, fontFamily: ts.fontFamily }}>{displayName}</div>
          <div style={{ ...ts.contactStyle, fontFamily: ts.fontFamily, display: "flex", flexDirection: "column", gap: 1 }}>
            {contactParts.map((p, i) => <span key={i}>{p}</span>)}
          </div>
        </div>
      );
    }
    return (
      <div style={{ marginBottom: 8 }}>
        <div style={{ ...ts.nameStyle, fontFamily: ts.fontFamily }}>{displayName}</div>
        {contactParts.length > 0 && (
          <div style={{ ...ts.contactStyle, fontFamily: ts.fontFamily, marginTop: 3 }}>
            {contactParts.join("  ·  ")}
          </div>
        )}
      </div>
    );
  };

  /* ── Render ──────────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-full">
      {/* Hint bar */}
      <div className="flex-shrink-0 bg-[#0f1f18] px-5 py-2.5 flex items-center gap-3">
        <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <p className="text-xs text-white/70">
          <span className="text-white font-semibold">Click any bullet to edit inline.</span>
          {" "}Hover to delete ( × ). Switch template in the right panel — style updates live.
        </p>
        <div className="ml-auto flex-shrink-0">
          <ATSRing score={atsScore} />
        </div>
      </div>

      {/* Scrollable paper area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto bg-stone-200 py-8 px-4">
        {/* Outer wrapper for scale transform */}
        <div
          style={{
            width: PAPER_W,
            height: paperH * scale < window?.innerHeight ? undefined : paperH,
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            marginLeft: "auto",
            marginRight: "auto",
            marginBottom: scale < 1 ? `${-(paperH * (1 - scale)) + 32}px` : 0,
          }}
        >
          {/* White paper card */}
          <div
            style={{
              width: PAPER_W,
              minHeight: paperH,
              background: "#fff",
              boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
              padding: ts.pagePadding,
              boxSizing: "border-box",
            }}
          >
            {/* Header */}
            {renderHeader()}

            {/* Top accent rule for jake/executive */}
            {(templateId === "jake" || templateId === "executive") && (
              <div style={{ borderTop: "0.8px solid #333", marginBottom: 10 }} />
            )}
            {/* Top blue rule for modern */}
            {templateId === "modern" && (
              <div style={{ borderTop: "0.6px solid #2563eb", marginBottom: 8 }} />
            )}

            {/* Sections in template order */}
            {sectionOrder.map((section) => (
              <React.Fragment key={section}>
                {SECTION_RENDERERS[section]?.()}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeEditor;
