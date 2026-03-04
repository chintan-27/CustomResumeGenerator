"use client";

import React, { useState, useEffect } from "react";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 30 }, (_, i) => `${currentYear - i}`);

interface Education {
  university: string;
  degree: string;
  major: string;
  gpa: string;
  max_gpa: string;
  start_date: string;
  end_date: string;
  city: string;
  state: string;
  country: string;
  specialization: string;
  relevantCoursework: string[];
}

const emptyEducation: Education = {
  university: "", degree: "", major: "", gpa: "", max_gpa: "4.0",
  start_date: "", end_date: "", city: "", state: "", country: "",
  specialization: "", relevantCoursework: []
};

const EducationForm = ({
  nextStep,
  prevStep,
  onChange,
  initialData = []
}: {
  nextStep: () => void;
  prevStep: () => void;
  onChange: (data: any) => void;
  initialData?: Education[];
}) => {
  const [educationList, setEducationList] = useState<Education[]>([{ ...emptyEducation }]);
  const [showCoursework, setShowCoursework] = useState<boolean[]>([false]);

  useEffect(() => {
    if (initialData.length > 0) {
      setEducationList(initialData);
      setShowCoursework(initialData.map(() => false));
    }
  }, [initialData]);

  const handleChange = (index: number, field: keyof Education, value: any) => {
    setEducationList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleDateChange = (index: number, type: "start" | "end", part: "month" | "year", value: string) => {
    const field = type === "start" ? "start_date" : "end_date";
    const current = educationList[index][field] || "";
    const [month, year] = current.split(" ");
    const newValue = part === "month" ? `${value} ${year || ""}` : `${month || ""} ${value}`;
    handleChange(index, field, newValue.trim());
  };

  const addEducation = () => {
    setEducationList([...educationList, { ...emptyEducation }]);
    setShowCoursework([...showCoursework, false]);
  };

  const removeEducation = (index: number) => {
    if (educationList.length > 1) {
      setEducationList(educationList.filter((_, i) => i !== index));
      setShowCoursework(showCoursework.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChange(educationList);
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Education</h2>
        <p className="text-gray-500 mt-1">Add your academic background</p>
      </div>

      <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-2">
        {educationList.map((edu, index) => (
          <div key={index} className="p-5 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 relative">
            {educationList.length > 1 && (
              <button
                type="button"
                onClick={() => removeEducation(index)}
                className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* University & Degree - Most Important */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  University <span className="text-violet-500">*</span>
                </label>
                <input
                  type="text"
                  value={edu.university}
                  onChange={(e) => handleChange(index, "university", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                  placeholder="Stanford University"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Degree</label>
                <select
                  value={edu.degree}
                  onChange={(e) => handleChange(index, "degree", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                >
                  <option value="">Select degree</option>
                  <option value="Bachelor of Science">Bachelor of Science (B.S.)</option>
                  <option value="Bachelor of Arts">Bachelor of Arts (B.A.)</option>
                  <option value="Master of Science">Master of Science (M.S.)</option>
                  <option value="Master of Arts">Master of Arts (M.A.)</option>
                  <option value="Master of Business Administration">MBA</option>
                  <option value="Doctor of Philosophy">Ph.D.</option>
                  <option value="Associate">Associate Degree</option>
                </select>
              </div>
            </div>

            {/* Major & GPA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Major</label>
                <input
                  type="text"
                  value={edu.major}
                  onChange={(e) => handleChange(index, "major", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                  placeholder="Computer Science"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">GPA</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={edu.gpa}
                    onChange={(e) => handleChange(index, "gpa", e.target.value)}
                    className="w-16 px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-center"
                    placeholder="3.8"
                  />
                  <span className="text-gray-400">/</span>
                  <input
                    type="text"
                    value={edu.max_gpa}
                    onChange={(e) => handleChange(index, "max_gpa", e.target.value)}
                    className="w-16 px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-center"
                    placeholder="4.0"
                  />
                </div>
              </div>
            </div>

            {/* Dates - Compact */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                <div className="flex gap-2">
                  <select
                    value={edu.start_date?.split(" ")[0] || ""}
                    onChange={(e) => handleDateChange(index, "start", "month", e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-sm"
                  >
                    <option value="">Month</option>
                    {months.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select
                    value={edu.start_date?.split(" ")[1] || ""}
                    onChange={(e) => handleDateChange(index, "start", "year", e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-sm"
                  >
                    <option value="">Year</option>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                <div className="flex gap-2">
                  <select
                    value={edu.end_date?.split(" ")[0] || ""}
                    onChange={(e) => handleDateChange(index, "end", "month", e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-sm"
                  >
                    <option value="">Month</option>
                    {months.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select
                    value={edu.end_date?.split(" ")[1] || ""}
                    onChange={(e) => handleDateChange(index, "end", "year", e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-sm"
                  >
                    <option value="">Year</option>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Optional: Coursework Toggle */}
            <button
              type="button"
              onClick={() => {
                const updated = [...showCoursework];
                updated[index] = !updated[index];
                setShowCoursework(updated);
              }}
              className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
            >
              {showCoursework[index] ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Hide coursework
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Add relevant coursework (optional)
                </>
              )}
            </button>

            {showCoursework[index] && (
              <div className="mt-3">
                <input
                  type="text"
                  value={edu.relevantCoursework?.join(", ") || ""}
                  onChange={(e) => handleChange(index, "relevantCoursework", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                  placeholder="Data Structures, Algorithms, Machine Learning (comma separated)"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add More */}
      <button
        type="button"
        onClick={addEducation}
        className="w-full py-3 border-2 border-dashed border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all flex items-center justify-center gap-2 font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Another Degree
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

export default EducationForm;
