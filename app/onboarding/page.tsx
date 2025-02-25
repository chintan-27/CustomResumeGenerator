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

const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    personalInfo: {},
    education: [],
    experience: [],
    projects: [],
    skills: {}, 
  });
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!session?.accessToken) return;

      try {
        const response = await fetch(`python/user/status`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        const data = await response.json();
        if (data.onboarding_completed) {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Failed to check onboarding status:", error);
      }
    };

    checkOnboardingStatus();
  }, [session, router]);

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleDataChange = (section: string, data: any) => {
    setFormData({ ...formData, [section]: data });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
      <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-md">
        {step === 1 && <PersonalInfoForm nextStep={nextStep} onChange={(data) => handleDataChange("personalInfo", data)} />}
        {step === 2 && <EducationForm nextStep={nextStep} prevStep={prevStep} onChange={(data) => handleDataChange("education", data)} />}
        {step === 3 && <ExperienceForm nextStep={nextStep} prevStep={prevStep} onChange={(data) => handleDataChange("experience", data)} />}
        {step === 4 && <ProjectForm nextStep={nextStep} prevStep={prevStep} onChange={(data) => handleDataChange("projects", data)} />} 
        {step === 5 && <SkillForm nextStep={nextStep} prevStep={prevStep} onChange={(data) => handleDataChange("skills", data)} />}
        {step === 6 && <Summary formData={formData} prevStep={prevStep} />}
      </div>
    </div>
  );
};

export default Onboarding;
