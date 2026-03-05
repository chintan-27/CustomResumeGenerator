"use client";

import React, { useState, useEffect } from "react";

interface Project {
  name: string;
  description: string;
  link: string;
  details: string;
}

const emptyProject: Project = { name: "", description: "", link: "", details: "" };

const isValidUrl = (url: string) => {
  if (!url) return true;
  try { new URL(url.startsWith("http") ? url : `https://${url}`); return true; } catch { return false; }
};

// Extract owner/repo from any GitHub URL format
const parseGitHubUrl = (url: string): { owner: string; repo: string } | null => {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    if (!u.hostname.includes("github.com")) return null;
    const parts = u.pathname.replace(/^\//, "").split("/");
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1].replace(/\.git$/, "") };
  } catch { return null; }
};

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
  const [errors, setErrors] = useState<Record<string, string>[]>([{}]);
  const [importingIndex, setImportingIndex] = useState<number | null>(null);
  const [importError, setImportError] = useState<string>("");

  useEffect(() => {
    if (initialData.length > 0) {
      setProjectList(initialData);
      setErrors(initialData.map(() => ({})));
    }
  }, [initialData]);

  const handleChange = (index: number, field: keyof Project, value: string) => {
    setProjectList((prev) => {
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

  const addProject = () => {
    setProjectList([...projectList, { ...emptyProject }]);
    setErrors([...errors, {}]);
  };

  const removeProject = (index: number) => {
    if (projectList.length > 1) {
      setProjectList(projectList.filter((_, i) => i !== index));
      setErrors(errors.filter((_, i) => i !== index));
    }
  };

  const validate = () => {
    const allErrors = projectList.map((proj) => {
      const errs: Record<string, string> = {};
      if (!proj.name.trim()) errs.name = "Project name is required";
      if (!proj.details.trim()) errs.details = "Tech stack is required";
      if (proj.link && !isValidUrl(proj.link)) errs.link = "Enter a valid URL";
      return errs;
    });
    setErrors(allErrors);
    return allErrors.every((e) => Object.keys(e).length === 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onChange(projectList);
    nextStep();
  };

  const handleSkip = () => {
    onChange([]);
    nextStep();
  };

  const importFromGitHub = async (index: number) => {
    const url = projectList[index].link;
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      setImportError("Paste a valid GitHub repo URL first (e.g. github.com/user/repo)");
      return;
    }
    setImportError("");
    setImportingIndex(index);
    try {
      const res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`);
      if (!res.ok) throw new Error("Repo not found or is private");
      const data = await res.json();

      // Also fetch languages
      const langRes = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/languages`);
      const langs = langRes.ok ? await langRes.json() : {};
      const langList = Object.keys(langs).slice(0, 6).join(", ");

      // Build tech string from languages + topics
      const topics: string[] = data.topics || [];
      const combined = [...langList.split(", ").filter(Boolean), ...topics.slice(0, 4)];
      const techParts = combined.filter((v, i, a) => a.indexOf(v) === i);
      const tech = techParts.join(", ");

      setProjectList((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          name: updated[index].name || data.name?.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) || "",
          description: updated[index].description || data.description || "",
          details: updated[index].details || tech,
          link: `https://github.com/${parsed.owner}/${parsed.repo}`,
        };
        return updated;
      });
    } catch (err: any) {
      setImportError(err.message || "Failed to fetch repo info");
    } finally {
      setImportingIndex(null);
    }
  };

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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#1a1a1a]">Projects</h2>
        <p className="text-[#6b7280] mt-1">Showcase your best work</p>
      </div>

      {/* GitHub import hint */}
      <div className="flex items-start gap-3 px-4 py-3 bg-[#0f1f18] rounded-xl">
        <svg className="w-4 h-4 text-[#4ade80] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        <p className="text-xs text-white/70">Paste a GitHub repo URL in the link field and click <span className="text-[#4ade80] font-semibold">Auto-fill from GitHub</span> to import name, description, and tech stack automatically.</p>
      </div>

      {importError && (
        <p className="text-xs text-red-500 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {importError}
        </p>
      )}

      <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-2">
        {projectList.map((proj, index) => (
          <div key={index} className="p-5 bg-stone-50 rounded-2xl border border-stone-200 relative">
            {projectList.length > 1 && (
              <button
                type="button"
                onClick={() => removeProject(index)}
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
                  Project Name <span className="text-[#2d6a4f]">*</span>
                </label>
                <input
                  type="text"
                  value={proj.name}
                  onChange={(e) => handleChange(index, "name", e.target.value)}
                  className={inputClass(errors[index]?.name)}
                  placeholder="AI Resume Builder"
                />
                {errors[index]?.name && <p className="mt-1 text-red-500 text-xs">{errors[index].name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">
                  Project Link <span className="text-stone-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={proj.link}
                    onChange={(e) => handleChange(index, "link", e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-[#1a1a1a] placeholder-stone-400 focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] outline-none transition-all ${errors[index]?.link ? "border-red-300 bg-red-50" : "border-stone-200"}`}
                    placeholder="github.com/project"
                  />
                </div>
                {errors[index]?.link && <p className="mt-1 text-red-500 text-xs">{errors[index].link}</p>}
                {proj.link && parseGitHubUrl(proj.link) && (
                  <button
                    type="button"
                    onClick={() => importFromGitHub(index)}
                    disabled={importingIndex === index}
                    className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#2d6a4f] hover:text-[#1a1a1a] transition-colors disabled:opacity-50"
                  >
                    {importingIndex === index ? (
                      <div className="w-3 h-3 border border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    )}
                    {importingIndex === index ? "Importing…" : "Auto-fill from GitHub"}
                  </button>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">
                Tech Stack / Tools Used <span className="text-[#2d6a4f]">*</span>
              </label>
              <input
                type="text"
                value={proj.details}
                onChange={(e) => handleChange(index, "details", e.target.value)}
                className={inputClass(errors[index]?.details)}
                placeholder="React, Node.js, PostgreSQL, AWS"
              />
              {errors[index]?.details && <p className="mt-1 text-red-500 text-xs">{errors[index].details}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">
                What does it do? <span className="text-stone-400 font-normal">(AI will enhance)</span>
              </label>
              <textarea
                value={proj.description}
                onChange={(e) => handleChange(index, "description", e.target.value)}
                className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-[#1a1a1a] placeholder-stone-400 focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] outline-none transition-all resize-none"
                rows={2}
                placeholder="Built an AI-powered tool that generates tailored resumes..."
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addProject}
        className="w-full py-3 border-2 border-dashed border-stone-200 text-[#6b7280] hover:border-[#2d6a4f]/40 hover:text-[#2d6a4f] hover:bg-[#2d6a4f]/5 rounded-xl transition-all flex items-center justify-center gap-2 font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Another Project
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

export default ProjectForm;
