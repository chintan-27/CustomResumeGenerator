"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useInView } from "framer-motion";

// ─── Animation helpers ────────────────────────────────────────────────────────

const FadeUp = ({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

const StaggerGrid = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
    >
      {children}
    </motion.div>
  );
};

const StaggerItem = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: 28 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
    }}
  >
    {children}
  </motion.div>
);

// ─── Hero Resume Mockup ───────────────────────────────────────────────────────

const ResumePreview = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="relative w-full max-w-[340px] mx-auto select-none">
      {/* Ambient glow behind card */}
      <div className="absolute inset-0 scale-110 bg-[#2d6a4f] opacity-20 blur-[70px] rounded-full pointer-events-none" />

      {/* Main resume card */}
      <motion.div
        initial={{ opacity: 0, y: 24, rotate: -2 }}
        animate={inView ? { opacity: 1, y: 0, rotate: -2 } : {}}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative bg-white rounded-2xl p-7 border border-stone-100"
        style={{ boxShadow: "0 25px 60px -12px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)" }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-5">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-stone-200 to-stone-300 flex-shrink-0" />
          <div className="flex-1">
            <div className="h-3.5 bg-stone-900 rounded-full w-28 mb-2" />
            <div className="h-2 bg-stone-300 rounded-full w-40 mb-1.5" />
            <div className="flex gap-2">
              <div className="h-1.5 bg-stone-200 rounded-full w-16" />
              <div className="h-1.5 bg-stone-200 rounded-full w-20" />
            </div>
          </div>
        </div>

        <div className="border-t border-stone-100 mb-4" />

        {/* Experience section */}
        <div className="mb-4">
          <div className="h-2 rounded-full w-20 mb-3" style={{ background: "rgba(45,106,79,0.35)" }} />
          <div className="space-y-1.5 pl-3 border-l-2 border-[#2d6a4f]/20">
            <div className="h-1.5 bg-stone-100 rounded-full w-full" />
            <div className="h-1.5 bg-stone-100 rounded-full w-5/6" />
            <div className="h-1.5 bg-stone-100 rounded-full w-4/5" />
            <div className="h-1.5 bg-stone-100 rounded-full w-11/12" />
          </div>
        </div>

        {/* Education section */}
        <div className="mb-5">
          <div className="h-2 rounded-full w-16 mb-3" style={{ background: "rgba(45,106,79,0.35)" }} />
          <div className="space-y-1.5 pl-3 border-l-2 border-[#2d6a4f]/20">
            <div className="h-1.5 bg-stone-100 rounded-full w-full" />
            <div className="h-1.5 bg-stone-100 rounded-full w-4/5" />
          </div>
        </div>

        {/* Skills chips */}
        <div className="flex flex-wrap gap-1.5">
          {["React", "Python", "TypeScript", "AWS", "Node.js"].map((s) => (
            <span
              key={s}
              className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 font-semibold"
              style={{ fontSize: "9px" }}
            >
              {s}
            </span>
          ))}
        </div>
      </motion.div>

      {/* ATS Score badge — floats up */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.4, delay: 0.7 }}
        className="absolute -top-6 -right-6 animate-float-up"
      >
        <div
          className="bg-white rounded-2xl px-4 py-3 border border-stone-100"
          style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
        >
          <p className="text-stone-400 mb-1" style={{ fontSize: "9px", fontFamily: "var(--font-mono)" }}>
            ATS SCORE
          </p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-emerald-600">98%</span>
            <span className="text-emerald-400 text-sm">↑</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-stone-100 w-24 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" style={{ width: "98%" }} />
          </div>
        </div>
      </motion.div>

      {/* Keywords badge — floats down */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.4, delay: 0.9 }}
        className="absolute -bottom-6 -left-6 animate-float-down"
      >
        <div
          className="bg-white rounded-2xl px-4 py-3 border border-stone-100"
          style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
        >
          <p className="text-stone-400 mb-1" style={{ fontSize: "9px", fontFamily: "var(--font-mono)" }}>
            KEYWORDS MATCHED
          </p>
          <p className="font-black text-stone-900">
            12 <span className="text-stone-300 font-normal">/</span> 14{" "}
            <span className="text-emerald-500 text-sm">✓</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const TICKER_ITEMS = [
  "ATS Optimized",
  "Zero Hallucinations",
  "Keyword Matching",
  "6 Pro Templates",
  "Instant PDF Export",
  "2026 Best Practices",
  "LaTeX Compiled",
  "Anti-Hallucination AI",
];
const TICKER_LOOP = [...TICKER_ITEMS, ...TICKER_ITEMS];

