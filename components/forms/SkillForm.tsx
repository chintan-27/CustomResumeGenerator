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
  const [softWarning, setSoftWarning] = useState(false);

  useEffect(() => {
    if (initialData.length > 0) setSkills(initialData);
  }, [initialData]);

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed) && skills.length < 50) {
      setSkills((prev) => [...prev, trimmed]);
      setSoftWarning(false);
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
    if (inputValue.trim()) addSkill(inputValue);
    if (skills.length < 3) {
      setSoftWarning(true);
      return;
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
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0f1f18] mb-4 shadow-lg shadow-black/20">
          <svg className="w-7 h-7 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#1a1a1a]">Skills</h2>
        <p className="text-[#6b7280] mt-1">Add your technical and professional skills</p>
      </div>

      {/* Selected Skills */}
      <div className={`min-h-[80px] p-4 rounded-2xl border transition-colors ${
        softWarning ? "border-amber-300 bg-amber-50" : "border-stone-200 bg-stone-50"
      }`}>
        {skills.length === 0 ? (
          <p className="text-[#6b7280] text-center py-4 text-sm">Click suggestions below or type to add skills</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2d6a4f]/10 text-[#2d6a4f] rounded-full text-sm font-medium border border-[#2d6a4f]/20"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="w-4 h-4 rounded-full bg-[#2d6a4f]/20 text-[#2d6a4f] hover:bg-[#2d6a4f]/40 flex items-center justify-center transition-colors"
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

      {softWarning && (
        <p className="text-amber-600 text-sm flex items-center gap-1.5">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Adding at least 3 skills is recommended for better resume generation
        </p>
      )}

      {/* Input */}
      <div>
        <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">
          Add a skill <span className="text-stone-400 font-normal">(press Enter or comma to add)</span>
        </label>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-[#1a1a1a] placeholder-stone-400 focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] outline-none transition-all"
          placeholder="e.g., Python, React, AWS..."
        />
      </div>

      {/* Suggestions */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest">Quick Add</h3>
        <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-2">
          {Object.entries(SUGGESTED_SKILLS).map(([category, categorySkills]) => (
            <div key={category}>
              <p className="text-xs text-[#6b7280] mb-2">{category}</p>
              <div className="flex flex-wrap gap-2">
                {categorySkills.map((skill) => {
                  const isSelected = skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => isSelected ? removeSkill(skill) : addSkill(skill)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-[#2d6a4f] text-white"
                          : "bg-stone-100 border border-stone-200 text-[#1a1a1a] hover:bg-[#2d6a4f]/10 hover:border-[#2d6a4f]/30 hover:text-[#2d6a4f]"
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
        <span className="text-sm text-[#6b7280]">
          {skills.length} skill{skills.length !== 1 ? "s" : ""} selected
          {skills.length >= 50 && <span className="text-red-500 ml-2">(maximum reached)</span>}
        </span>
      </div>

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

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSkip}
            className="px-6 py-2.5 text-[#6b7280] font-medium rounded-full hover:bg-stone-100 transition-colors"
          >
            Skip for now
          </button>
          <button
            type="submit"
            className="px-8 py-2.5 bg-[#1a1a1a] text-white font-semibold rounded-full shadow-lg shadow-black/10 hover:bg-[#2d6a4f] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
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
