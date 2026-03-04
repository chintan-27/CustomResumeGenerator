"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";

const Summary = ({ formData, prevStep }: { formData: any; prevStep: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { data: session } = useSession();

  // Helper to get skills as string
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

      // Submit personal info
      const personalInfoResponse = await fetch(`python/user/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData.personalInfo),
      });
      if (!personalInfoResponse.ok) throw new Error("Failed to submit personal info");

      // Parallel API calls for education, experience, projects, and skills
      const educationRequests = (formData.education || []).map((edu: any) =>
        fetch(`python/user/education`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...edu,
            relevant_coursework: Array.isArray(edu.relevantCoursework)
              ? edu.relevantCoursework.join(", ")
              : edu.relevantCoursework || ""
          }),
        })
      );

      const experienceRequests = (formData.experience || []).map((exp: any) =>
        fetch(`python/user/experience`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(exp),
        })
      );

      const projectRequests = (formData.projects || []).map((proj: any) =>
        fetch(`python/user/project`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(proj),
        })
      );

      const skillRequest = fetch(`python/user/skills`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ skills: getSkillsString() }),
      });

      await Promise.all([...educationRequests, ...experienceRequests, ...projectRequests, skillRequest]);

      // Complete onboarding
      const completeOnboardingResponse = await fetch(`python/user/complete`, {
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
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4 shadow-lg shadow-emerald-500/30">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Review & Complete</h2>
        <p className="text-gray-500 mt-1">Make sure everything looks good</p>
      </div>

      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
        {/* Personal Info */}
        <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Contact Info</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {formData.personalInfo?.linkedin && (
              <p><span className="text-gray-500">LinkedIn:</span> <span className="text-gray-900">{formData.personalInfo.linkedin}</span></p>
            )}
            {formData.personalInfo?.github && (
              <p><span className="text-gray-500">GitHub:</span> <span className="text-gray-900">{formData.personalInfo.github}</span></p>
            )}
            {formData.personalInfo?.number && (
              <p><span className="text-gray-500">Phone:</span> <span className="text-gray-900">{formData.personalInfo.number}</span></p>
            )}
            {(formData.personalInfo?.city || formData.personalInfo?.state) && (
              <p><span className="text-gray-500">Location:</span> <span className="text-gray-900">{formData.personalInfo.city}, {formData.personalInfo.state}</span></p>
            )}
          </div>
        </div>

        {/* Education */}
        {formData.education?.length > 0 && (
          <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Education ({formData.education.length})
            </h3>
            <div className="space-y-3">
              {formData.education.map((edu: any, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{edu.degree} in {edu.major}</p>
                    <p className="text-sm text-gray-500">{edu.university}</p>
                    {edu.gpa && <p className="text-xs text-gray-400">GPA: {edu.gpa}/{edu.max_gpa || "4.0"}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {formData.experience?.length > 0 && (
          <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Experience ({formData.experience.length})
            </h3>
            <div className="space-y-3">
              {formData.experience.map((exp: any, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{exp.position}</p>
                    <p className="text-sm text-gray-500">{exp.company}</p>
                    {exp.current && <span className="text-xs text-emerald-600 font-medium">Current</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {formData.projects?.length > 0 && (
          <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Projects ({formData.projects.length})
            </h3>
            <div className="space-y-3">
              {formData.projects.map((proj: any, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{proj.name}</p>
                    {proj.details && <p className="text-sm text-gray-500">{proj.details}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {skillsString && (
          <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {skillsString.split(",").map((skill: string, index: number) => (
                <span key={index} className="px-2.5 py-1 bg-violet-100 text-violet-700 rounded-lg text-sm">
                  {skill.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        <button
          type="button"
          onClick={prevStep}
          className="px-6 py-2.5 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2"
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
          className={`px-8 py-3 font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 ${
            loading
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5"
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
