"use client";

import React, { useState, useEffect, useRef } from "react";
import TagInput from "@/components/ui/TagInput";

const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];
const years = Array.from({ length: 50 }, (_, index) => `${new Date().getFullYear() - index}`);

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
  const [educationList, setEducationList] = useState<Education[]>([]);

  useEffect(() => {
    setEducationList(initialData.length > 0 ? initialData : [
      { university: "", degree: "", major: "", gpa: "", max_gpa: "", start_date: "", end_date: "", city: "", state: "", country: "", specialization: "", relevantCoursework: [] }
    ]);
  }, [initialData]);

  const formRef = useRef<HTMLFormElement>(null);

  const handleChange = (index: number, field: keyof Education, value: any) => {
    setEducationList((prevList) => {
      const updatedList = [...prevList];
      updatedList[index][field] = value;
      return updatedList;
    });
  };

  const handleDateChange = (index: number, type: "start" | "end", month: string, year: string) => {
    const formattedDate = (month || year) ? `${month} ${year}` : "";
    handleChange(index, type === "start" ? "start_date" : "end_date", formattedDate);
  };

  const addEducation = () => {
    setEducationList((prevList) => [
      ...prevList, 
      { university: "", degree: "", major: "", gpa: "", max_gpa: "", start_date: "", end_date: "", city: "", state: "", country: "", specialization: "", relevantCoursework: [] }
    ]);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
  };

  const removeEducation = (index: number) => {
    setEducationList((prevList) => prevList.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChange(educationList);
    nextStep();
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="max-h-[70vh] overflow-auto">
      <h2 className="text-2xl font-bold mb-4">Education</h2>
      {educationList.map((edu, index) => (
        <div key={index} className="mb-6 border-b pb-4 relative">
          <div className="mb-4">
            <label className="block text-gray-700">University</label>
            <input
              type="text"
              value={edu.university}
              onChange={(e) => handleChange(index, "university", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Degree</label>
            <input
              type="text"
              value={edu.degree}
              onChange={(e) => handleChange(index, "degree", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Major</label>
            <input
              type="text"
              value={edu.major}
              onChange={(e) => handleChange(index, "major", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          <div className="flex gap-4">
            <div className="mb-4">
              <label className="block text-gray-700">GPA</label>
              <input
                type="text"
                value={edu.gpa}
                onChange={(e) => handleChange(index, "gpa", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Out Of</label>
              <input
                type="text"
                value={edu.max_gpa}
                onChange={(e) => handleChange(index, "max_gpa", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          </div>

          {/* Start Date */}
          <div className="mb-4">
            <label className="block text-gray-700">Start Date</label>
            <div className="flex gap-2">
              <select
                value={edu.start_date?.split(" ")[0] || ""}
                onChange={(e) => {
                  const month = e.target.value;
                  handleDateChange(index, "start", month, edu.start_date?.split(" ")[1] || "");
                }}
                className="w-1/2 p-2 border border-gray-300 rounded"
                required
              >
                <option value="">Month</option>
                {months.map((month) => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>

              <select
                value={edu.start_date?.split(" ")[1] || ""}
                onChange={(e) => {
                  const year = e.target.value;
                  handleDateChange(index, "start", edu.start_date?.split(" ")[0] || "", year);
                }}
                className="w-1/2 p-2 border border-gray-300 rounded"
              >
                <option value="">Year</option>
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* End Date */}
          <div className="mb-4">
            <label className="block text-gray-700">End Date</label>
            <div className="flex gap-2">
              <select
                value={edu.end_date?.split(" ")[0] || ""}
                onChange={(e) => {
                  const month = e.target.value;
                  handleDateChange(index, "end", month, edu.end_date?.split(" ")[1] || "");
                }}
                className="w-1/2 p-2 border border-gray-300 rounded"
                required
              >
                <option value="">Month</option>
                {months.map((month) => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
              <select
                value={edu.end_date?.split(" ")[1] || ""}
                onChange={(e) => {
                  const year = e.target.value;
                  handleDateChange(index, "end", edu.end_date?.split(" ")[0] || "", year);
                }}
                className="w-1/2 p-2 border border-gray-300 rounded"
                required
              >
                <option value="">Year</option>
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Relevant Coursework */}
          <div className="mb-4">
            <label className="block text-gray-700">Relevant Coursework</label>
            <TagInput
              tags={edu.relevantCoursework}
              setTags={(tags) => handleChange(index, "relevantCoursework", tags)}
            />
          </div>

          {index > 0 && (
            <button
              type="button"
              onClick={() => removeEducation(index)}
              className="absolute top-0 right-0 p-2 text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={addEducation} className="mb-4 p-2 bg-green-500 text-white rounded">
        Add Another Education
      </button>
      <div className="flex justify-between">
        <button type="button" onClick={prevStep} className="p-2 bg-gray-300 rounded">
          Back
        </button>
        <button type="submit" className="p-2 bg-blue-500 text-white rounded">
          Next
        </button>
      </div>
    </form>
  );
};

export default EducationForm;
