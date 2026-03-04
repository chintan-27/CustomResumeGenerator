"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import JobInputStep from "@/components/magic/JobInputStep";
import QuestionsStep from "@/components/magic/QuestionsStep";
import ContentReviewStep from "@/components/magic/ContentReviewStep";
import TemplateSelector from "@/components/magic/TemplateSelector";
import FinalPreview from "@/components/magic/FinalPreview";
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
  | "questions"
  | "generating"
  | "review-content"
  | "select-template"
  | "complete";

const STEPS = [
  { id: "job-input", label: "Job", num: 1 },
  { id: "questions", label: "Details", num: 2 },
  { id: "review-content", label: "Review", num: 3 },
  { id: "select-template", label: "Template", num: 4 },
  { id: "complete", label: "Download", num: 5 },
];

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

interface Experience {
  id: number;
  position: string;
  company: string;
  description?: string;
}

interface Project {
  id: number;
  name: string;
  description?: string;
}

interface GeneratedContent {
  type: string;
  target_id: number;
  target_name: string;
  position?: string;
  original_text: string;
  generated_text: string;
  keywords_used: string[];
  grounding_source: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  ats_compliant: boolean;
  preview_image?: string;
}

const MagicPage: React.FC = () => {
  const { data: session } = useSession();

  const [currentStep, setCurrentStep] = useState<GenerationStep>("job-input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [jobAnalysis, setJobAnalysis] = useState<JobAnalysis | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [skillsOrganized, setSkillsOrganized] = useState<Record<string, string[]>>({});

  const [templates, setTemplates] = useState<Template[]>([]);
  const [pdfUrl, setPdfUrl] = useState("");
  const [latexContent, setLatexContent] = useState("");
  const [templateUsed, setTemplateUsed] = useState("");

  useEffect(() => {
    if (session?.accessToken) fetchTemplates();
  }, [session]);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/python/templates", {
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates);
      }
    } catch (err) { console.error("Error fetching templates:", err); }
  };

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
      setQuestions(data.questions);
      setExperiences(data.experiences);
      setProjects(data.projects);
      setCurrentStep("questions");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setCurrentStep("job-input");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswersSubmit = async () => {
    if (!sessionId) return;
    setLoading(true);
    setError("");
    try {
      const answerRes = await fetch("/python/resume/answer-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.accessToken}` },
        body: JSON.stringify({ session_id: sessionId, answers }),
      });
      if (!answerRes.ok) throw new Error("Failed to save answers");
      setCurrentStep("generating");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);
      const backendUrl = getBackendUrl();
      try {
        const draftRes = await fetch(`${backendUrl}/resume/generate-draft`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.accessToken}` },
          body: JSON.stringify({ session_id: sessionId }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!draftRes.ok) throw new Error("Failed to generate content");
        const draftData = await draftRes.json();
        setGeneratedContent(draftData.generated_content);
        setSkillsOrganized(draftData.skills_organized);
        setCurrentStep("review-content");
      } catch (fetchErr: unknown) {
        clearTimeout(timeoutId);
        if (fetchErr instanceof Error && fetchErr.name === "AbortError") throw new Error("Generation timed out. Please try again.");
        throw fetchErr;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setCurrentStep("questions");
    } finally {
      setLoading(false);
    }
  };

  const handleContentReview = async (reviews: { content_id?: number; approved: boolean; edited_text?: string }[]) => {
    if (!sessionId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/python/resume/review-content", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.accessToken}` },
        body: JSON.stringify({ session_id: sessionId, reviews }),
      });
      if (!res.ok) throw new Error("Failed to save reviews");
      setCurrentStep("select-template");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = async (templateId: string, pageCount: number) => {
    if (!sessionId) return;
    setLoading(true);
    setError("");
    const backendUrl = getBackendUrl();
    try {
      const optRes = await fetch(`${backendUrl}/resume/select-options`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.accessToken}` },
        body: JSON.stringify({ session_id: sessionId, template_id: templateId, page_count: pageCount }),
      });
      if (!optRes.ok) throw new Error("Failed to save options");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);
      try {
        const finalRes = await fetch(`${backendUrl}/resume/finalize`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.accessToken}` },
          body: JSON.stringify({ session_id: sessionId }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!finalRes.ok) throw new Error("Failed to generate final resume");
        const finalData = await finalRes.json();
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5328";
        setPdfUrl(`${baseUrl}/${finalData.pdf_url}`);
        setLatexContent(finalData.latex_content);
        setTemplateUsed(templates.find((t) => t.id === templateId)?.name || templateId);
        setCurrentStep("complete");
      } catch (fetchErr: unknown) {
        clearTimeout(timeoutId);
        if (fetchErr instanceof Error && fetchErr.name === "AbortError") throw new Error("PDF generation timed out. Please try again.");
        throw fetchErr;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    const order: GenerationStep[] = ["job-input", "questions", "review-content", "select-template", "complete"];
    const idx = order.indexOf(currentStep);
    if (idx > 0) setCurrentStep(order[idx - 1]);
  };

  const handleStartOver = () => {
    setCurrentStep("job-input");
    setSessionId(null);
    setJobDescription("");
    setJobAnalysis(null);
    setQuestions([]);
    setAnswers({});
    setGeneratedContent([]);
    setSkillsOrganized({});
    setPdfUrl("");
    setLatexContent("");
    setError("");
  };

  const displayStep =
    currentStep === "analyzing" ? "job-input" : currentStep === "generating" ? "questions" : currentStep;

  const activeStepIdx = STEPS.findIndex((s) => s.id === displayStep);

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
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin mb-8" />
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-3">Analyzing Job Description</h2>
            <p className="text-[#6b7280] text-center max-w-md text-sm leading-relaxed">
              Extracting keywords, requirements, and generating personalized questions...
            </p>
            {jobAnalysis && (
              <div className="mt-8 bg-white rounded-2xl border border-stone-200 p-6 max-w-sm w-full shadow-sm">
                <p className="text-xs uppercase tracking-widest text-stone-400 mb-3" style={{ fontFamily: "var(--font-mono)" }}>
                  Detected
                </p>
                <p className="text-sm mb-1">
                  <span className="font-semibold">Field:</span> {jobAnalysis.job_field}
                </p>
                <p className="text-sm mb-4">
                  <span className="font-semibold">Experience:</span> {jobAnalysis.years_required}+ years
                </p>
                <div className="flex flex-wrap gap-2">
                  {jobAnalysis.keywords.slice(0, 6).map((kw, i) => (
                    <span key={i} className="px-2.5 py-1 bg-[#2d6a4f]/10 text-[#2d6a4f] rounded-full text-xs font-medium" style={{ fontFamily: "var(--font-mono)" }}>
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "questions":
        return (
          <QuestionsStep
            questions={questions}
            experiences={experiences}
            projects={projects}
            answers={answers}
            setAnswers={setAnswers}
            onSubmit={handleAnswersSubmit}
            onBack={handleBack}
            loading={loading}
          />
        );

      case "generating":
        return (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative mb-8">
              <div className="w-16 h-16 border-2 border-stone-200 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-3">Crafting Your Resume</h2>
            <p className="text-[#6b7280] text-center max-w-md text-sm leading-relaxed">
              Generating ATS-optimized bullet points grounded in your actual experience...
            </p>
            <div className="mt-8 flex flex-col gap-2 w-full max-w-sm">
              {["Analyzing your experience", "Matching job keywords", "Writing bullet points", "Organizing skills"].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-4 h-4 border border-[#2d6a4f]/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f] animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                  </div>
                  <span className="text-sm text-stone-400" style={{ fontFamily: "var(--font-mono)" }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "review-content":
        return (
          <ContentReviewStep
            generatedContent={generatedContent}
            skillsOrganized={skillsOrganized}
            onSubmit={handleContentReview}
            onBack={handleBack}
            loading={loading}
          />
        );

      case "select-template":
        return (
          <TemplateSelector
            templates={templates}
            onSubmit={handleTemplateSelect}
            onBack={handleBack}
            loading={loading}
          />
        );

      case "complete":
        return (
          <FinalPreview
            pdfUrl={pdfUrl}
            latexContent={latexContent}
            templateUsed={templateUsed}
            onStartOver={handleStartOver}
            onBack={handleBack}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="font-bold text-xl">
              Resume<span className="text-[#2d6a4f]">AI</span>
            </Link>
            <span className="hidden sm:block text-stone-300">|</span>
            <span className="hidden sm:block text-sm text-stone-400" style={{ fontFamily: "var(--font-mono)" }}>
              AI Resume Studio
            </span>
          </div>
          <span className="flex items-center gap-2 px-3 py-1.5 bg-[#2d6a4f]/10 text-[#2d6a4f] rounded-full text-xs font-semibold" style={{ fontFamily: "var(--font-mono)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f]" />
            2026 Best Practices
          </span>
        </div>

        {/* Step progress */}
        <div className="max-w-5xl mx-auto px-6 pb-3">
          <div className="flex items-center gap-1">
            {STEPS.map((s, idx) => {
              const isActive = s.id === displayStep;
              const isDone = activeStepIdx > idx;
              return (
                <React.Fragment key={s.id}>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
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
                      ) : (
                        s.num
                      )}
                    </div>
                    <span
                      className={`hidden sm:block text-xs transition-colors ${
                        isActive ? "text-[#1a1a1a] font-semibold" : isDone ? "text-[#2d6a4f]" : "text-stone-300"
                      }`}
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {s.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`flex-1 h-px transition-colors duration-300 ${isDone ? "bg-[#2d6a4f]" : "bg-stone-200"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-10 pb-24">
        {renderStep()}
      </div>

      {/* Error Toast */}
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
            <button
              onClick={() => setError("")}
              className="text-stone-300 hover:text-stone-600 font-bold text-lg leading-none flex-shrink-0 mt-0.5"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MagicPage;
