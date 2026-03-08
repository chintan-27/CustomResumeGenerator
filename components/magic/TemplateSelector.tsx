"use client";
import React, { useState } from "react";

interface TemplateSelectorProps {
  onSelect: (templateId: string, pageCount: number) => void;
  onBack: () => void;
  compact?: boolean;
}

interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  atsLabel: string;
}

const TEMPLATES: TemplateConfig[] = [
  { id: "jake", name: "Jake's Resume", description: "The most popular Overleaf template — clean, timeless, two-col header", atsLabel: "ATS Compliant" },
  { id: "modern", name: "Modern Blue", description: "Blue accent rule, left-aligned header, crisp section dividers", atsLabel: "ATS Compliant" },
  { id: "minimal", name: "Minimal", description: "Garamond-inspired, em-dash bullets, generous whitespace", atsLabel: "ATS Compliant" },
  { id: "skills-first", name: "Skills First", description: "ATS-first — skills section at the top, navy section headers", atsLabel: "ATS Optimized" },
  { id: "executive", name: "Executive", description: "Bold header, thick rule, small caps sections — senior roles", atsLabel: "ATS Compliant" },
  { id: "ats-clean", name: "ATS Clean", description: "Zero color, ALL CAPS sections — maximum machine readability", atsLabel: "ATS Maximum" },
];

/* ── Inline SVG previews — one per template ─────────────────────────────── */

const JakePreview = () => (
  <svg viewBox="0 0 170 220" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="170" height="220" fill="#fff" />
    {/* Name centered */}
    <text x="85" y="18" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="serif" fill="#111">John A. Smith</text>
    {/* Contact line */}
    <text x="85" y="26" textAnchor="middle" fontSize="4.5" fontFamily="serif" fill="#333">555-1234 | linkedin/jsmith | email@gmail.com | github/jsmith</text>
    {/* hrule */}
    <line x1="10" y1="30" x2="160" y2="30" stroke="#222" strokeWidth="0.7" />

    {/* Education section */}
    <text x="10" y="39" fontSize="6.5" fontWeight="bold" fontFamily="serif" fill="#111">Education</text>
    <line x1="10" y1="41" x2="160" y2="41" stroke="#555" strokeWidth="0.4" />
    <text x="10" y="49" fontSize="4.5" fontWeight="bold" fontFamily="serif" fill="#111">University of Florida</text>
    <text x="160" y="49" textAnchor="end" fontSize="4.5" fontFamily="serif" fill="#333">Aug 2020 – May 2024</text>
    <text x="10" y="55" fontSize="4" fontStyle="italic" fontFamily="serif" fill="#444">B.S. in Computer Science</text>
    <text x="160" y="55" textAnchor="end" fontSize="4" fontFamily="serif" fill="#444">GPA: 3.8/4.0</text>

    {/* Experience section */}
    <text x="10" y="65" fontSize="6.5" fontWeight="bold" fontFamily="serif" fill="#111">Experience</text>
    <line x1="10" y1="67" x2="160" y2="67" stroke="#555" strokeWidth="0.4" />
    <text x="10" y="75" fontSize="4.5" fontWeight="bold" fontFamily="serif" fill="#111">Software Engineer</text>
    <text x="160" y="75" textAnchor="end" fontSize="4" fontFamily="serif" fill="#333">Acme Corp</text>
    <text x="10" y="81" fontSize="3.8" fontStyle="italic" fontFamily="serif" fill="#555">Jun 2022 – Present</text>
    <circle cx="13" cy="87" r="1.2" fill="#333" />
    <rect x="16" y="84.5" width="130" height="3" rx="1.5" fill="#e0e0e0" />
    <circle cx="13" cy="93" r="1.2" fill="#333" />
    <rect x="16" y="90.5" width="110" height="3" rx="1.5" fill="#e0e0e0" />
    <circle cx="13" cy="99" r="1.2" fill="#333" />
    <rect x="16" y="96.5" width="120" height="3" rx="1.5" fill="#e0e0e0" />

    {/* Projects section */}
    <text x="10" y="109" fontSize="6.5" fontWeight="bold" fontFamily="serif" fill="#111">Projects</text>
    <line x1="10" y1="111" x2="160" y2="111" stroke="#555" strokeWidth="0.4" />
    <text x="10" y="119" fontSize="4.5" fontWeight="bold" fontFamily="serif" fill="#111">My Project</text>
    <circle cx="13" cy="125" r="1.2" fill="#333" />
    <rect x="16" y="122.5" width="120" height="3" rx="1.5" fill="#e0e0e0" />
    <circle cx="13" cy="131" r="1.2" fill="#333" />
    <rect x="16" y="128.5" width="100" height="3" rx="1.5" fill="#e0e0e0" />

    {/* Skills section */}
    <text x="10" y="141" fontSize="6.5" fontWeight="bold" fontFamily="serif" fill="#111">Technical Skills</text>
    <line x1="10" y1="143" x2="160" y2="143" stroke="#555" strokeWidth="0.4" />
    <rect x="10" y="146" width="148" height="3" rx="1.5" fill="#e0e0e0" />
    <rect x="10" y="152" width="130" height="3" rx="1.5" fill="#e0e0e0" />
  </svg>
);