const FEATURES = [
  {
    icon: "◎",
    title: "ATS Optimized",
    body: "Single-column layouts with standard fonts. Every resume passes ATS scanners without issue.",
    bg: "#f0fdf4",
    iconColor: "#2d6a4f",
  },
  {
    icon: "⌘",
    title: "Keyword Matching",
    body: "AI extracts exact keywords from job descriptions and maps them precisely to your experience.",
    bg: "#fffbeb",
    iconColor: "#c97d3f",
  },
  {
    icon: "✦",
    title: "Zero Hallucinations",
    body: "Grounded only in your actual data. Every claim traceable. Nothing fabricated.",
    bg: "#eef2ff",
    iconColor: "#4f46e5",
  },
  {
    icon: "◈",
    title: "Smart Questions",
    body: "AI asks for specific metrics to strengthen your bullets with real, verifiable numbers.",
    bg: "#fdf2f8",
    iconColor: "#c026d3",
  },
  {
    icon: "⬡",
    title: "6 Pro Templates",
    body: "Classic, modern, minimal, skills-first, executive, and ATS-optimized formats.",
    bg: "#f0fdf4",
    iconColor: "#2d6a4f",
  },
  {
    icon: "↓",
    title: "Instant PDF Export",
    body: "Download your polished, print-ready resume via professional LaTeX rendering.",
    bg: "#fffbeb",
    iconColor: "#c97d3f",
  },
];

