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

const monthIndex = (m: string) => months.indexOf(m);

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
  const [errors, setErrors] = useState<Record<string, string>[]>([{}]);

  useEffect(() => {
    if (initialData.length > 0) {
      setEducationList(initialData);
      setShowCoursework(initialData.map(() => false));
      setErrors(initialData.map(() => ({})));
    }
  }, [initialData]);

  const handleChange = (index: number, field: keyof Education, value: any) => {
    setEducationList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
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
    const current = educationList[index][field] || "";
    const [month, year] = current.split(" ");
    const newValue = part === "month" ? `${value} ${year || ""}` : `${month || ""} ${value}`;
    handleChange(index, field, newValue.trim());
  };

  const addEducation = () => {
    setEducationList([...educationList, { ...emptyEducation }]);
    setShowCoursework([...showCoursework, false]);
    setErrors([...errors, {}]);
  };

  const removeEducation = (index: number) => {
    if (educationList.length > 1) {
      setEducationList(educationList.filter((_, i) => i !== index));
      setShowCoursework(showCoursework.filter((_, i) => i !== index));
      setErrors(errors.filter((_, i) => i !== index));
    }
  };

  const validate = () => {
    const allErrors = educationList.map((edu) => {
      const errs: Record<string, string> = {};
      if (!edu.university.trim()) errs.university = "University is required";
      if (!edu.major.trim()) errs.major = "Major is required";
      if (edu.gpa) {
        const g = parseFloat(edu.gpa);
        const max = parseFloat(edu.max_gpa || "4.0");
        if (isNaN(g) || g < 0 || g > max) errs.gpa = `GPA must be between 0 and ${max}`;
      }
      if (edu.start_date && edu.end_date) {
        const [sm, sy] = edu.start_date.split(" ");
        const [em, ey] = edu.end_date.split(" ");
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
    onChange(educationList);
    nextStep();
  };

  const handleSkip = () => {
    onChange([]);
    nextStep();
  };

  const selectClass = (err?: string) =>
    `flex-1 px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] outline-none transition-all text-sm text-[#1a1a1a] bg-white ${
      err ? "border-red-300" : "border-stone-200"
    }`;

  const inputClass = (err?: string) =>
    `w-full px-4 py-2.5 bg-white border rounded-xl text-[#1a1a1a] placeholder-stone-400 focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] outline-none transition-all ${
      err ? "border-red-300 bg-red-50" : "border-stone-200"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0f1f18] mb-4 shadow-lg shadow-black/20">
          <svg className="w-7 h-7 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#1a1a1a]">Education</h2>
        <p className="text-[#6b7280] mt-1">Add your academic background</p>
      </div>

      <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-2">
        {educationList.map((edu, index) => (
          <div key={index} className="p-5 bg-stone-50 rounded-2xl border border-stone-200 relative">
            {educationList.length > 1 && (
              <button
                type="button"
                onClick={() => removeEducation(index)}
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
                  University <span className="text-[#2d6a4f]">*</span>
                </label>
                <input
                  type="text"
                  value={edu.university}
                  onChange={(e) => handleChange(index, "university", e.target.value)}
                  className={inputClass(errors[index]?.university)}
                  placeholder="Stanford University"
                />
                {errors[index]?.university && <p className="mt-1 text-red-500 text-xs">{errors[index].university}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">Degree</label>
                <select
                  value={edu.degree}
                  onChange={(e) => handleChange(index, "degree", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-[#1a1a1a] placeholder-stone-400 focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] outline-none transition-all"
                >
                  <option value="">Select degree</option>
                  <optgroup label="Bachelor's">
                    <option value="Bachelor of Science">Bachelor of Science (B.S.)</option>
                    <option value="Bachelor of Arts">Bachelor of Arts (B.A.)</option>
                    <option value="Bachelor of Engineering">Bachelor of Engineering (B.E.)</option>
                    <option value="Bachelor of Technology">Bachelor of Technology (B.Tech)</option>
                    <option value="Bachelor of Business Administration">Bachelor of Business Administration (BBA)</option>
                    <option value="Bachelor of Computer Applications">Bachelor of Computer Applications (BCA)</option>
                    <option value="Bachelor of Commerce">Bachelor of Commerce (B.Com)</option>
                    <option value="Bachelor of Laws">Bachelor of Laws (LL.B.)</option>
                    <option value="Bachelor of Fine Arts">Bachelor of Fine Arts (B.F.A.)</option>
                    <option value="Bachelor of Architecture">Bachelor of Architecture (B.Arch)</option>
                  </optgroup>
                  <optgroup label="Master's">
                    <option value="Master of Science">Master of Science (M.S.)</option>
                    <option value="Master of Arts">Master of Arts (M.A.)</option>
                    <option value="Master of Engineering">Master of Engineering (M.Eng.)</option>
                    <option value="Master of Technology">Master of Technology (M.Tech)</option>
                    <option value="Master of Business Administration">Master of Business Administration (MBA)</option>
                    <option value="Master of Computer Applications">Master of Computer Applications (MCA)</option>
                    <option value="Master of Laws">Master of Laws (LL.M.)</option>
                    <option value="Master of Fine Arts">Master of Fine Arts (M.F.A.)</option>
                    <option value="Master of Public Administration">Master of Public Administration (MPA)</option>
                    <option value="Master of Public Health">Master of Public Health (MPH)</option>
                  </optgroup>
                  <optgroup label="Doctorate">
                    <option value="Doctor of Philosophy">Doctor of Philosophy (Ph.D.)</option>
                    <option value="Doctor of Medicine">Doctor of Medicine (M.D.)</option>
                    <option value="Doctor of Law">Juris Doctor (J.D.)</option>
                    <option value="Doctor of Engineering">Doctor of Engineering (D.Eng.)</option>
                    <option value="Doctor of Business Administration">Doctor of Business Administration (DBA)</option>
                  </optgroup>
                  <optgroup label="Other">
                    <option value="Associate of Science">Associate of Science (A.S.)</option>
                    <option value="Associate of Arts">Associate of Arts (A.A.)</option>
                    <option value="Diploma">Diploma</option>
                    <option value="High School Diploma">High School Diploma / GED</option>
                    <option value="Certificate">Certificate</option>
                    <option value="Bootcamp">Bootcamp / Intensive Program</option>
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">
                  Major <span className="text-[#2d6a4f]">*</span>
                </label>
                <input
                  type="text"
                  value={edu.major}
                  onChange={(e) => handleChange(index, "major", e.target.value)}
                  className={inputClass(errors[index]?.major)}
                  placeholder="Computer Science"
                />
                {errors[index]?.major && <p className="mt-1 text-red-500 text-xs">{errors[index].major}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">GPA</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={edu.gpa}
                    onChange={(e) => handleChange(index, "gpa", e.target.value)}
                    className={`w-16 px-3 py-2.5 bg-white border rounded-xl text-[#1a1a1a] focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] outline-none transition-all text-center ${errors[index]?.gpa ? "border-red-300" : "border-stone-200"}`}
                    placeholder="3.8"
                  />
                  <span className="text-stone-400">/</span>
                  <input
                    type="text"
                    value={edu.max_gpa}
                    onChange={(e) => handleChange(index, "max_gpa", e.target.value)}
                    className="w-16 px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-[#1a1a1a] focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] outline-none transition-all text-center"
                    placeholder="4.0"
                  />
                </div>
                {errors[index]?.gpa && <p className="mt-1 text-red-500 text-xs">{errors[index].gpa}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">Start Date</label>
                <div className="flex gap-2">
                  <select
                    value={edu.start_date?.split(" ")[0] || ""}
                    onChange={(e) => handleDateChange(index, "start", "month", e.target.value)}
                    className={selectClass()}
                  >
                    <option value="">Month</option>
                    {months.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select
                    value={edu.start_date?.split(" ")[1] || ""}
                    onChange={(e) => handleDateChange(index, "start", "year", e.target.value)}
                    className={selectClass()}
                  >
                    <option value="">Year</option>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">End Date</label>
                <div className="flex gap-2">
                  <select
                    value={edu.end_date?.split(" ")[0] || ""}
                    onChange={(e) => handleDateChange(index, "end", "month", e.target.value)}
                    className={selectClass(errors[index]?.end_date)}
                  >
                    <option value="">Month</option>
                    {months.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select
                    value={edu.end_date?.split(" ")[1] || ""}
                    onChange={(e) => handleDateChange(index, "end", "year", e.target.value)}
                    className={selectClass(errors[index]?.end_date)}
                  >
                    <option value="">Year</option>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                {errors[index]?.end_date && <p className="mt-1 text-red-500 text-xs">{errors[index].end_date}</p>}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const updated = [...showCoursework];
                updated[index] = !updated[index];
                setShowCoursework(updated);
              }}
              className="text-sm text-[#2d6a4f] hover:text-[#0f1f18] font-medium flex items-center gap-1 transition-colors"
            >
              {showCoursework[index] ? (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>Hide coursework</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>Add relevant coursework (optional)</>
              )}
            </button>

            {showCoursework[index] && (
              <div className="mt-3">
                <input
                  type="text"
                  value={edu.relevantCoursework?.join(", ") || ""}
                  onChange={(e) => handleChange(index, "relevantCoursework", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                  className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-[#1a1a1a] placeholder-stone-400 focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] outline-none transition-all"
                  placeholder="Data Structures, Algorithms, Machine Learning (comma separated)"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addEducation}
        className="w-full py-3 border-2 border-dashed border-stone-200 text-[#6b7280] hover:border-[#2d6a4f]/40 hover:text-[#2d6a4f] hover:bg-[#2d6a4f]/5 rounded-xl transition-all flex items-center justify-center gap-2 font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Another Degree
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

export default EducationForm;