const ModernPreview = () => (
  <svg viewBox="0 0 170 220" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="170" height="220" fill="#fff" />
    {/* Two-minipage header */}
    <text x="10" y="16" fontSize="9" fontWeight="bold" fontFamily="sans-serif" fill="#111">John Smith</text>
    <text x="160" y="12" textAnchor="end" fontSize="4" fontFamily="sans-serif" fill="#555">email@gmail.com</text>
    <text x="160" y="18" textAnchor="end" fontSize="4" fontFamily="sans-serif" fill="#555">linkedin/jsmith</text>
    <text x="160" y="24" textAnchor="end" fontSize="4" fontFamily="sans-serif" fill="#555">github/jsmith</text>
    {/* Blue accent rule */}
    <rect x="10" y="28" width="150" height="1.2" fill="#2563EB" rx="0.6" />

    {/* Experience section */}
    <text x="10" y="38" fontSize="6" fontWeight="bold" fontFamily="sans-serif" fill="#333" letterSpacing="0.5">EXPERIENCE</text>
    <rect x="10" y="40" width="150" height="0.8" fill="#2563EB" rx="0.4" />
    <text x="10" y="49" fontSize="4.5" fontWeight="bold" fontFamily="sans-serif" fill="#111">Software Engineer</text>
    <text x="160" y="49" textAnchor="end" fontSize="4" fontFamily="sans-serif" fill="#2563EB">Acme Corp</text>
    <text x="10" y="55" fontSize="3.8" fontFamily="sans-serif" fill="#777">Jun 2022 – Present</text>
    <rect x="12" y="58.5" width="2" height="2" rx="1" fill="#555" />
    <rect x="16" y="58" width="125" height="3" rx="1.5" fill="#e8e8e8" />
    <rect x="12" y="64.5" width="2" height="2" rx="1" fill="#555" />
    <rect x="16" y="64" width="110" height="3" rx="1.5" fill="#e8e8e8" />
    <rect x="12" y="70.5" width="2" height="2" rx="1" fill="#555" />
    <rect x="16" y="70" width="118" height="3" rx="1.5" fill="#e8e8e8" />

    {/* Projects section */}
    <text x="10" y="83" fontSize="6" fontWeight="bold" fontFamily="sans-serif" fill="#333" letterSpacing="0.5">PROJECTS</text>
    <rect x="10" y="85" width="150" height="0.8" fill="#2563EB" rx="0.4" />
    <text x="10" y="94" fontSize="4.5" fontWeight="bold" fontFamily="sans-serif" fill="#111">My Project</text>
    <rect x="12" y="97.5" width="2" height="2" rx="1" fill="#555" />
    <rect x="16" y="97" width="115" height="3" rx="1.5" fill="#e8e8e8" />
    <rect x="12" y="103.5" width="2" height="2" rx="1" fill="#555" />
    <rect x="16" y="103" width="100" height="3" rx="1.5" fill="#e8e8e8" />

    {/* Education section */}
    <text x="10" y="116" fontSize="6" fontWeight="bold" fontFamily="sans-serif" fill="#333" letterSpacing="0.5">EDUCATION</text>
    <rect x="10" y="118" width="150" height="0.8" fill="#2563EB" rx="0.4" />
    <text x="10" y="127" fontSize="4.5" fontWeight="bold" fontFamily="sans-serif" fill="#111">University of Florida</text>
    <text x="160" y="127" textAnchor="end" fontSize="4" fontFamily="sans-serif" fill="#777">May 2024</text>
    <text x="10" y="133" fontSize="4" fontFamily="sans-serif" fill="#666">B.S. Computer Science  ·  GPA: 3.8</text>

    {/* Skills section */}
    <text x="10" y="145" fontSize="6" fontWeight="bold" fontFamily="sans-serif" fill="#333" letterSpacing="0.5">SKILLS</text>
    <rect x="10" y="147" width="150" height="0.8" fill="#2563EB" rx="0.4" />
    <rect x="10" y="151" width="148" height="3" rx="1.5" fill="#e8e8e8" />
    <rect x="10" y="157" width="130" height="3" rx="1.5" fill="#e8e8e8" />
  </svg>
);

