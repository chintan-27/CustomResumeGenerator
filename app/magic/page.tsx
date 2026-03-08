"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import JobInputStep from "@/components/magic/JobInputStep";
import TemplateSelector, { PREVIEWS } from "@/components/magic/TemplateSelector";
import SelectContentStep, { ScoredExperience, ScoredProject } from "@/components/magic/SelectContentStep";
import QuestionsStep from "@/components/magic/QuestionsStep";
import { ContentReview } from "@/components/magic/ReviewAndDownload";
import ResumeEditor, { UserProfile, EducationEntry } from "@/components/magic/ResumeEditor";
import Link from "next/link";

const getBackendUrl = () => {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    return "http://127.0.0.1:5328/api";
  }
  return "/python";
};

type GenerationStep =
  | "job-input"
  | "analyzing"
  | "select-template"
  | "select-content"
  | "questions"
  | "generating"
  | "review-download";

const STEPS = [
  { id: "job-input",       label: "Job",      num: 1 },
  { id: "select-template", label: "Template", num: 2 },
  { id: "select-content",  label: "Select",   num: 3 },
  { id: "questions",       label: "Details",  num: 4 },
  { id: "review-download", label: "Review",   num: 5 },
];

const STEP_TITLES: Partial<Record<GenerationStep, string>> = {
  "job-input": "Paste Job Description",
  "analyzing": "Analyzing…",
  "select-template": "Choose Template",
  "select-content": "Select Content",
  "questions": "Add Details",
  "generating": "Crafting Resume…",
  "review-download": "Review & Download",
};

interface JobAnalysis {
  job_title: string;
  job_field: string;
  years_required: number;
  required_skills: string[];
  preferred_skills: string[];
  keywords: string[];
  key_responsibilities: string[];
}

interface Question {
  id: number;
  question_type: string;
  target_entity: string;
  target_id: number;
  question_text: string;
  input_type: string;
  options?: string[];
  context?: string;
  target_name?: string;
}

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

const TEMPLATE_NAMES: Record<string, string> = {
  jake: "Jake's Resume",
  modern: "Modern Blue",
  minimal: "Minimal",
  "skills-first": "Skills First",
  executive: "Executive",
  "ats-clean": "ATS Clean",
};