const TEMPLATES = [
  { label: "Classic", accent: "#2d6a4f", desc: "Traditional, ATS-proven" },
  { label: "Modern", accent: "#4f46e5", desc: "Clean lines, accent colors" },
  { label: "Minimal", accent: "#374151", desc: "Maximum whitespace" },
  { label: "Skills First", accent: "#c97d3f", desc: "Skills at top for ATS" },
  { label: "Executive", accent: "#1e3a5f", desc: "Senior roles, wider margins" },
  { label: "ATS Pure", accent: "#111827", desc: "Plain-text compatibility" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.75], [0, -50]);

  return (
    <div className="bg-[#faf9f6] text-[#1a1a1a] overflow-x-hidden">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-[#e5e3de] bg-[#faf9f6]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl">
            Resume<span className="text-[#2d6a4f]">AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-[#6b7280] hover:text-[#1a1a1a] transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 bg-[#1a1a1a] text-white text-sm font-semibold rounded-full hover:bg-[#2d6a4f] transition-colors duration-200 shadow-sm"
            >
              Get Started →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute top-10 right-[-100px] w-[700px] h-[700px] rounded-full bg-[#2d6a4f] opacity-[0.08] blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full bg-[#c97d3f] opacity-[0.07] blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-[#4ade80] opacity-[0.03] blur-[120px] pointer-events-none" />

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 w-full max-w-7xl mx-auto px-6 py-24"
        >
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Copy */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#e5e3de] text-[#6b7280] mb-8 shadow-sm"
                  style={{ fontSize: "11px", fontFamily: "var(--font-mono)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f] animate-pulse" />
                  AI-Powered · ATS-Optimized · 2026
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="font-bold leading-[1.06] mb-6 tracking-tight"
                style={{ fontSize: "clamp(2.8rem, 5.5vw, 5.2rem)" }}
              >
                Your Resume,
                <br />
                <span className="text-[#2d6a4f]">Perfected</span>
                <br />
                by AI.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.22 }}
                className="text-lg text-[#6b7280] mb-10 max-w-md leading-relaxed"
              >
                Tailored to every job description. Grounded in your real experience.
                Zero hallucinations — just results.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.32 }}
                className="flex flex-wrap gap-3 mb-12"
              >
                <Link
                  href="/signup"
                  className="px-7 py-3.5 bg-[#1a1a1a] text-white font-semibold rounded-full hover:bg-[#2d6a4f] transition-all duration-200 shadow-lg shadow-black/10 flex items-center gap-2 text-[15px]"
                >
                  Start for Free
                  <span className="text-base">→</span>
                </Link>
                <Link
                  href="#how-it-works"
                  className="px-7 py-3.5 bg-white text-[#1a1a1a] font-semibold rounded-full border border-[#e5e3de] hover:border-[#2d6a4f] hover:text-[#2d6a4f] transition-all duration-200 text-[15px]"
                >
                  How it works
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.48 }}
                className="flex gap-8 pt-8 border-t border-[#e5e3de]"
              >
                {[
                  { v: "50K+", l: "Resumes created" },
                  { v: "89%", l: "Interview rate" },
                  { v: "6", l: "Pro templates" },
                  { v: "0", l: "Hallucinations" },
                ].map((s, i) => (
                  <div key={i}>
                    <div className="text-2xl font-black text-[#1a1a1a]">{s.v}</div>
                    <div
                      className="text-[#6b7280] mt-0.5"
                      style={{ fontSize: "11px", fontFamily: "var(--font-mono)" }}
                    >
                      {s.l}
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: Resume mockup */}
            <div className="hidden lg:flex items-center justify-center pr-4 pt-12">
              <ResumePreview />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Ticker ─────────────────────────────────────────────────────────── */}
      <div className="overflow-hidden bg-[#2d6a4f] border-y border-[#245c43] py-3.5">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          className="flex whitespace-nowrap"
        >
          {TICKER_LOOP.map((item, i) => (
            <span
              key={i}
              className="text-white/75 font-medium px-7 flex items-center gap-3"
              style={{ fontSize: "13px" }}
            >
              {item}
              <span className="text-[#4ade80]" style={{ fontSize: "8px" }}>◆</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── How It Works (dark) ────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative bg-[#0f1f18] noise py-28 overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#2d6a4f] opacity-10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#c97d3f] opacity-08 blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <FadeUp>
            <div className="mb-14">
              <span
                className="uppercase tracking-widest text-[#4ade80]"
                style={{ fontSize: "11px", fontFamily: "var(--font-mono)" }}
              >
                Process
              </span>
              <h2
                className="text-white font-bold mt-3 leading-tight"
                style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
              >
                Three steps to your
                <br />
                perfect resume
              </h2>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                num: "01",
                title: "Paste the job description",
                desc: "Drop in any job posting. Our AI extracts every keyword, requirement, and skill needed to land the role.",
                accent: "#4ade80",
              },
              {
                num: "02",
                title: "AI tailors your content",
                desc: "Grounded entirely in your real experience. Every bullet point crafted from your actual data — zero hallucinations.",
                accent: "#fbbf24",
              },
              {
                num: "03",
                title: "Download and apply",
                desc: "Review, customize, and download your ATS-optimized PDF. LaTeX-compiled, pixel-perfect, interview-ready.",
                accent: "#a78bfa",
              },
            ].map((step, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <div className="relative p-8 rounded-2xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/[0.15] transition-all duration-300 group h-full">
                  <div
                    className="text-5xl font-black mb-6 leading-none opacity-80"
                    style={{ color: step.accent, fontFamily: "var(--font-mono)" }}
                  >
                    {step.num}
                  </div>
                  <h3 className="text-white text-xl font-bold mb-3 leading-snug">{step.title}</h3>
                  <p className="text-white/45 leading-relaxed text-sm">{step.desc}</p>
                  <div
                    className="mt-6 h-0.5 rounded-full transition-all duration-300 group-hover:w-16 w-8"
                    style={{ background: step.accent }}
                  />
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section className="py-28 bg-[#faf9f6]">
        <div className="max-w-7xl mx-auto px-6">
          <FadeUp>
            <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <span
                  className="uppercase tracking-widest text-[#6b7280]"
                  style={{ fontSize: "11px", fontFamily: "var(--font-mono)" }}
                >
                  Features
                </span>
                <h2
                  className="font-bold mt-3 leading-tight"
                  style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
                >
                  Why ResumeAI?
                </h2>
              </div>
              <p className="text-[#6b7280] max-w-xs text-sm leading-relaxed">
                Built with 2026 hiring trends and ATS requirements in mind, from the ground up.
              </p>
            </div>
          </FadeUp>

          <StaggerGrid className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <StaggerItem key={i}>
                <div className="group p-7 rounded-2xl bg-white border border-[#e5e3de] hover:shadow-xl hover:shadow-black/[0.05] hover:-translate-y-1.5 transition-all duration-300 h-full">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold mb-5"
                    style={{ background: f.bg, color: f.iconColor }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-[#6b7280] text-sm leading-relaxed">{f.body}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* ── Templates ──────────────────────────────────────────────────────── */}
      <section className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <FadeUp>
            <div className="mb-14 text-center">
              <span
                className="uppercase tracking-widest text-[#6b7280]"
                style={{ fontSize: "11px", fontFamily: "var(--font-mono)" }}
              >
                Templates
              </span>
              <h2
                className="font-bold mt-3 leading-tight"
                style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
              >
                6 templates, all ATS-ready
              </h2>
              <p className="text-[#6b7280] mt-4 max-w-md mx-auto text-sm leading-relaxed">
                Six professionally designed formats, each crafted for maximum impact and ATS compatibility.
              </p>
            </div>
          </FadeUp>

          <StaggerGrid className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEMPLATES.map((t, i) => (
              <StaggerItem key={i}>
                <div className="group border border-[#e5e3de] rounded-2xl overflow-hidden bg-white hover:shadow-xl hover:shadow-black/[0.07] hover:-translate-y-1.5 transition-all duration-300">
                  {/* Resume preview area */}
                  <div className="h-44 bg-[#faf9f6] p-5 flex flex-col gap-2.5">
                    <div className="flex items-center gap-2.5 mb-1">
                      <div
                        className="w-7 h-7 rounded-full flex-shrink-0"
                        style={{ background: t.accent + "25" }}
                      />
                      <div className="flex-1">
                        <div className="h-2.5 rounded-full w-24 mb-1.5" style={{ background: t.accent }} />
                        <div className="h-1.5 bg-stone-200 rounded-full w-32" />
                      </div>
                    </div>
                    <div className="border-t border-stone-200 pt-2.5 space-y-1.5">
                      <div className="h-1.5 bg-stone-200 rounded-full w-full" />
                      <div className="h-1.5 bg-stone-200 rounded-full w-5/6" />
                      <div className="h-1.5 bg-stone-200 rounded-full w-4/5" />
                      <div className="h-1.5 bg-stone-200 rounded-full w-full" />
                    </div>
                    <div className="flex gap-1.5 mt-0.5">
                      {[0, 1, 2].map((k) => (
                        <span
                          key={k}
                          className="px-2 py-0.5 rounded-full font-semibold"
                          style={{
                            background: t.accent + "18",
                            color: t.accent,
                            fontSize: "8px",
                          }}
                        >
                          Skill
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* Label */}
                  <div className="px-5 py-4 flex items-center justify-between border-t border-[#e5e3de]">
                    <div>
                      <p className="font-bold text-sm">{t.label}</p>
                      <p
                        className="text-[#6b7280] mt-0.5"
                        style={{ fontSize: "11px", fontFamily: "var(--font-mono)" }}
                      >
                        {t.desc}
                      </p>
                    </div>
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold group-hover:scale-110 transition-transform"
                      style={{ background: t.accent + "15", color: t.accent }}
                    >
                      →
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#0f1f18] noise py-28 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#2d6a4f] opacity-[0.12] blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[#c97d3f] opacity-[0.06] blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <FadeUp>
            <div className="max-w-2xl">
              <span
                className="uppercase tracking-widest text-[#4ade80]"
                style={{ fontSize: "11px", fontFamily: "var(--font-mono)" }}
              >
                Get started
              </span>
              <h2
                className="text-white font-bold mt-4 mb-6 leading-tight"
                style={{ fontSize: "clamp(2.2rem, 5vw, 4.5rem)" }}
              >
                Ready to land
                <br />
                <span className="text-[#4ade80]">your dream job?</span>
              </h2>
              <p className="text-white/45 text-lg mb-10 max-w-lg leading-relaxed">
                Join 50,000+ professionals who&apos;ve built winning, ATS-optimized resumes with ResumeAI.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#0f1f18] font-bold rounded-full text-[15px] hover:bg-[#4ade80] hover:text-[#0f1f18] transition-colors duration-200 shadow-xl shadow-black/30"
              >
                Start Building Free
                <span>→</span>
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-[#0a1a12] border-t border-white/[0.06] py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="font-bold text-white/70">
            Resume<span className="text-[#4ade80]">AI</span>
          </span>
          <p className="text-white/30" style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}>
            © 2026 ResumeAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