const MinimalPreview = () => (
  <svg viewBox="0 0 170 220" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="170" height="220" fill="#fdfcfa" />
    {/* Centered name */}
    <text x="85" y="20" textAnchor="middle" fontSize="11" fontWeight="bold" fontFamily="Georgia, serif" fill="#1a1a1a">John Smith</text>
    {/* thin rule under name only */}
    <line x1="40" y1="24" x2="130" y2="24" stroke="#bbb" strokeWidth="0.5" />
    {/* Contact */}
    <text x="85" y="31" textAnchor="middle" fontSize="4" fontFamily="Georgia, serif" fill="#777">email@gmail.com  ·  linkedin/jsmith  ·  github/jsmith</text>

    {/* Education — small caps style */}
    <text x="10" y="44" fontSize="5.5" fontFamily="Georgia, serif" fill="#444" letterSpacing="1">EDUCATION</text>
    <text x="10" y="53" fontSize="4.5" fontWeight="bold" fontFamily="Georgia, serif" fill="#222">University of Florida</text>
    <text x="160" y="53" textAnchor="end" fontSize="4" fontFamily="Georgia, serif" fill="#888">2020 – 2024</text>
    <text x="10" y="59" fontSize="4" fontStyle="italic" fontFamily="Georgia, serif" fill="#666">B.S. in Computer Science</text>

    {/* Experience */}
    <text x="10" y="72" fontSize="5.5" fontFamily="Georgia, serif" fill="#444" letterSpacing="1">EXPERIENCE</text>
    <text x="10" y="81" fontSize="4.5" fontWeight="bold" fontFamily="Georgia, serif" fill="#222">Software Engineer, Acme Corp</text>
    <text x="160" y="81" textAnchor="end" fontSize="4" fontFamily="Georgia, serif" fill="#888">Jun 2022 – Present</text>
    {/* em-dash bullets */}
    <text x="12" y="89" fontSize="4" fontFamily="Georgia, serif" fill="#555">—</text>
    <rect x="20" y="86" width="128" height="3" rx="1.5" fill="#e8e4de" />
    <text x="12" y="96" fontSize="4" fontFamily="Georgia, serif" fill="#555">—</text>
    <rect x="20" y="93" width="112" height="3" rx="1.5" fill="#e8e4de" />
    <text x="12" y="103" fontSize="4" fontFamily="Georgia, serif" fill="#555">—</text>
    <rect x="20" y="100" width="120" height="3" rx="1.5" fill="#e8e4de" />

    {/* Projects */}
    <text x="10" y="116" fontSize="5.5" fontFamily="Georgia, serif" fill="#444" letterSpacing="1">PROJECTS</text>
    <text x="10" y="125" fontSize="4.5" fontWeight="bold" fontFamily="Georgia, serif" fill="#222">My Project</text>
    <text x="12" y="133" fontSize="4" fontFamily="Georgia, serif" fill="#555">—</text>
    <rect x="20" y="130" width="120" height="3" rx="1.5" fill="#e8e4de" />
    <text x="12" y="140" fontSize="4" fontFamily="Georgia, serif" fill="#555">—</text>
    <rect x="20" y="137" width="108" height="3" rx="1.5" fill="#e8e4de" />

    {/* Skills */}
    <text x="10" y="153" fontSize="5.5" fontFamily="Georgia, serif" fill="#444" letterSpacing="1">SKILLS</text>
    <rect x="10" y="157" width="148" height="3" rx="1.5" fill="#e8e4de" />
    <rect x="10" y="163" width="130" height="3" rx="1.5" fill="#e8e4de" />
  </svg>
);

