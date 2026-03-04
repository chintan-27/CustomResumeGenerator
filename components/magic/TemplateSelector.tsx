import React, { useState } from "react";

interface Template {
  id: string;
  name: string;
  description: string;
  ats_compliant: boolean;
  preview_image?: string;
}

interface TemplateSelectorProps {
  templates: Template[];
  onSubmit: (templateId: string, pageCount: number) => void;
  onBack: () => void;
  loading: boolean;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  onSubmit,
  onBack,
  loading,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("skills-first");
  const [pageCount, setPageCount] = useState<number>(1);

  const handleSubmit = () => {
    onSubmit(selectedTemplate, pageCount);
  };

  const getTemplateGradient = (id: string) => {
    const gradients: Record<string, string> = {
      "classic": "from-slate-100 to-gray-100",
      "modern": "from-blue-50 to-indigo-50",
      "minimal": "from-gray-50 to-slate-50",
      "skills-first": "from-violet-50 to-purple-50",
      "executive": "from-amber-50 to-orange-50",
      "ats-optimized": "from-emerald-50 to-teal-50",
    };
    return gradients[id] || "from-gray-50 to-slate-50";
  };

  const getTemplateAccent = (id: string) => {
    const accents: Record<string, string> = {
      "classic": "border-slate-300 text-slate-600",
      "modern": "border-blue-300 text-blue-600",
      "minimal": "border-gray-300 text-gray-600",
      "skills-first": "border-violet-300 text-violet-600",
      "executive": "border-amber-300 text-amber-600",
      "ats-optimized": "border-emerald-300 text-emerald-600",
    };
    return accents[id] || "border-gray-300 text-gray-600";
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 mb-6 shadow-lg shadow-violet-500/30">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Choose Your Template
        </h2>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          All templates are ATS-compliant and designed for 2026 hiring standards
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => setSelectedTemplate(template.id)}
            className={`
              relative text-left p-5 rounded-2xl border-2 transition-all duration-300 group
              ${selectedTemplate === template.id
                ? "border-violet-500 bg-violet-50 shadow-lg shadow-violet-500/20 scale-[1.02]"
                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
              }
            `}
          >
            {/* Selected indicator */}
            {selectedTemplate === template.id && (
              <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}

            {/* Preview placeholder */}
            <div className={`aspect-[8.5/11] rounded-xl bg-gradient-to-br ${getTemplateGradient(template.id)} mb-4 flex items-center justify-center border ${getTemplateAccent(template.id).split(' ')[0]} overflow-hidden`}>
              <div className="w-3/4 space-y-2 p-3">
                <div className="h-3 bg-gray-300/50 rounded-full w-2/3 mx-auto" />
                <div className="h-1.5 bg-gray-200/50 rounded-full w-full" />
                <div className="h-1.5 bg-gray-200/50 rounded-full w-5/6" />
                <div className="h-1.5 bg-gray-200/50 rounded-full w-full" />
                <div className="h-1.5 bg-gray-200/50 rounded-full w-4/5" />
                <div className="h-2 bg-gray-300/50 rounded-full w-1/2 mt-3" />
                <div className="h-1.5 bg-gray-200/50 rounded-full w-full" />
                <div className="h-1.5 bg-gray-200/50 rounded-full w-3/4" />
              </div>
            </div>

            <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
            <p className="text-sm text-gray-500 mb-3">{template.description}</p>

            {template.ats_compliant && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                ATS Compliant
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Page Count Selection */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-10">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Resume Length
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setPageCount(1)}
            className={`p-5 rounded-xl border-2 transition-all duration-200 text-left ${
              pageCount === 1
                ? "border-violet-500 bg-violet-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-gray-900">1</span>
              <span className="text-gray-500">Page</span>
            </div>
            <p className="text-sm text-gray-500">3 experiences, 2 projects</p>
            {pageCount === 1 && (
              <span className="inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">
                Recommended
              </span>
            )}
          </button>
          <button
            onClick={() => setPageCount(2)}
            className={`p-5 rounded-xl border-2 transition-all duration-200 text-left ${
              pageCount === 2
                ? "border-violet-500 bg-violet-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-gray-900">2</span>
              <span className="text-gray-500">Pages</span>
            </div>
            <p className="text-sm text-gray-500">5 experiences, 4 projects</p>
            <span className="inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
              Senior roles
            </span>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`
            group px-8 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300
            ${loading
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 hover:-translate-y-0.5"
            }
          `}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating PDF...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Generate Resume
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default TemplateSelector;
