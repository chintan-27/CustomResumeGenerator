"use client";

import React, { useState, useEffect } from "react";

interface Project {
  name: string;
  description: string;
  link: string;
  details: string;
}

const emptyProject: Project = { name: "", description: "", link: "", details: "" };

const ProjectForm = ({
  nextStep,
  prevStep,
  onChange,
  initialData = [],
}: {
  nextStep: () => void;
  prevStep: () => void;
  onChange: (data: any) => void;
  initialData?: Project[];
}) => {
  const [projectList, setProjectList] = useState<Project[]>([{ ...emptyProject }]);

  useEffect(() => {
    if (initialData.length > 0) {
      setProjectList(initialData);
    }
  }, [initialData]);

  const handleChange = (index: number, field: keyof Project, value: string) => {
    setProjectList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addProject = () => {
    setProjectList([...projectList, { ...emptyProject }]);
  };

  const removeProject = (index: number) => {
    if (projectList.length > 1) {
      setProjectList(projectList.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChange(projectList);
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
        <p className="text-gray-500 mt-1">Showcase your best work</p>
      </div>

      <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-2">
        {projectList.map((proj, index) => (
          <div key={index} className="p-5 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 relative">
            {projectList.length > 1 && (
              <button
                type="button"
                onClick={() => removeProject(index)}
                className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Name & Link */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Project Name <span className="text-violet-500">*</span>
                </label>
                <input
                  type="text"
                  value={proj.name}
                  onChange={(e) => handleChange(index, "name", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                  placeholder="AI Resume Builder"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Project Link <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </span>
                  <input
                    type="url"
                    value={proj.link}
                    onChange={(e) => handleChange(index, "link", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                    placeholder="github.com/project"
                  />
                </div>
              </div>
            </div>

            {/* Tech Stack / Short Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tech Stack / Tools Used <span className="text-violet-500">*</span>
              </label>
              <input
                type="text"
                value={proj.details}
                onChange={(e) => handleChange(index, "details", e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                placeholder="React, Node.js, PostgreSQL, AWS"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                What does it do? <span className="text-gray-400 font-normal">(AI will enhance)</span>
              </label>
              <textarea
                value={proj.description}
                onChange={(e) => handleChange(index, "description", e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all resize-none"
                rows={2}
                placeholder="Built an AI-powered tool that generates tailored resumes..."
              />
            </div>
          </div>
        ))}
      </div>

      {/* Add More */}
      <button
        type="button"
        onClick={addProject}
        className="w-full py-3 border-2 border-dashed border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all flex items-center justify-center gap-2 font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Another Project
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

export default ProjectForm;
