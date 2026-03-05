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

const monthIndex = (m: string) => months.indexOf(m);

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
  const [errors, setErrors] = useState<Record<string, string>[]>([{}]);

  useEffect(() => {
    if (initialData.length > 0) {
      setExperienceList(initialData);
      setErrors(initialData.map(() => ({})));
    }
  }, [initialData]);

  const handleChange = (index: number, field: keyof Experience, value: any) => {
    setExperienceList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "current" && value === true) updated[index].end_date = "";
      return updated;
    });
    setErrors((prev) => {
      const updated = [...prev];
      if (updated[index]) { const e = { ...updated[index] }; delete e[field as string]; updated[index] = e; }
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
    setErrors([...errors, {}]);
  };

  const removeExperience = (index: number) => {
    if (experienceList.length > 1) {
      setExperienceList(experienceList.filter((_, i) => i !== index));
      setErrors(errors.filter((_, i) => i !== index));
    }
  };

  const validate = () => {
    const allErrors = experienceList.map((exp) => {
      const errs: Record<string, string> = {};
      if (!exp.position.trim()) errs.position = "Job title is required";
      if (!exp.company.trim()) errs.company = "Company is required";
      if (!exp.current && exp.start_date && exp.end_date) {
        const [sm, sy] = exp.start_date.split(" ");
        const [em, ey] = exp.end_date.split(" ");
        if (sy && ey && parseInt(ey) < parseInt(sy)) errs.end_date = "End date must be after start date";
        else if (sy && ey && parseInt(ey) === parseInt(sy) && monthIndex(sm) > monthIndex(em)) {
          errs.end_date = "End date must be after start date";
        }
      }
      return errs;
    });
    setErrors(allErrors);
    return allErrors.every((e) => Object.keys(e).length === 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onChange(experienceList);
    nextStep();
  };

  const handleSkip = () => {
    onChange([]);
    nextStep();
  };

  const inputClass = (err?: string) =>
    `w-full px-4 py-2.5 bg-white border rounded-xl text-[#1a1a1a] placeholder-stone-400 focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] outline-none transition-all ${
      err ? "border-red-300 bg-red-50" : "border-stone-200"
    }`;

  const selectClass = (err?: string) =>
    `flex-1 px-3 py-2.5 bg-white border rounded-xl text-[#1a1a1a] placeholder-stone-400 focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] outline-none transition-all text-sm ${
      err ? "border-red-300" : "border-stone-200"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0f1f18] mb-4 shadow-lg shadow-black/20">
          <svg className="w-7 h-7 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#1a1a1a]">Work Experience</h2>
        <p className="text-[#6b7280] mt-1">Add your professional background</p>
      </div>

      <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-2">
        {experienceList.map((exp, index) => (
          <div key={index} className="p-5 bg-stone-50 rounded-2xl border border-stone-200 relative">
            {experienceList.length > 1 && (
              <button
                type="button"
                onClick={() => removeExperience(index)}
                className="absolute top-3 right-3 p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">
                  Job Title <span className="text-[#2d6a4f]">*</span>
                </label>
                <input
                  type="text"
                  value={exp.position}
                  onChange={(e) => handleChange(index, "position", e.target.value)}
                  className={inputClass(errors[index]?.position)}
                  placeholder="Software Engineer"
                />
                {errors[index]?.position && <p className="mt-1 text-red-500 text-xs">{errors[index].position}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">
                  Company <span className="text-[#2d6a4f]">*</span>
                </label>
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => handleChange(index, "company", e.target.value)}
                  className={inputClass(errors[index]?.company)}
                  placeholder="Google"
                />
                {errors[index]?.company && <p className="mt-1 text-red-500 text-xs">{errors[index].company}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">Start Date</label>
                <div className="flex gap-2">
                  <select value={exp.start_date?.split(" ")[0] || ""} onChange={(e) => handleDateChange(index, "start", "month", e.target.value)} className={selectClass()}>
                    <option value="">Month</option>
                    {months.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={exp.start_date?.split(" ")[1] || ""} onChange={(e) => handleDateChange(index, "start", "year", e.target.value)} className={selectClass()}>
                    <option value="">Year</option>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {!exp.current && (
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">End Date</label>
                  <div className="flex gap-2">
                    <select value={exp.end_date?.split(" ")[0] || ""} onChange={(e) => handleDateChange(index, "end", "month", e.target.value)} className={selectClass(errors[index]?.end_date)}>
                      <option value="">Month</option>
                      {months.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select value={exp.end_date?.split(" ")[1] || ""} onChange={(e) => handleDateChange(index, "end", "year", e.target.value)} className={selectClass(errors[index]?.end_date)}>
                      <option value="">Year</option>
                      {years.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  {errors[index]?.end_date && <p className="mt-1 text-red-500 text-xs">{errors[index].end_date}</p>}
                </div>
              )}

              {exp.current && (
                <div className="flex items-end">
                  <span className="px-4 py-2.5 bg-[#2d6a4f]/10 text-[#2d6a4f] rounded-xl text-sm font-medium">
                    Currently Working Here
                  </span>
                </div>
              )}
            </div>

            <label className="flex items-center gap-3 mb-4 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={exp.current}
                  onChange={(e) => handleChange(index, "current", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 rounded-full peer peer-checked:bg-[#2d6a4f] transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </div>
              <span className="text-sm text-[#6b7280] group-hover:text-[#1a1a1a] transition-colors">
                I currently work here
              </span>
            </label>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">
                What did you do? <span className="text-stone-400 font-normal">(brief overview, AI will enhance it)</span>
              </label>
              <textarea
                value={exp.description}
                onChange={(e) => handleChange(index, "description", e.target.value)}
                className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-[#1a1a1a] placeholder-stone-400 focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] outline-none transition-all resize-none"
                rows={3}
                placeholder="Built REST APIs, led a team of 3, improved performance by 40%..."
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addExperience}
        className="w-full py-3 border-2 border-dashed border-stone-200 text-[#6b7280] hover:border-[#2d6a4f]/40 hover:text-[#2d6a4f] hover:bg-[#2d6a4f]/5 rounded-xl transition-all flex items-center justify-center gap-2 font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Another Experience
      </button>

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
