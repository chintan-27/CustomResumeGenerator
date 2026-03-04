"use client";

import React, { useState, useEffect } from "react";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 30 }, (_, i) => `${currentYear - i}`);

interface Experience {
  position: string;
  company: string;
  start_date: string;
  end_date: string;
  current: boolean;
  description: string;
}

const emptyExperience: Experience = {
  position: "", company: "", start_date: "", end_date: "", current: false, description: ""
};

const ExperienceForm = ({
  nextStep,
  prevStep,
  onChange,
  initialData = [],
}: {
  nextStep: () => void;
  prevStep: () => void;
  onChange: (data: any) => void;
  initialData?: Experience[];
}) => {
  const [experienceList, setExperienceList] = useState<Experience[]>([{ ...emptyExperience }]);

  useEffect(() => {
    if (initialData.length > 0) {
      setExperienceList(initialData);
    }
  }, [initialData]);

  const handleChange = (index: number, field: keyof Experience, value: any) => {
    setExperienceList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "current" && value === true) {
        updated[index].end_date = "";
      }
      return updated;
    });
  };

  const handleDateChange = (index: number, type: "start" | "end", part: "month" | "year", value: string) => {
    const field = type === "start" ? "start_date" : "end_date";
    const current = experienceList[index][field] || "";
    const [month, year] = current.split(" ");
    const newValue = part === "month" ? `${value} ${year || ""}` : `${month || ""} ${value}`;
    handleChange(index, field, newValue.trim());
  };

  const addExperience = () => {
    setExperienceList([...experienceList, { ...emptyExperience }]);
  };

  const removeExperience = (index: number) => {
    if (experienceList.length > 1) {
      setExperienceList(experienceList.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChange(experienceList);
    nextStep();
  };

  const handleSkip = () => {
    onChange([]);
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 mb-4 shadow-lg shadow-violet-500/30">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Work Experience</h2>
        <p className="text-gray-500 mt-1">Add your professional background</p>
      </div>

      <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-2">
        {experienceList.map((exp, index) => (
          <div key={index} className="p-5 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 relative">
            {experienceList.length > 1 && (
              <button
                type="button"
                onClick={() => removeExperience(index)}
                className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Position & Company */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Job Title <span className="text-violet-500">*</span>
                </label>
                <input
                  type="text"
                  value={exp.position}
                  onChange={(e) => handleChange(index, "position", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                  placeholder="Software Engineer"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Company <span className="text-violet-500">*</span>
                </label>
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => handleChange(index, "company", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                  placeholder="Google"
                  required
                />
              </div>
            </div>

            {/* Dates & Current */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                <div className="flex gap-2">
                  <select
                    value={exp.start_date?.split(" ")[0] || ""}
                    onChange={(e) => handleDateChange(index, "start", "month", e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-sm"
                  >
                    <option value="">Month</option>
                    {months.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select
                    value={exp.start_date?.split(" ")[1] || ""}
                    onChange={(e) => handleDateChange(index, "start", "year", e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-sm"
                  >
                    <option value="">Year</option>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {!exp.current && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                  <div className="flex gap-2">
                    <select
                      value={exp.end_date?.split(" ")[0] || ""}
                      onChange={(e) => handleDateChange(index, "end", "month", e.target.value)}
                      className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-sm"
                    >
                      <option value="">Month</option>
                      {months.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select
                      value={exp.end_date?.split(" ")[1] || ""}
                      onChange={(e) => handleDateChange(index, "end", "year", e.target.value)}
                      className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-sm"
                    >
                      <option value="">Year</option>
                      {years.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {exp.current && (
                <div className="flex items-end">
                  <span className="px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium">
                    Currently Working Here
                  </span>
                </div>
              )}
            </div>

            {/* Current Toggle */}
            <label className="flex items-center gap-3 mb-4 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={exp.current}
                  onChange={(e) => handleChange(index, "current", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-violet-600 transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </div>
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                I currently work here
              </span>
            </label>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                What did you do? <span className="text-gray-400 font-normal">(brief overview, AI will enhance it)</span>
              </label>
              <textarea
                value={exp.description}
                onChange={(e) => handleChange(index, "description", e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all resize-none"
                rows={3}
                placeholder="Built REST APIs, led a team of 3, improved performance by 40%..."
              />
            </div>
          </div>
        ))}
      </div>

      {/* Add More */}
      <button
        type="button"
        onClick={addExperience}
        className="w-full py-3 border-2 border-dashed border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all flex items-center justify-center gap-2 font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Another Experience
      </button>

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
            Continue
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
};

export default ExperienceForm;
