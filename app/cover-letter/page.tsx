"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import CoverLetterInput from "@/components/cover-letter/CoverLetterInput";
import CoverLetterReview from "@/components/cover-letter/CoverLetterReview";
import CoverLetterPreview from "@/components/cover-letter/CoverLetterPreview";

type Step = "input" | "review" | "preview";

export default function CoverLetterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<Step>("input");
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [finalContent, setFinalContent] = useState("");
  const [error, setError] = useState("");

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const handleGenerate = async (data: { jobDescription: string; tone: string; highlights: string }) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/python/cover-letter/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Generation failed");
      setGeneratedContent(json.cover_letter);
      setStep("review");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = (text: string) => {
    setFinalContent(text);
    setStep("preview");
  };

  const STEP_ORDER: Step[] = ["input", "review", "preview"];
  const stepIndex = STEP_ORDER.indexOf(step);

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {/* Top nav */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-stone-200 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-lg text-[#1a1a1a]">
          Pari<span className="text-[#2d6a4f]">chaya</span>
        </Link>
        <div className="flex items-center gap-4">
          {/* Step dots */}
          <div className="flex items-center gap-2">
            {["Input", "Review", "Done"].map((label, i) => (
              <React.Fragment key={label}>
                <div className={`flex items-center gap-1.5 ${i <= stepIndex ? "text-[#2d6a4f]" : "text-stone-300"}`}>
                  <div className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                    i < stepIndex
                      ? "bg-[#2d6a4f] text-white"
                      : i === stepIndex
                      ? "border-2 border-[#2d6a4f] text-[#2d6a4f]"
                      : "border-2 border-stone-200 text-stone-300"
                  }`}>
                    {i < stepIndex ? "✓" : i + 1}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{label}</span>
                </div>
                {i < 2 && <div className={`w-6 h-px ${i < stepIndex ? "bg-[#2d6a4f]" : "bg-stone-200"}`} />}
              </React.Fragment>
            ))}
          </div>
          <Link href="/dashboard" className="text-sm text-[#6b7280] hover:text-[#1a1a1a] transition-colors">
            ← Dashboard
          </Link>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 py-10">
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
          >
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 md:p-8">
              {step === "input" && (
                <CoverLetterInput onGenerate={handleGenerate} loading={loading} />
              )}
              {step === "review" && (
                <CoverLetterReview
                  content={generatedContent}
                  onConfirm={handleConfirm}
                  onBack={() => setStep("input")}
                />
              )}
              {step === "preview" && (
                <CoverLetterPreview
                  content={finalContent}
                  onRestart={() => { setStep("input"); setGeneratedContent(""); setFinalContent(""); }}
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