const SkillsFirstPreview = () => (
  <svg viewBox="0 0 170 220" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="170" height="220" fill="#fff" />
    {/* Header */}
    <text x="10" y="16" fontSize="9" fontWeight="bold" fontFamily="sans-serif" fill="#003366">John Smith</text>
    <text x="10" y="23" fontSize="4" fontFamily="sans-serif" fill="#555">email@gmail.com  ·  555-1234  ·  linkedin/jsmith  ·  github/jsmith</text>
    <rect x="10" y="26" width="150" height="1" fill="#003366" rx="0.5" />

    {/* SKILLS FIRST — prominent */}
    <text x="10" y="35" fontSize="6" fontWeight="bold" fontFamily="sans-serif" fill="#003366">SKILLS</text>
    <rect x="10" y="37" width="150" height="0.6" fill="#003366" rx="0.3" />
    <rect x="10" y="40" width="148" height="3" rx="1.5" fill="#dce9f5" />
    <rect x="10" y="46" width="128" height="3" rx="1.5" fill="#dce9f5" />
    <rect x="10" y="52" width="138" height="3" rx="1.5" fill="#dce9f5" />

    {/* Experience */}
    <text x="10" y="63" fontSize="6" fontWeight="bold" fontFamily="sans-serif" fill="#003366">EXPERIENCE</text>
    <rect x="10" y="65" width="150" height="0.6" fill="#003366" rx="0.3" />
    <text x="10" y="74" fontSize="4.5" fontWeight="bold" fontFamily="sans-serif" fill="#111">Software Engineer</text>
    <text x="160" y="74" textAnchor="end" fontSize="4" fontFamily="sans-serif" fill="#003366">Acme Corp</text>
    <text x="10" y="80" fontSize="3.8" fontFamily="sans-serif" fill="#777">Jun 2022 – Present</text>
    <rect x="12" y="83.5" width="2" height="2" rx="1" fill="#003366" />
    <rect x="16" y="83" width="122" height="3" rx="1.5" fill="#e5e5e5" />
    <rect x="12" y="89.5" width="2" height="2" rx="1" fill="#003366" />
    <rect x="16" y="89" width="110" height="3" rx="1.5" fill="#e5e5e5" />
    <rect x="12" y="95.5" width="2" height="2" rx="1" fill="#003366" />
    <rect x="16" y="95" width="116" height="3" rx="1.5" fill="#e5e5e5" />

    {/* Projects */}
    <text x="10" y="107" fontSize="6" fontWeight="bold" fontFamily="sans-serif" fill="#003366">PROJECTS</text>
    <rect x="10" y="109" width="150" height="0.6" fill="#003366" rx="0.3" />
    <text x="10" y="118" fontSize="4.5" fontWeight="bold" fontFamily="sans-serif" fill="#111">My Project</text>
    <rect x="12" y="121.5" width="2" height="2" rx="1" fill="#003366" />
    <rect x="16" y="121" width="118" height="3" rx="1.5" fill="#e5e5e5" />
    <rect x="12" y="127.5" width="2" height="2" rx="1" fill="#003366" />
    <rect x="16" y="127" width="100" height="3" rx="1.5" fill="#e5e5e5" />

    {/* Education */}
    <text x="10" y="140" fontSize="6" fontWeight="bold" fontFamily="sans-serif" fill="#003366">EDUCATION</text>
    <rect x="10" y="142" width="150" height="0.6" fill="#003366" rx="0.3" />
    <text x="10" y="151" fontSize="4.5" fontWeight="bold" fontFamily="sans-serif" fill="#111">University of Florida</text>
    <text x="10" y="157" fontSize="4" fontFamily="sans-serif" fill="#666">B.S. Computer Science  ·  GPA: 3.8</text>
  </svg>
);

