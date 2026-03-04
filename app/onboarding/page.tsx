"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!session?.accessToken) return;
      try {
        const res = await fetch("python/user/status", {
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
            Resume<span className="text-[#2d6a4f]">AI</span>
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

      {/* Form Content */}
      <div className="px-6 pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
            {renderForm()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
