"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";

const Summary = ({ formData, prevStep }: { formData: any; prevStep: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { data: session } = useSession();

  const getSkillsString = () => {
    if (!formData.skills) return "";
    if (typeof formData.skills === "string") return formData.skills;
    if (typeof formData.skills.skills === "string") return formData.skills.skills;
    if (Array.isArray(formData.skills.skills)) return formData.skills.skills.join(", ");
    if (Array.isArray(formData.skills)) return formData.skills.join(", ");
    return "";
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const token = session?.accessToken;
      if (!token) throw new Error("Authentication token is missing");

      const personalInfoResponse = await fetch(`/python/user/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData.personalInfo),
      });
      if (!personalInfoResponse.ok) throw new Error("Failed to submit personal info");

      const educationRequests = (formData.education || []).map((edu: any) =>
        fetch(`/python/user/education`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            ...edu,
            relevant_coursework: Array.isArray(edu.relevantCoursework)
              ? edu.relevantCoursework.join(", ")
              : edu.relevantCoursework || ""
          }),
        })
      );

      const experienceRequests = (formData.experience || []).map((exp: any) =>
        fetch(`/python/user/experience`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(exp),
        })
      );

      const projectRequests = (formData.projects || []).map((proj: any) =>
        fetch(`/python/user/project`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(proj),
        })
      );

      const skillRequest = fetch(`/python/user/skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ skills: getSkillsString() }),
      });

      const certRequests = (formData.certifications || [])
        .filter((c: any) => c.name?.trim())
        .map((c: any) =>
          fetch(`/python/certifications`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(c),
          })
        );

      const pubRequests = (formData.publications || [])
        .filter((p: any) => p.title?.trim())
        .map((p: any) =>
          fetch(`/python/publications`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(p),
          })
        );

      await Promise.all([...educationRequests, ...experienceRequests, ...projectRequests, skillRequest, ...certRequests, ...pubRequests]);

      const completeOnboardingResponse = await fetch(`/python/user/complete`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!completeOnboardingResponse.ok) throw new Error("Failed to complete onboarding");

      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("Error during onboarding:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const skillsString = getSkillsString();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0f1f18] mb-4 shadow-lg shadow-black/20">
          <svg className="w-7 h-7 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#1a1a1a]">Review & Complete</h2>
        <p className="text-[#6b7280] mt-1">Make sure everything looks good</p>
      </div>

      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
        {/* Personal Info */}
        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
          <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-3">Contact Info</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {formData.personalInfo?.linkedin && (
              <p><span className="text-[#6b7280]">LinkedIn:</span> <span className="text-[#1a1a1a]">{formData.personalInfo.linkedin}</span></p>
            )}
            {formData.personalInfo?.github && (
              <p><span className="text-[#6b7280]">GitHub:</span> <span className="text-[#1a1a1a]">{formData.personalInfo.github}</span></p>
            )}
            {formData.personalInfo?.number && (
              <p><span className="text-[#6b7280]">Phone:</span> <span className="text-[#1a1a1a]">{formData.personalInfo.number}</span></p>
            )}
            {(formData.personalInfo?.city || formData.personalInfo?.state) && (
              <p><span className="text-[#6b7280]">Location:</span> <span className="text-[#1a1a1a]">{formData.personalInfo.city}, {formData.personalInfo.state}</span></p>
            )}
          </div>
        </div>

        {/* Education */}
        {formData.education?.length > 0 && (
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
            <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-3">
              Education ({formData.education.length})
            </h3>
            <div className="space-y-3">
              {formData.education.map((edu: any, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0f1f18] flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-[#1a1a1a]">{edu.degree} in {edu.major}</p>
                    <p className="text-sm text-[#6b7280]">{edu.university}</p>
                    {edu.gpa && <p className="text-xs text-stone-400">GPA: {edu.gpa}/{edu.max_gpa || "4.0"}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {formData.experience?.length > 0 && (
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
            <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-3">
              Experience ({formData.experience.length})
            </h3>
            <div className="space-y-3">
              {formData.experience.map((exp: any, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0f1f18] flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-[#1a1a1a]">{exp.position}</p>
                    <p className="text-sm text-[#6b7280]">{exp.company}</p>
                    {exp.current && <span className="text-xs text-[#2d6a4f] font-medium">Current</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {formData.projects?.length > 0 && (
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
            <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-3">
              Projects ({formData.projects.length})
            </h3>
            <div className="space-y-3">
              {formData.projects.map((proj: any, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0f1f18] flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-[#1a1a1a]">{proj.name}</p>
                    {proj.details && <p className="text-sm text-[#6b7280]">{proj.details}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {skillsString && (
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
            <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-3">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {skillsString.split(",").map((skill: string, index: number) => (
                <span key={index} className="px-2.5 py-1 bg-[#2d6a4f]/10 text-[#2d6a4f] rounded-full text-sm border border-[#2d6a4f]/20">
                  {skill.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        <button
          type="button"
          onClick={prevStep}
          className="px-6 py-2.5 text-[#6b7280] font-medium rounded-full hover:bg-stone-100 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          Back
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className={`px-8 py-3 font-semibold rounded-full transition-all duration-300 flex items-center gap-2 ${
            loading
              ? "bg-stone-100 text-stone-400 cursor-not-allowed"
              : "bg-[#1a1a1a] text-white shadow-lg shadow-black/10 hover:bg-[#2d6a4f] hover:-translate-y-0.5"
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : (
            <>
              Complete Setup
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Summary;