const ExecutivePreview = () => (
  <svg viewBox="0 0 170 220" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="170" height="220" fill="#fff" />
    {/* Huge name centered */}
    <text x="85" y="20" textAnchor="middle" fontSize="13" fontWeight="bold" fontFamily="serif" fill="#111">JOHN A. SMITH</text>
    {/* Thick rule */}
    <rect x="10" y="23" width="150" height="2" fill="#222" />
    <rect x="10" y="26.5" width="150" height="0.5" fill="#555" />
    {/* Contact line */}
    <text x="85" y="33" textAnchor="middle" fontSize="4" fontFamily="serif" fill="#444">email@gmail.com  |  linkedin  |  555-1234</text>

    {/* Experience — small caps style */}
    <text x="10" y="45" fontSize="6.5" fontFamily="serif" fill="#222" letterSpacing="1.5">E X P E R I E N C E</text>
    <rect x="10" y="47" width="150" height="0.6" fill="#444" />
    <text x="10" y="57" fontSize="4.5" fontWeight="bold" fontFamily="serif" fill="#111">Senior Software Engineer</text>
    <text x="160" y="57" textAnchor="end" fontSize="4" fontFamily="serif" fill="#333">Acme Corp</text>
    <text x="10" y="63" fontSize="4" fontStyle="italic" fontFamily="serif" fill="#666">Jun 2020 – Present</text>
    <circle cx="13" cy="69" r="1.3" fill="#333" />
    <rect x="17" y="67" width="122" height="3" rx="1.5" fill="#e0e0e0" />
    <circle cx="13" cy="75" r="1.3" fill="#333" />
    <rect x="17" y="73" width="108" height="3" rx="1.5" fill="#e0e0e0" />
    <circle cx="13" cy="81" r="1.3" fill="#333" />
    <rect x="17" y="79" width="116" height="3" rx="1.5" fill="#e0e0e0" />

    {/* Education */}
    <text x="10" y="95" fontSize="6.5" fontFamily="serif" fill="#222" letterSpacing="1.5">E D U C A T I O N</text>
    <rect x="10" y="97" width="150" height="0.6" fill="#444" />
    <text x="10" y="107" fontSize="4.5" fontWeight="bold" fontFamily="serif" fill="#111">University of Florida</text>
    <text x="160" y="107" textAnchor="end" fontSize="4" fontFamily="serif" fill="#666">May 2024</text>
    <text x="10" y="113" fontSize="4" fontStyle="italic" fontFamily="serif" fill="#555">B.S. in Computer Science  —  GPA: 3.8</text>

    {/* Skills */}
    <text x="10" y="126" fontSize="6.5" fontFamily="serif" fill="#222" letterSpacing="1.5">S K I L L S</text>
    <rect x="10" y="128" width="150" height="0.6" fill="#444" />
    <rect x="10" y="133" width="148" height="3" rx="1.5" fill="#e5e5e5" />
    <rect x="10" y="140" width="130" height="3" rx="1.5" fill="#e5e5e5" />

    {/* Projects */}
    <text x="10" y="153" fontSize="6.5" fontFamily="serif" fill="#222" letterSpacing="1.5">P R O J E C T S</text>
    <rect x="10" y="155" width="150" height="0.6" fill="#444" />
    <text x="10" y="164" fontSize="4.5" fontWeight="bold" fontFamily="serif" fill="#111">My Project</text>
    <circle cx="13" cy="170" r="1.3" fill="#333" />
    <rect x="17" y="168" width="115" height="3" rx="1.5" fill="#e5e5e5" />
  </svg>
);