const MagicPage: React.FC = () => {
  const { data: session } = useSession();

  const [currentStep, setCurrentStep] = useState<GenerationStep>("job-input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [jobAnalysis, setJobAnalysis] = useState<JobAnalysis | null>(null);

  const [scoredExperiences, setScoredExperiences] = useState<ScoredExperience[]>([]);
  const [scoredProjects, setScoredProjects] = useState<ScoredProject[]>([]);

  const [templateId, setTemplateId] = useState<string>("jake");
  const [pageCount, setPageCount] = useState<number>(1);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionExperiences, setQuestionExperiences] = useState<{ id: number; position: string; company: string }[]>([]);
  const [questionProjects, setQuestionProjects] = useState<{ id: number; name: string }[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [skillsOrganized, setSkillsOrganized] = useState<Record<string, string[]>>({});

  const [pdfUrl, setPdfUrl] = useState("");
  const [latexContent, setLatexContent] = useState("");

  // Lifted state for live right-panel
  const [reviews, setReviews] = useState<Record<string, ContentReview>>({});
  const [contentSelection, setContentSelection] = useState({ expCount: 0, projCount: 0 });

  // User profile + education for ResumeEditor header
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [education, setEducation] = useState<EducationEntry[]>([]);

  useEffect(() => {
    if (!session?.accessToken) return;
    fetch("/python/user/dashboard", {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) setUserProfile(data.profile);
        if (data.education) setEducation(data.education);
      })
      .catch(() => {});
  }, [session?.accessToken]);

  /* ── Step handlers ──────────────────────────────────────────────────────── */
  const handleAnalyze = async () => {
    if (!session?.accessToken) { setError("Please log in to continue"); return; }
    setLoading(true);
    setError("");
    setCurrentStep("analyzing");
    try {
      const res = await fetch("/python/resume/start-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({ job_description: jobDescription }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to analyze"); }
      const data = await res.json();
      setSessionId(data.session_id);
      setJobAnalysis(data.job_analysis);
      setScoredExperiences(data.experiences || []);
      setScoredProjects(data.projects || []);
      setCurrentStep("select-template");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setCurrentStep("job-input");
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (tid: string, pc: number) => {
    setTemplateId(tid);
    setPageCount(pc);
    setCurrentStep("select-content");
  };

  const handleContentSelect = async (
    selectedExpIds: number[],
    selectedProjIds: number[],
    comments: Record<string, string>
  ) => {
    if (!sessionId || !session?.accessToken) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/python/resume/select-content", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({ session_id: sessionId, selected_experience_ids: selectedExpIds, selected_project_ids: selectedProjIds, comments }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to save selection"); }
      const data = await res.json();
      setQuestions(data.questions || []);
      setQuestionExperiences(data.experiences || []);
      setQuestionProjects(data.projects || []);
      setCurrentStep("questions");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswersSubmit = async () => {
    if (!sessionId || !session?.accessToken) return;
    setLoading(true);
    setError("");
    try {
      const answerRes = await fetch("/python/resume/answer-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({ session_id: sessionId, answers }),
      });
      if (!answerRes.ok) throw new Error("Failed to save answers");
      setCurrentStep("generating");
      const backendUrl = getBackendUrl();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);
      try {
        const draftRes = await fetch(`${backendUrl}/resume/generate-draft`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` },
          body: JSON.stringify({ session_id: sessionId }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!draftRes.ok) throw new Error("Failed to generate content");
        const draftData = await draftRes.json();
        setGeneratedContent(draftData.generated_content);
        setSkillsOrganized(draftData.skills_organized);
        setReviews({});
        setCurrentStep("review-download");
      } catch (fetchErr: unknown) {
        clearTimeout(timeoutId);
        if (fetchErr instanceof Error && fetchErr.name === "AbortError")
          throw new Error("Generation timed out. Please try again.");
        throw fetchErr;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setCurrentStep("questions");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async (reviewList: { content_id?: number; approved: boolean; edited_text?: string }[]) => {
    if (!sessionId || !session?.accessToken) return;
    setLoading(true);
    setError("");
    const backendUrl = getBackendUrl();
    try {
      const reviewRes = await fetch("/python/resume/review-content", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({ session_id: sessionId, reviews: reviewList }),
      });
      if (!reviewRes.ok) throw new Error("Failed to save reviews");
      const optRes = await fetch(`${backendUrl}/resume/select-options`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({ session_id: sessionId, template_id: templateId, page_count: pageCount }),
      });
      if (!optRes.ok) throw new Error("Failed to save options");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);
      try {
        const finalRes = await fetch(`${backendUrl}/resume/finalize`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` },
          body: JSON.stringify({ session_id: sessionId }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!finalRes.ok) {
          const errData = await finalRes.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to generate PDF");
        }
        const finalData = await finalRes.json();
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5328";
        setPdfUrl(`${baseUrl}/${finalData.pdf_url}`);
        setLatexContent(finalData.latex_content);
      } catch (fetchErr: unknown) {
        clearTimeout(timeoutId);
        if (fetchErr instanceof Error && fetchErr.name === "AbortError")
          throw new Error("PDF generation timed out. Please try again.");
        throw fetchErr;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDFFromReviews = () => {
    const list = Object.entries(reviews).map(([idx, r]) => ({
      content_id: parseInt(idx),
      ...r,
    }));
    handleGeneratePDF(list);
  };

  const handleBack = () => {
    const order: GenerationStep[] = ["job-input", "select-template", "select-content", "questions", "review-download"];
    const idx = order.indexOf(currentStep);
    if (idx > 0) setCurrentStep(order[idx - 1]);
  };

  const handleStartOver = () => {
    setCurrentStep("job-input");
    setSessionId(null);
    setJobDescription("");
    setJobAnalysis(null);
    setScoredExperiences([]);
    setScoredProjects([]);
    setTemplateId("jake");
    setPageCount(1);
    setQuestions([]);
    setAnswers({});
    setGeneratedContent([]);
    setSkillsOrganized({});
    setPdfUrl("");
    setLatexContent("");
    setReviews({});
    setError("");
  };

  /* ── Step indicator mapping ─────────────────────────────────────────────── */
  const displayStep =
    currentStep === "analyzing" ? "job-input" :
    currentStep === "generating" ? "questions" :
    currentStep;
  const activeStepIdx = STEPS.findIndex((s) => s.id === displayStep);

  const navigateToStep = (stepId: string) => {
    const order: GenerationStep[] = ["job-input", "select-template", "select-content", "questions", "review-download"];
    const targetIdx = order.indexOf(stepId as GenerationStep);
    const currentIdx = order.indexOf(displayStep as GenerationStep);
    if (targetIdx < currentIdx) setCurrentStep(stepId as GenerationStep);
  };

  /* ── Center panel ───────────────────────────────────────────────────────── */
  const renderStep = () => {
    switch (currentStep) {
      case "job-input":
        return (
          <JobInputStep
            jobDescription={jobDescription}
            setJobDescription={setJobDescription}
            onAnalyze={handleAnalyze}
            loading={loading}
            error={error}
          />
        );

      case "analyzing":
        return (
          <div className="flex flex-col items-center justify-center h-full py-16">
            <div className="w-10 h-10 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin mb-6" />
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-2">Analyzing Job Description</h2>
            <p className="text-[#6b7280] text-sm text-center max-w-md">
              Extracting keywords, requirements, and scoring your experiences…
            </p>
          </div>
        );

      case "select-template":
        return (
          <TemplateSelector
            onSelect={handleTemplateSelect}
            onBack={handleBack}
            compact
          />
        );

      case "select-content":
        return (
          <SelectContentStep
            experiences={scoredExperiences}
            projects={scoredProjects}
            pageCount={pageCount}
            selectedTemplateId={templateId}
            onSubmit={handleContentSelect}
            onBack={handleBack}
            loading={loading}
            hideRightSidebar
            onSelectionChange={(e, p) => setContentSelection({ expCount: e, projCount: p })}
          />
        );

      case "questions":
        return (
          <QuestionsStep
            questions={questions}
            experiences={questionExperiences}
            projects={questionProjects}
            answers={answers}
            setAnswers={setAnswers}
            onSubmit={handleAnswersSubmit}
            onBack={handleBack}
            loading={loading}
          />
        );

      case "generating":
        return (
          <div className="flex flex-col items-center justify-center h-full py-16">
            <div className="relative mb-6">
              <div className="w-12 h-12 border-2 border-stone-200 rounded-full" />
              <div className="absolute inset-0 w-12 h-12 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-2">Crafting Your Resume</h2>
            <p className="text-[#6b7280] text-sm text-center max-w-md">
              Generating ATS-optimized bullet points grounded in your actual experience…
            </p>
            <div className="mt-6 flex flex-col gap-2 w-full max-w-xs">
              {["Analyzing your experience", "Matching job keywords", "Writing bullet points", "Organizing skills"].map((label, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 border border-[#2d6a4f]/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-1 h-1 rounded-full bg-[#2d6a4f] animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                  </div>
                  <span className="text-xs text-stone-400" style={{ fontFamily: "var(--font-mono)" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "review-download":
        return (
          <ResumeEditor
            generatedContent={generatedContent}
            skillsOrganized={skillsOrganized}
            jobKeywords={jobAnalysis?.keywords || []}
            templateId={templateId}
            userName={session?.user?.name ?? undefined}
            userProfile={userProfile ?? undefined}
            education={education}
            onReviewsChange={setReviews}
          />
        );

      default:
        return null;
    }
  };

  /* ── Right panel ────────────────────────────────────────────────────────── */
  const renderRightPanel = () => {
    const TemplatePreview = PREVIEWS[templateId] ?? PREVIEWS.jake;

    if (currentStep === "review-download") {
      const TEMPLATE_IDS = ["jake", "modern", "minimal", "skills-first", "executive", "ats-clean"];
      return (
        <div className="flex flex-col h-full overflow-y-auto px-4 py-5 gap-5">
          {/* Template switcher */}
          <div>
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-2" style={{ fontFamily: "var(--font-mono)" }}>
              Template
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {TEMPLATE_IDS.map((tid) => {
                const Preview = PREVIEWS[tid];
                const isActive = templateId === tid;
                return (
                  <button
                    key={tid}
                    onClick={() => setTemplateId(tid)}
                    className={`rounded-lg border-2 overflow-hidden transition-all ${isActive ? "border-[#2d6a4f] shadow-md" : "border-stone-200 hover:border-stone-300"}`}
                    title={TEMPLATE_NAMES[tid]}
                  >
                    <div className="aspect-[8.5/11] p-1 bg-white">
                      <Preview />
                    </div>
                    <div className={`text-[8px] py-0.5 text-center font-medium truncate px-1 ${isActive ? "bg-[#2d6a4f] text-white" : "bg-stone-50 text-stone-400"}`}
                      style={{ fontFamily: "var(--font-mono)" }}>
                      {TEMPLATE_NAMES[tid]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Page count toggle */}
          <div>
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-2" style={{ fontFamily: "var(--font-mono)" }}>
              Pages
            </p>
            <div className="flex gap-2">
              {[1, 2].map((n) => (
                <button
                  key={n}
                  onClick={() => setPageCount(n)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${pageCount === n ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "bg-white text-stone-500 border-stone-200 hover:border-stone-300"}`}
                >
                  {n}-page
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 mt-auto">
            {pdfUrl ? (
              <>
                <a
                  href={pdfUrl}
                  download
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#2d6a4f] hover:bg-[#1e4d38] text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  Download PDF
                </a>
                <button
                  onClick={handleGeneratePDFFromReviews}
                  disabled={loading}
                  className="w-full py-2 bg-white hover:bg-stone-50 text-[#1a1a1a] text-sm font-semibold rounded-xl border border-stone-200 transition-colors disabled:opacity-50"
                >
                  {loading ? "Regenerating…" : "Regenerate PDF"}
                </button>
              </>
            ) : (
              <button
                onClick={handleGeneratePDFFromReviews}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#1a1a1a] hover:bg-[#2d6a4f] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate PDF
                  </>
                )}
              </button>
            )}
            <button
              onClick={handleStartOver}
              className="w-full py-2 text-stone-400 hover:text-stone-600 text-xs font-medium transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      );
    }

    if (currentStep === "generating") {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
          <div className="w-full space-y-3">
            {[90, 70, 85, 60, 75, 55, 80].map((w, i) => (
              <div
                key={i}
                className="rounded animate-pulse bg-stone-100"
                style={{ height: 8, width: `${w}%`, animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <p className="text-xs text-stone-400 text-center" style={{ fontFamily: "var(--font-mono)" }}>
            Building your resume…
          </p>
        </div>
      );
    }

    if (currentStep === "questions") {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
          <div className="w-full space-y-3">
            {[85, 65, 90, 55, 70, 80, 60].map((w, i) => (
              <div key={i} className="rounded bg-stone-100" style={{ height: 7, width: `${w}%` }} />
            ))}
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-stone-400" style={{ fontFamily: "var(--font-mono)" }}>
              Template: {TEMPLATE_NAMES[templateId] || templateId}
            </p>
            <p className="text-xs text-stone-300 mt-0.5">{pageCount}-page resume</p>
          </div>
        </div>
      );
    }

    if (currentStep === "job-input" || currentStep === "analyzing") {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-5 px-6">
          <div className="w-full bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="bg-stone-50 border-b border-stone-200 px-3 py-2 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-400/60" />
              <div className="w-2 h-2 rounded-full bg-amber-400/60" />
              <div className="w-2 h-2 rounded-full bg-green-400/60" />
            </div>
            <div className="p-4 space-y-2">
              {[85, 65, 75, 90, 55, 70, 60, 80, 65, 72].map((w, i) => (
                <div key={i} className="rounded bg-stone-100" style={{ height: 6, width: `${w}%` }} />
              ))}
            </div>
          </div>
          <p className="text-xs text-stone-400 text-center leading-relaxed" style={{ fontFamily: "var(--font-mono)" }}>
            Your resume preview builds here as you complete each step
          </p>
        </div>
      );
    }

    // select-template / select-content
    return (
      <div className="flex flex-col items-start justify-start h-full px-4 pt-5 gap-4">
        {/* Template SVG preview */}
        <div className="w-full bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="p-3 aspect-[8.5/11]">
            <TemplatePreview />
          </div>
        </div>

        <div className="w-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400" style={{ fontFamily: "var(--font-mono)" }}>Template</span>
            <span className="text-xs font-semibold text-[#1a1a1a]">{TEMPLATE_NAMES[templateId] || templateId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400" style={{ fontFamily: "var(--font-mono)" }}>Pages</span>
            <span className="text-xs font-semibold text-[#1a1a1a]">{pageCount}</span>
          </div>
          {currentStep === "select-content" && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400" style={{ fontFamily: "var(--font-mono)" }}>Experience</span>
                <span className={`text-xs font-semibold ${contentSelection.expCount === 0 ? "text-red-500" : "text-[#2d6a4f]"}`}>
                  {contentSelection.expCount} selected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400" style={{ fontFamily: "var(--font-mono)" }}>Projects</span>
                <span className="text-xs font-semibold text-[#2d6a4f]">{contentSelection.projCount} selected</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div style={{ height: "100dvh" }} className="flex flex-col overflow-hidden bg-[#faf9f6]">
      {/* Compact header */}
      <header className="flex-shrink-0 h-12 bg-white border-b border-stone-200 flex items-center px-4 gap-4 z-20">
        <Link href="/dashboard" className="font-bold text-base leading-none">
          Pari<span className="text-[#2d6a4f]">chaya</span>
        </Link>
        <span className="text-stone-200">|</span>
        <span className="text-sm text-stone-500 truncate" style={{ fontFamily: "var(--font-mono)" }}>
          {STEP_TITLES[currentStep] ?? "AI Resume Studio"}
        </span>
        <div className="ml-auto">
          <span
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#2d6a4f]/10 text-[#2d6a4f] rounded-full text-xs font-semibold"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f]" />
            2026
          </span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Step rail — hidden on mobile */}
        <nav className="hidden lg:flex w-16 flex-shrink-0 flex-col items-center py-4 gap-1 bg-white border-r border-stone-200">
          {STEPS.map((s, idx) => {
            const isActive = s.id === displayStep;
            const isDone = activeStepIdx > idx;
            const isClickable = isDone;
            return (
              <button
                key={s.id}
                onClick={() => isClickable && navigateToStep(s.id)}
                disabled={!isClickable}
                className={`flex flex-col items-center gap-0.5 py-2 w-full transition-colors ${isClickable ? "cursor-pointer hover:bg-stone-50" : "cursor-default"}`}
                title={s.label}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isDone
                      ? "bg-[#2d6a4f] text-white"
                      : isActive
                      ? "bg-white border-2 border-[#2d6a4f] text-[#2d6a4f]"
                      : "bg-white border-2 border-stone-200 text-stone-300"
                  }`}
                >
                  {isDone ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5 3.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : s.num}
                </div>
                <span
                  className={`text-[9px] leading-tight transition-colors ${isActive ? "text-[#2d6a4f] font-semibold" : isDone ? "text-[#2d6a4f]" : "text-stone-300"}`}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {s.label}
                </span>
                {idx < STEPS.length - 1 && (
                  <div className={`w-px h-3 rounded-full mt-0.5 transition-colors ${isDone ? "bg-[#2d6a4f]" : "bg-stone-200"}`} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Mobile top stepper */}
        <div className="lg:hidden absolute top-12 left-0 right-0 z-10 bg-white border-b border-stone-200 px-4 py-2">
          <div className="flex items-center gap-1">
            {STEPS.map((s, idx) => {
              const isActive = s.id === displayStep;
              const isDone = activeStepIdx > idx;
              return (
                <React.Fragment key={s.id}>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isDone ? "bg-[#2d6a4f] text-white" : isActive ? "bg-white border-2 border-[#2d6a4f] text-[#2d6a4f]" : "bg-white border-2 border-stone-200 text-stone-300"
                    }`}
                  >
                    {isDone ? (
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5 3.5-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : s.num}
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`flex-1 h-px transition-colors ${isDone ? "bg-[#2d6a4f]" : "bg-stone-200"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Center panel — scrollable content */}
        <main className={`flex-1 min-w-0 ${currentStep === "review-download" ? "overflow-hidden bg-stone-200 p-0" : "overflow-y-auto bg-white px-6 py-5 lg:pt-5 pt-14"}`}>
          {renderStep()}
        </main>

        {/* Right panel — hidden on mobile */}
        <aside className="hidden lg:flex w-[380px] flex-shrink-0 flex-col border-l border-stone-200 bg-[#faf9f6] overflow-hidden">
          {renderRightPanel()}
        </aside>
      </div>

      {/* Error toast */}
      {error && currentStep !== "job-input" && (
        <div className="fixed bottom-6 right-6 max-w-sm z-50">
          <div className="bg-white rounded-2xl border border-red-200 shadow-lg shadow-red-500/10 p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <span className="text-red-500 font-bold text-sm">!</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#1a1a1a] text-sm">Error</p>
              <p className="text-sm text-[#6b7280] mt-0.5 leading-relaxed">{error}</p>
            </div>
            <button onClick={() => setError("")} className="text-stone-300 hover:text-stone-600 font-bold text-lg leading-none flex-shrink-0 mt-0.5">×</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MagicPage;
