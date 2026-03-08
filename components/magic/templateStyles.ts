import React from "react";

export interface TemplateStyle {
  fontFamily: string;
  sectionHeaderStyle: React.CSSProperties;
  divider: React.CSSProperties | null; // null = no divider
  nameStyle: React.CSSProperties;
  contactStyle: React.CSSProperties;
  bulletPrefix: string;
  accentColor: string;
  bodyFontSize: number;
  headerFontSize: number;
  pagePadding: string; // css padding shorthand
}

export const TEMPLATE_STYLES: Record<string, TemplateStyle> = {
  jake: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    sectionHeaderStyle: { fontSize: 12, fontWeight: "bold", color: "#111", letterSpacing: 0.3 },
    divider: { borderTop: "0.7px solid #444", margin: "2px 0 6px" },
    nameStyle: { fontSize: 22, fontWeight: "bold", textAlign: "center", color: "#111" },
    contactStyle: { textAlign: "center", fontSize: 10, color: "#444" },
    bulletPrefix: "•",
    accentColor: "#111",
    bodyFontSize: 10,
    headerFontSize: 12,
    pagePadding: "32px 36px",
  },
  modern: {
    fontFamily: "system-ui, -apple-system, sans-serif",
    sectionHeaderStyle: { fontSize: 10, fontWeight: "bold", letterSpacing: 1.5, color: "#2563eb", textTransform: "uppercase" },
    divider: { borderTop: "1.5px solid #2563eb", margin: "1px 0 5px" },
    nameStyle: { fontSize: 20, fontWeight: "bold", color: "#111" },
    contactStyle: { textAlign: "right", fontSize: 9.5, color: "#555" },
    bulletPrefix: "▪",
    accentColor: "#1e40af",
    bodyFontSize: 10,
    headerFontSize: 10,
    pagePadding: "28px 32px",
  },
  minimal: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    sectionHeaderStyle: { fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#666", fontWeight: "normal" },
    divider: null,
    nameStyle: { fontSize: 20, fontWeight: "bold", textAlign: "center", color: "#1a1a1a" },
    contactStyle: { textAlign: "center", fontSize: 9.5, color: "#777" },
    bulletPrefix: "—",
    accentColor: "#444",
    bodyFontSize: 10,
    headerFontSize: 9,
    pagePadding: "40px 44px",
  },
  "skills-first": {
    fontFamily: "system-ui, -apple-system, sans-serif",
    sectionHeaderStyle: { fontSize: 10, fontWeight: "bold", color: "#003366", textTransform: "uppercase", letterSpacing: 0.5 },
    divider: { borderTop: "0.8px solid #003366", margin: "2px 0 5px" },
    nameStyle: { fontSize: 20, fontWeight: "bold", color: "#003366" },
    contactStyle: { fontSize: 9.5, color: "#555" },
    bulletPrefix: "•",
    accentColor: "#003366",
    bodyFontSize: 10,
    headerFontSize: 10,
    pagePadding: "28px 32px",
  },
  executive: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    sectionHeaderStyle: { fontSize: 9.5, letterSpacing: 4, textTransform: "uppercase", color: "#222", fontWeight: "normal" },
    divider: { borderTop: "1px solid #333", margin: "2px 0 5px" },
    nameStyle: { fontSize: 24, fontWeight: "bold", textAlign: "center", color: "#111", textTransform: "uppercase", letterSpacing: 1 },
    contactStyle: { textAlign: "center", fontSize: 9.5, color: "#444" },
    bulletPrefix: "•",
    accentColor: "#111",
    bodyFontSize: 10,
    headerFontSize: 9.5,
    pagePadding: "36px 40px",
  },
  "ats-clean": {
    fontFamily: "'Courier New', Courier, monospace",
    sectionHeaderStyle: { fontSize: 10, fontWeight: "bold", textTransform: "uppercase", color: "#000", letterSpacing: 0.3 },
    divider: { borderTop: "0.8px solid #000", margin: "1px 0 4px" },
    nameStyle: { fontSize: 18, fontWeight: "bold", textTransform: "uppercase", color: "#000" },
    contactStyle: { fontSize: 9.5, color: "#333" },
    bulletPrefix: "*",
    accentColor: "#000",
    bodyFontSize: 10,
    headerFontSize: 10,
    pagePadding: "28px 32px",
  },
};

export const SECTION_ORDER: Record<string, Array<"education" | "experience" | "projects" | "skills">> = {
  jake: ["education", "experience", "projects", "skills"],
  modern: ["education", "experience", "projects", "skills"],
  minimal: ["education", "experience", "projects", "skills"],
  "skills-first": ["skills", "experience", "projects", "education"],
  executive: ["education", "experience", "projects", "skills"],
  "ats-clean": ["education", "experience", "projects", "skills"],
};