const ATSCleanPreview = () => (
  <svg viewBox="0 0 170 220" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="170" height="220" fill="#fff" />
    {/* Name left-aligned, no centering */}
    <text x="10" y="16" fontSize="9" fontWeight="bold" fontFamily="monospace" fill="#000">JOHN SMITH</text>
    <text x="10" y="23" fontSize="4" fontFamily="monospace" fill="#333">email@gmail.com | 555-1234 | linkedin/jsmith</text>
    <line x1="10" y1="26" x2="160" y2="26" stroke="#000" strokeWidth="0.8" />

    {/* EDUCATION — ALL CAPS */}
    <text x="10" y="34" fontSize="6" fontWeight="bold" fontFamily="monospace" fill="#000">EDUCATION</text>
    <line x1="10" y1="36" x2="160" y2="36" stroke="#000" strokeWidth="0.5" />
    <text x="10" y="44" fontSize="4.5" fontFamily="monospace" fill="#000">University of Florida</text>
    <text x="160" y="44" textAnchor="end" fontSize="4" fontFamily="monospace" fill="#333">Aug 2020 - May 2024</text>
    <text x="10" y="50" fontSize="4" fontFamily="monospace" fill="#555">BS Computer Science | GPA: 3.8</text>

    {/* EXPERIENCE — ALL CAPS */}
    <text x="10" y="60" fontSize="6" fontWeight="bold" fontFamily="monospace" fill="#000">EXPERIENCE</text>
    <line x1="10" y1="62" x2="160" y2="62" stroke="#000" strokeWidth="0.5" />
    <text x="10" y="70" fontSize="4.5" fontFamily="monospace" fill="#000">Software Engineer</text>
    <text x="10" y="76" fontSize="4" fontFamily="monospace" fill="#555">Acme Corp | Jun 2022 - Present</text>
    <text x="12" y="83" fontSize="4" fontFamily="monospace" fill="#333">*</text>
    <rect x="18" y="80" width="128" height="3" rx="1" fill="#e0e0e0" />
    <text x="12" y="89" fontSize="4" fontFamily="monospace" fill="#333">*</text>
    <rect x="18" y="86" width="114" height="3" rx="1" fill="#e0e0e0" />
    <text x="12" y="95" fontSize="4" fontFamily="monospace" fill="#333">*</text>
    <rect x="18" y="92" width="120" height="3" rx="1" fill="#e0e0e0" />

    {/* PROJECTS — ALL CAPS */}
    <text x="10" y="105" fontSize="6" fontWeight="bold" fontFamily="monospace" fill="#000">PROJECTS</text>
    <line x1="10" y1="107" x2="160" y2="107" stroke="#000" strokeWidth="0.5" />
    <text x="10" y="115" fontSize="4.5" fontFamily="monospace" fill="#000">My Project</text>
    <text x="12" y="122" fontSize="4" fontFamily="monospace" fill="#333">*</text>
    <rect x="18" y="119" width="120" height="3" rx="1" fill="#e0e0e0" />
    <text x="12" y="128" fontSize="4" fontFamily="monospace" fill="#333">*</text>
    <rect x="18" y="125" width="108" height="3" rx="1" fill="#e0e0e0" />

    {/* SKILLS — ALL CAPS */}
    <text x="10" y="138" fontSize="6" fontWeight="bold" fontFamily="monospace" fill="#000">SKILLS</text>
    <line x1="10" y1="140" x2="160" y2="140" stroke="#000" strokeWidth="0.5" />
    <rect x="10" y="144" width="148" height="3" rx="1" fill="#e0e0e0" />
    <rect x="10" y="150" width="130" height="3" rx="1" fill="#e0e0e0" />
    <rect x="10" y="156" width="138" height="3" rx="1" fill="#e0e0e0" />
  </svg>
);

