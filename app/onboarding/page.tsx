"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import PersonalInfoForm from "@/components/forms/PersonalInfoForm";
import EducationForm from "@/components/forms/EducationForm";
import ExperienceForm from "@/components/forms/ExperienceForm";
import ProjectForm from "@/components/forms/ProjectForm";
import SkillForm from "@/components/forms/SkillForm";
import Summary from "@/components/forms/Summary";
import { useSession } from "next-auth/react";
import Link from "next/link";

const STEPS = [
  { id: 1, label: "Personal" },
  { id: 2, label: "Education" },
  { id: 3, label: "Experience" },
  { id: 4, label: "Projects" },
  { id: 5, label: "Skills" },
  { id: 6, label: "Review" },
];

const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    personalInfo: {},
    education: [],
    experience: [],
    projects: [],
    skills: [],
  });

  const { data: session } = useSession();
  const router = useRouter();
  const [linkedinEduText, setLinkedinEduText] = useState("");
  const [linkedinExpText, setLinkedinExpText] = useState("");
  const [linkedinOpen, setLinkedinOpen] = useState(false);
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [linkedinError, setLinkedinError] = useState("");
  const [linkedinSuccess, setLinkedinSuccess] = useState("");
  const [eduDone, setEduDone] = useState(false);
  const [expDone, setExpDone] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!session?.accessToken) return;
      try {
        const res = await fetch("/python/user/status", {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const data = await res.json();
        if (data.onboarding_completed) router.push("/dashboard");
      } catch (error) {
        console.error("Failed to check onboarding status:", error);
      }
    };
    checkOnboardingStatus();
  }, [session, router]);

  const normalizeEducation = (arr: any[]) => arr.map((e: any) => ({
    university: e.university || "",
    degree: e.degree || "",
    major: e.major || "",
    gpa: e.gpa || "",
    max_gpa: e.max_gpa || "4.0",
    start_date: e.start_date || "",
    end_date: e.end_date || "",
    city: e.city || "",
    state: e.state || "",
    country: e.country || "",
    specialization: e.specialization || "",
    relevantCoursework: e.relevant_coursework
      ? String(e.relevant_coursework).split(",").map((s: string) => s.trim()).filter(Boolean)
      : (e.relevantCoursework || []),
  }));

  const normalizeExperience = (arr: any[]) => arr.map((e: any) => ({
    position: e.position || "",
    company: e.company || "",
    start_date: e.start_date || "",
    end_date: e.current || (e.end_date || "").toLowerCase() === "present" ? "Present" : (e.end_date || ""),
    current: !!e.current || (e.end_date || "").toLowerCase() === "present",
    description: e.description || "",
  }));

  const importFromLinkedIn = async (section: "education" | "experience") => {
    const text = section === "education" ? linkedinEduText : linkedinExpText;
    if (text.trim().length < 30) {
      setLinkedinError(`Please paste your ${section === "education" ? "Education" : "Experience"} section text first.`);
      return;
    }
    setLinkedinLoading(true);
    setLinkedinError("");
    try {
      const body = section === "education"
        ? { section: "education", education_text: text }
        : { section: "experience", experience_text: text };

      const res = await fetch("/python/linkedin/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.accessToken}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Extraction failed");

      const education = normalizeEducation(data.education || []);
      const experience = normalizeExperience(data.experience || []);

      if (section === "education") {
        if (!education.length) throw new Error("No education entries found. Make sure you copied the Education section.");
        handleDataChange("education", education);
        setLinkedinSuccess(`Imported ${education.length} education entr${education.length !== 1 ? "ies" : "y"}.`);
        setLinkedinEduText("");
        setEduDone(true);
      } else {
        if (!experience.length) throw new Error("No experience entries found. Make sure you copied the Experience section.");
        handleDataChange("experience", experience);
        setLinkedinSuccess(`Imported ${experience.length} experience entr${experience.length !== 1 ? "ies" : "y"}.`);
        setLinkedinExpText("");
        setExpDone(true);
      }
    } catch (err: any) {
      setLinkedinError(err.message);
    } finally {
      setLinkedinLoading(false);
    }
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleDataChange = (section: string, data: any) => {
    setFormData((prev) => ({ ...prev, [section]: data }));
  };

  const renderForm = () => {
    switch (step) {
      case 1: return <PersonalInfoForm nextStep={nextStep} onChange={(d) => handleDataChange("personalInfo", d)} initialData={formData.personalInfo} />;
      case 2: return <EducationForm nextStep={nextStep} prevStep={prevStep} onChange={(d) => handleDataChange("education", d)} initialData={formData.education} />;
      case 3: return <ExperienceForm nextStep={nextStep} prevStep={prevStep} onChange={(d) => handleDataChange("experience", d)} initialData={formData.experience} />;
      case 4: return <ProjectForm nextStep={nextStep} prevStep={prevStep} onChange={(d) => handleDataChange("projects", d)} initialData={formData.projects} />;
      case 5: return <SkillForm nextStep={nextStep} prevStep={prevStep} onChange={(d) => handleDataChange("skills", d)} initialData={formData.skills} />;
      case 6: return <Summary formData={formData} prevStep={prevStep} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl">
            Pari<span className="text-[#2d6a4f]">chaya</span>
          </Link>
          <span className="text-xs text-stone-400" style={{ fontFamily: "var(--font-mono)" }}>
            Step {step} of {STEPS.length}
          </span>
        </div>
      </header>

      {/* Stepper */}
      <div className="pt-24 pb-6 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-0">
            {STEPS.map((s, idx) => {
              const isCompleted = s.id < step;
              const isCurrent = s.id === step;

              return (
                <React.Fragment key={s.id}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        isCompleted
                          ? "bg-[#2d6a4f] text-white"
                          : isCurrent
                          ? "bg-white border-2 border-[#2d6a4f] text-[#2d6a4f]"
                          : "bg-white border-2 border-stone-200 text-stone-300"
                      }`}
                    >
                      {isCompleted ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        s.id
                      )}
                    </div>
                    <span
                      className={`text-xs hidden sm:block transition-colors ${
                        isCurrent ? "text-[#1a1a1a] font-semibold" : isCompleted ? "text-[#2d6a4f]" : "text-stone-300"
                      }`}
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {s.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`flex-1 h-px mx-1 mb-5 transition-colors duration-300 ${s.id < step ? "bg-[#2d6a4f]" : "bg-stone-200"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* LinkedIn import panel — shown on Education (2) and Experience (3) steps */}
      {(step === 2 || step === 3) && (
        <div className="px-6 mb-4">
          <div className="max-w-2xl mx-auto">
            {linkedinSuccess && !linkedinOpen && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#2d6a4f]/10 border border-[#2d6a4f]/20 rounded-xl text-sm text-[#2d6a4f] font-medium mb-3">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {linkedinSuccess} Fields pre-filled below — edit as needed.
              </div>
            )}
            <button
              onClick={() => setLinkedinOpen((o) => !o)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#0f1f18] rounded-xl text-sm font-semibold text-white hover:bg-[#162820] transition-colors"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#4ade80]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                Import from LinkedIn
              </span>
              <svg className={`w-4 h-4 text-white/50 transition-transform ${linkedinOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {linkedinOpen && (
              <div className="mt-2 p-4 bg-white border border-stone-200 rounded-xl space-y-3">
                <p className="text-xs text-[#6b7280]">
                  On your LinkedIn profile, scroll to the <strong className="text-[#1a1a1a]">{step === 2 ? "Education" : "Experience"}</strong> section, select that section's text, copy and paste below.
                </p>

                {linkedinError && (
                  <p className="text-xs text-red-500 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {linkedinError}
                  </p>
                )}

                {step === 2 ? (
                  <div className="space-y-2">
                    <textarea
                      rows={5}
                      value={linkedinEduText}
                      onChange={(e) => { setLinkedinEduText(e.target.value); setEduDone(false); }}
                      placeholder="Paste your LinkedIn Education section here…"
                      className="w-full px-3 py-2.5 text-sm text-[#1a1a1a] placeholder-stone-400 bg-stone-50 border border-stone-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] transition-all"
                    />
                    <button
                      onClick={() => importFromLinkedIn("education")}
                      disabled={linkedinLoading || !linkedinEduText.trim()}
                      className={`w-full py-2.5 rounded-full text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2 ${
                        eduDone
                          ? "bg-[#2d6a4f] text-white"
                          : "bg-[#1a1a1a] text-white hover:bg-[#2d6a4f]"
                      }`}
                    >
                      {linkedinLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : eduDone ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : null}
                      {linkedinLoading ? "Extracting…" : eduDone ? "Education imported!" : "Extract Education →"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      rows={5}
                      value={linkedinExpText}
                      onChange={(e) => { setLinkedinExpText(e.target.value); setExpDone(false); }}
                      placeholder="Paste your LinkedIn Experience section here…"
                      className="w-full px-3 py-2.5 text-sm text-[#1a1a1a] placeholder-stone-400 bg-stone-50 border border-stone-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] transition-all"
                    />
                    <button
                      onClick={() => importFromLinkedIn("experience")}
                      disabled={linkedinLoading || !linkedinExpText.trim()}
                      className={`w-full py-2.5 rounded-full text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2 ${
                        expDone
                          ? "bg-[#2d6a4f] text-white"
                          : "bg-[#1a1a1a] text-white hover:bg-[#2d6a4f]"
                      }`}
                    >
                      {linkedinLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : expDone ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : null}
                      {linkedinLoading ? "Extracting…" : expDone ? "Experience imported!" : "Extract Experience →"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Content */}
      <div className="px-6 pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22 }}
              >
                {renderForm()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
