"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";

const Summary = ({ formData, prevStep }: { formData: any; prevStep: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { data: session } = useSession();

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
      console.log(personalInfoResponse)
      if (!personalInfoResponse.ok) throw new Error("Failed to submit personal info");

      // Parallel API calls for education, experience, projects, and skills
      const educationRequests = formData.education.map((edu: any) =>
        fetch(`python/user/education`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(edu),
        })
      );

      const experienceRequests = formData.experience.map((exp: any) =>
        fetch(`python/user/experience`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(exp),
        })
      );

      const projectRequests = formData.projects.map((proj: any) =>
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
        body: JSON.stringify({ skills: formData.skills.skills.join(",") }), // Convert skills to an array
      });

      await Promise.all([...educationRequests, ...experienceRequests, ...projectRequests, skillRequest]);

      // Complete onboarding
      const completeOnboardingResponse = await fetch(`python/user/complete`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!completeOnboardingResponse.ok) throw new Error("Failed to complete onboarding");

      alert("Onboarding completed successfully!");
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("Error during onboarding:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen flex flex-col">
      <h2 className="text-3xl font-bold text-center text-blue-600 mb-4">Summary & Confirmation</h2>
      <div className="flex-1 overflow-y-auto space-y-6">
        
        {/* Personal Info Section */}
        <div className="bg-white p-6 shadow-md rounded-lg">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Personal Information</h3>
          <p><strong>Name:</strong> {formData.personalInfo.number}</p>
          <p><strong>City:</strong> {formData.personalInfo.city}</p>
          <p><strong>State:</strong> {formData.personalInfo.state}</p>
          <p><strong>Website:</strong> {formData.personalInfo.website}</p>
          <p><strong>LinkedIn:</strong> {formData.personalInfo.linkedin}</p>
          <p><strong>GitHub:</strong> {formData.personalInfo.github}</p>
        </div>

        {/* Education Section */}
        <div className="bg-white p-6 shadow-md rounded-lg">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Education</h3>
          {formData.education.map((edu: any, index: number) => (
            <div key={index} className="border-b pb-4 mb-4">
              <p><strong>University:</strong> {edu.university}</p>
              <p><strong>Degree:</strong> {edu.degree}</p>
              <p><strong>Major:</strong> {edu.major}</p>
              <p><strong>GPA:</strong> {edu.gpa}</p>
              <p><strong>Start Date:</strong> {edu.start_date}</p>
              <p><strong>End Date:</strong> {edu.end_date}</p>
              <p><strong>City:</strong> {edu.city}</p>
              <p><strong>State:</strong> {edu.state}</p>
              <p><strong>Country:</strong> {edu.country}</p>
              <p><strong>Relevant Coursework:</strong> {edu.relevantCoursework.join(", ")}</p>
            </div>
          ))}
        </div>

        {/* Experience Section */}
        <div className="bg-white p-6 shadow-md rounded-lg">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Work Experience</h3>
          {formData.experience.map((exp: any, index: number) => (
            <div key={index} className="border-b pb-4 mb-4">
              <p><strong>Position:</strong> {exp.position}</p>
              <p><strong>Company:</strong> {exp.company}</p>
              <p><strong>Start Date:</strong> {exp.start_date}</p>
              <p><strong>End Date:</strong> {exp.end_date}</p>
              <p><strong>Description:</strong> {exp.description}</p>
              <p><strong>Currently Working:</strong> {exp.current ? "Yes" : "No"}</p>
            </div>
          ))}
        </div>

        {/* Projects Section */}
        <div className="bg-white p-6 shadow-md rounded-lg">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Projects</h3>
          {formData.projects.map((proj: any, index: number) => (
            <div key={index} className="border-b pb-4 mb-4">
              <p><strong>Project Name:</strong> {proj.name}</p>
              <p><strong>Description:</strong> {proj.description}</p>
              <p><strong>Link:</strong> {proj.link}</p>
              <p><strong>Details:</strong> {proj.details}</p>
            </div>
          ))}
        </div>

        {/* Skills Section */}
        <div className="bg-white p-6 shadow-md rounded-lg">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Skills</h3>
          <p>{formData.skills.skills.join(", ")}</p>
        </div>

        {error && <p className="text-red-500 font-medium text-center mt-4">{error}</p>}

        <div className="mt-6 flex justify-between">
          <button type="button" onClick={prevStep} className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg">
            Back
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className={`px-6 py-2 rounded-lg ${loading ? "bg-gray-400" : "bg-blue-600 text-white hover:bg-blue-700"}`}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Complete Onboarding"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Summary;
