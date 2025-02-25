"use client";

import React, { useState, useRef } from "react";
import TagInput from "@/components/ui/TagInput";

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
  specialization:string;
  relevantCoursework: string[];
}

const EducationForm = ({ nextStep, prevStep, onChange }: { nextStep: () => void; prevStep: () => void; onChange: (data: any) => void }) => {
  const [educationList, setEducationList] = useState<Education[]>([
    { university: "", degree: "", major: "", gpa: "", max_gpa:"" , start_date: "", end_date: "", city: "", state: "", country: "", specialization:"", relevantCoursework: [] }
  ]);
  const formRef = useRef<HTMLFormElement>(null);

  const handleChange = (index: number, field: keyof Education, value: any) => {
    const updatedList = [...educationList];
    updatedList[index][field] = value;
    setEducationList(updatedList);
  };

  const addEducation = () => {
    setEducationList([...educationList, { university: "", degree: "", major: "", gpa: "", max_gpa:"", start_date: "", end_date: "", city: "", state: "", country: "", specialization:"", relevantCoursework: [] }]);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
  };

  const removeEducation = (index: number) => {
    const updatedList = educationList.filter((_, i) => i !== index);
    setEducationList(updatedList);
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
          <div className="flex gap-4">
            <div className="mb-4">
              <label className="block text-gray-700">Start Date</label>
              <input
                type="text"
                value={edu.start_date}
                onChange={(e) => handleChange(index, "start_date", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">End Date</label>
              <input
                type="text"
                value={edu.end_date}
                onChange={(e) => handleChange(index, "end_date", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="mb-4">
              <label className="block text-gray-700">City</label>
              <input
                type="text"
                value={edu.city}
                onChange={(e) => handleChange(index, "city", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">State</label>
              <input
                type="text"
                value={edu.state}
                onChange={(e) => handleChange(index, "state", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Country</label>
              <input
                type="text"
                value={edu.country}
                onChange={(e) => handleChange(index, "country", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Specialization</label>
            <input
              type="text"
              value={edu.specialization}
              onChange={(e) => handleChange(index, "specialization", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
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