const PREVIEWS: Record<string, React.FC> = {
  jake: JakePreview,
  modern: ModernPreview,
  minimal: MinimalPreview,
  "skills-first": SkillsFirstPreview,
  executive: ExecutivePreview,
  "ats-clean": ATSCleanPreview,
};

export { PREVIEWS };

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelect, onBack, compact = false }) => {
  const [selectedId, setSelectedId] = useState<string>("jake");
  const [pageCount, setPageCount] = useState<number>(1);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      {!compact && (
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0f1f18] mb-6 shadow-lg shadow-black/20">
            <svg className="w-8 h-8 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-[#1a1a1a] mb-3">Choose Your Template</h2>
          <p className="text-[#6b7280] text-lg max-w-xl mx-auto">
            All templates are ATS-compliant and crafted from popular real-world designs
          </p>
        </div>
      )}
      {compact && (
        <div className="mb-5">
          <h2 className="text-xl font-bold text-[#1a1a1a] mb-1">Choose Your Template</h2>
          <p className="text-sm text-[#6b7280]">All templates are ATS-compliant</p>
        </div>
      )}

      {/* Template Grid */}
      <div className={compact ? "grid grid-cols-3 gap-2 mb-5" : "grid grid-cols-2 md:grid-cols-3 gap-4 mb-8"}>
        {TEMPLATES.map((tpl) => {
          const Preview = PREVIEWS[tpl.id];
          const isSelected = selectedId === tpl.id;
          return (
            <button
              key={tpl.id}
              onClick={() => setSelectedId(tpl.id)}
              className={`relative text-left rounded-2xl border-2 transition-all duration-200 group bg-white overflow-hidden
                ${isSelected
                  ? "border-[#2d6a4f] shadow-lg shadow-[#2d6a4f]/15 scale-[1.02]"
                  : "border-stone-200 hover:border-stone-300 hover:shadow-md"
                }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-[#2d6a4f] rounded-full flex items-center justify-center shadow-md">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {/* SVG Preview — realistic mockup */}
              <div className="aspect-[8.5/11] border-b border-stone-100 overflow-hidden bg-white">
                {Preview && <Preview />}
              </div>

              {/* Template info */}
              <div className={compact ? "p-2" : "p-3"}>
                <h3 className={`font-semibold text-[#1a1a1a] mb-0.5 ${compact ? "text-xs" : "text-sm"}`}>{tpl.name}</h3>
                {!compact && <p className="text-xs text-[#6b7280] leading-relaxed mb-2">{tpl.description}</p>}
                {!compact && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[#2d6a4f]/10 text-[#2d6a4f]">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {tpl.atsLabel}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Page count */}
      <div className={`bg-white rounded-2xl border border-stone-200 shadow-sm ${compact ? "p-3 mb-4" : "p-5 mb-8"}`}>
        <h3 className="font-semibold text-[#1a1a1a] mb-4 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 text-[#2d6a4f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Resume Length
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { n: 1, desc: "3 exp, 2 projects", tag: "Recommended" },
            { n: 2, desc: "5 exp, 4 projects", tag: "Senior roles" },
          ].map(({ n, desc, tag }) => (
            <button
              key={n}
              onClick={() => setPageCount(n)}
              className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                pageCount === n
                  ? "border-[#2d6a4f] bg-[#2d6a4f]/5"
                  : "border-stone-200 hover:border-stone-300"
              }`}
            >
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-2xl font-bold text-[#1a1a1a]">{n}</span>
                <span className="text-[#6b7280] text-sm">Page{n > 1 ? "s" : ""}</span>
              </div>
              <p className="text-xs text-[#6b7280]">{desc}</p>
              {pageCount === n && (
                <span className="inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-[#1a1a1a] text-white">
                  {tag}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
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
          onClick={() => onSelect(selectedId, pageCount)}
          className="group px-8 py-3.5 rounded-full font-semibold text-sm bg-[#1a1a1a] text-white shadow-lg shadow-black/10 hover:bg-[#2d6a4f] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
        >
          Next: Select Content
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TemplateSelector;
