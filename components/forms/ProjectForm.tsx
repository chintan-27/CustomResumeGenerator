"use client";

import React, { useState, useRef } from "react";

interface Project {
  name: string;
  description: string;
  link: string;
  details: string;
}

const ProjectForm = ({ nextStep, prevStep, onChange }: { nextStep: () => void; prevStep: () => void; onChange: (data: any) => void }) => {
  const [projectList, setProjectList] = useState<Project[]>([
    { name: "", description: "", link: "", details: "" },
  ]);
  const formRef = useRef<HTMLFormElement>(null);

  const handleChange = (index: number, field: keyof Project, value: string) => {
    const updatedList = [...projectList];
    updatedList[index][field] = value;
    setProjectList(updatedList);
  };

  const addProject = () => {
    setProjectList([...projectList, { name: "", description: "", link: "", details: "" }]);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
  };

  const removeProject = (index: number) => {
    const updatedList = projectList.filter((_, i) => i !== index);
    setProjectList(updatedList);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChange(projectList);
    nextStep();
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="max-h-[70vh] overflow-auto">
      <h2 className="text-2xl font-bold mb-4">Projects</h2>
      {projectList.map((proj, index) => (
        <div key={index} className="mb-6 border-b pb-4 relative">
          <div className="mb-4">
            <label className="block text-gray-700">Project Name</label>
            <input
              type="text"
              value={proj.name}
              onChange={(e) => handleChange(index, "name", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Description</label>
            <textarea
              value={proj.description}
              onChange={(e) => handleChange(index, "description", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Project Link</label>
            <input
              type="text"
              value={proj.link}
              onChange={(e) => handleChange(index, "link", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Details</label>
            <textarea
              value={proj.details}
              onChange={(e) => handleChange(index, "details", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          {index > 0 && (
            <button
              type="button"
              onClick={() => removeProject(index)}
              className="absolute top-0 right-0 p-2 text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={addProject} className="mb-4 p-2 bg-green-500 text-white rounded">
        Add Another Project
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

export default ProjectForm;
