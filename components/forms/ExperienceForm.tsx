"use client";

import React, { useState, useEffect, useRef } from "react";

interface Experience {
  position: string;
  company: string;
  start_date: string;
  end_date: string;
  current: boolean;
  description: string;
}

const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];
const years = Array.from({ length: 50 }, (_, index) => `${new Date().getFullYear() - index}`);

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
  const [experienceList, setExperienceList] = useState<Experience[]>([
    { position: "", company: "", start_date: "", end_date: "", current: false, description: "" }
  ]);
  
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (initialData.length > 0) {
      setExperienceList(initialData);
    }
  }, [initialData]);

  const handleTextChange = (index: number, field: keyof Omit<Experience, "current">, value: string) => {
    const updatedList = [...experienceList];
    updatedList[index][field] = value;
    setExperienceList(updatedList);
  };

  const handleCheckboxChange = (index: number, checked: boolean) => {
    const updatedList = [...experienceList];
    updatedList[index].current = checked;
    
    if (checked) {
      updatedList[index].end_date = ""; // Clear end date if currently working
    }

    setExperienceList(updatedList);
  };

  const addExperience = () => {
    setExperienceList([...experienceList, { position: "", company: "", start_date: "", end_date: "", current: false, description: "" }]);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
  };

  const removeExperience = (index: number) => {
    const updatedList = experienceList.filter((_, i) => i !== index);
    setExperienceList(updatedList);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChange(experienceList); // Save experience data
    nextStep();
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="max-h-[70vh] overflow-auto">
      <h2 className="text-2xl font-bold mb-4">Work Experience</h2>
      {experienceList.map((exp, index) => (
        <div key={index} className="mb-6 border-b pb-4 relative">
          <div className="mb-4">
            <label className="block text-gray-700">Position</label>
            <input
              type="text"
              value={exp.position}
              onChange={(e) => handleTextChange(index, "position", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Company</label>
            <input
              type="text"
              value={exp.company}
              onChange={(e) => handleTextChange(index, "company", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
          <div className="flex gap-4">
            <div className="mb-4">
              <label className="block text-gray-700">Start Date</label>
              <div className="flex gap-2">
                <select
                  value={exp.start_date.split(" ")[0] || ""}
                  onChange={(e) => handleTextChange(index, "start_date", `${e.target.value} ${exp.start_date.split(" ")[1] || ""}`)}
                  className="w-1/2 p-2 border border-gray-300 rounded"
                >
                  <option value="">Month</option>
                  {months.map((month) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
                <select
                  value={exp.start_date.split(" ")[1] || ""}
                  onChange={(e) => handleTextChange(index, "start_date", `${exp.start_date.split(" ")[0] || ""} ${e.target.value}`)}
                  className="w-1/2 p-2 border border-gray-300 rounded"
                >
                  <option value="">Year</option>
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
            {!exp.current && ( // Hide end date if "Currently Working Here" is checked
              <div className="mb-4">
                <label className="block text-gray-700">End Date</label>
                <div className="flex gap-2">
                  <select
                    value={exp.end_date.split(" ")[0] || ""}
                    onChange={(e) => handleTextChange(index, "end_date", `${e.target.value} ${exp.end_date.split(" ")[1] || ""}`)}
                    className="w-1/2 p-2 border border-gray-300 rounded"
                  >
                    <option value="">Month</option>
                    {months.map((month) => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                  <select
                    value={exp.end_date.split(" ")[1] || ""}
                    onChange={(e) => handleTextChange(index, "end_date", `${exp.end_date.split(" ")[0] || ""} ${e.target.value}`)}
                    className="w-1/2 p-2 border border-gray-300 rounded"
                  >
                    <option value="">Year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Description</label>
            <textarea
              value={exp.description}
              onChange={(e) => handleTextChange(index, "description", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exp.current}
                onChange={(e) => handleCheckboxChange(index, e.target.checked)}
                className="mr-2"
              />
              Currently Working Here
            </label>
          </div>
          {index > 0 && (
            <button
              type="button"
              onClick={() => removeExperience(index)}
              className="absolute top-0 right-0 p-2 text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={addExperience} className="mb-4 p-2 bg-green-500 text-white rounded">
        Add Another Experience
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

export default ExperienceForm;
