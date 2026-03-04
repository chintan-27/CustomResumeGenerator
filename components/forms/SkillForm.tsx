"use client";

import React, { useState, useEffect } from "react";

const SUGGESTED_SKILLS = {
  "Languages": ["Python", "JavaScript", "TypeScript", "Java", "C++", "Go", "Rust", "SQL"],
  "Frontend": ["React", "Vue", "Angular", "Next.js", "Tailwind CSS", "HTML/CSS"],
  "Backend": ["Node.js", "Express", "Django", "Flask", "FastAPI", "Spring Boot"],
  "Cloud & DevOps": ["AWS", "GCP", "Azure", "Docker", "Kubernetes", "CI/CD", "Terraform"],
  "Data & ML": ["TensorFlow", "PyTorch", "Pandas", "NumPy", "Scikit-learn", "SQL"],
  "Databases": ["PostgreSQL", "MongoDB", "Redis", "MySQL", "DynamoDB"],
  "Tools": ["Git", "Linux", "Jira", "Figma", "REST APIs", "GraphQL"],
};

const SkillForm = ({
  nextStep,
  prevStep,
  onChange,
  initialData = []
}: {
  nextStep: () => void;
  prevStep: () => void;
  onChange: (data: any) => void;
  initialData?: string[];
}) => {
  const [skills, setSkills] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (initialData.length > 0) {
      setSkills(initialData);
    }
  }, [initialData]);

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setInputValue("");
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(inputValue);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      addSkill(inputValue);
    }
    onChange({ skills: skills.join(", ") });
    nextStep();
  };

  const handleSkip = () => {
    onChange({ skills: "" });
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 mb-4 shadow-lg shadow-violet-500/30">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Skills</h2>
        <p className="text-gray-500 mt-1">Add your technical and professional skills</p>
      </div>

      {/* Selected Skills */}
      <div className="min-h-[80px] p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200">
        {skills.length === 0 ? (
          <p className="text-gray-400 text-center py-4">Click suggestions below or type to add skills</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-lg text-sm font-medium group"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="w-4 h-4 rounded-full bg-violet-200 text-violet-600 hover:bg-violet-300 flex items-center justify-center transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Add a skill (press Enter or comma to add)
        </label>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
          placeholder="e.g., Python, React, AWS..."
        />
      </div>

      {/* Suggestions */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Quick Add</h3>
        <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-2">
          {Object.entries(SUGGESTED_SKILLS).map(([category, categorySkills]) => (
            <div key={category}>
              <p className="text-xs text-gray-500 mb-2">{category}</p>
              <div className="flex flex-wrap gap-2">
                {categorySkills.map((skill) => {
                  const isSelected = skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => isSelected ? removeSkill(skill) : addSkill(skill)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-violet-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="text-center">
        <span className="text-sm text-gray-500">
          {skills.length} skill{skills.length !== 1 ? "s" : ""} selected
        </span>
      </div>

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

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSkip}
            className="px-6 py-2.5 text-gray-500 font-medium rounded-xl hover:bg-gray-100 transition-colors"
          >
            Skip for now
          </button>
          <button
            type="submit"
            className="px-8 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
          >
            Finish
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
};

export default SkillForm;
