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

  const getTemplatePreviewBg = (id: string) => {
    const bgs: Record<string, string> = {
      "classic": "from-stone-100 to-stone-50",
      "modern": "from-stone-50 to-white",
      "minimal": "from-white to-stone-50",
      "skills-first": "from-[#2d6a4f]/10 to-[#2d6a4f]/5",
      "executive": "from-[#0f1f18]/10 to-stone-50",
      "ats-optimized": "from-stone-100 to-white",
    };
    return bgs[id] || "from-stone-50 to-white";
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0f1f18] mb-6 shadow-lg shadow-black/20">
          <svg className="w-8 h-8 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-[#1a1a1a] mb-3">
          Choose Your Template
        </h2>
        <p className="text-[#6b7280] text-lg max-w-xl mx-auto">
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
                ? "border-[#2d6a4f] shadow-lg shadow-[#2d6a4f]/10 scale-[1.02] bg-white"
                : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-md"
              }
            `}
          >
            {selectedTemplate === template.id && (
              <div className="absolute -top-2 -right-2 w-7 h-7 bg-[#2d6a4f] rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}

            {/* Preview placeholder */}
            <div className={`aspect-[8.5/11] rounded-xl bg-gradient-to-br ${getTemplatePreviewBg(template.id)} mb-4 flex items-center justify-center border border-stone-200 overflow-hidden`}>
              <div className="w-3/4 space-y-2 p-3">
                <div className="h-3 bg-stone-300/50 rounded-full w-2/3 mx-auto" />
                <div className="h-1.5 bg-stone-200/50 rounded-full w-full" />
                <div className="h-1.5 bg-stone-200/50 rounded-full w-5/6" />
                <div className="h-1.5 bg-stone-200/50 rounded-full w-full" />
                <div className="h-1.5 bg-stone-200/50 rounded-full w-4/5" />
                <div className="h-2 bg-stone-300/50 rounded-full w-1/2 mt-3" />
                <div className="h-1.5 bg-stone-200/50 rounded-full w-full" />
                <div className="h-1.5 bg-stone-200/50 rounded-full w-3/4" />
              </div>
            </div>

            <h3 className="font-semibold text-[#1a1a1a] mb-1">{template.name}</h3>
            <p className="text-sm text-[#6b7280] mb-3">{template.description}</p>

            {template.ats_compliant && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[#2d6a4f]/10 text-[#2d6a4f]">
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
      <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-10 shadow-sm">
        <h3 className="font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#2d6a4f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Resume Length
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setPageCount(1)}
            className={`p-5 rounded-xl border-2 transition-all duration-200 text-left ${
              pageCount === 1
                ? "border-[#2d6a4f] bg-[#2d6a4f]/5"
                : "border-stone-200 hover:border-stone-300"
            }`}
          >
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-[#1a1a1a]">1</span>
              <span className="text-[#6b7280]">Page</span>
            </div>
            <p className="text-sm text-[#6b7280]">3 experiences, 2 projects</p>
            {pageCount === 1 && (
              <span className="inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full bg-[#1a1a1a] text-white">
                Recommended
              </span>
            )}
          </button>
          <button
            onClick={() => setPageCount(2)}
            className={`p-5 rounded-xl border-2 transition-all duration-200 text-left ${
              pageCount === 2
                ? "border-[#2d6a4f] bg-[#2d6a4f]/5"
                : "border-stone-200 hover:border-stone-300"
            }`}
          >
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-[#1a1a1a]">2</span>
              <span className="text-[#6b7280]">Pages</span>
            </div>
            <p className="text-sm text-[#6b7280]">5 experiences, 4 projects</p>
            <span className="inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full bg-stone-100 text-stone-600">
              Senior roles
            </span>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="px-6 py-3 text-[#6b7280] font-medium rounded-full hover:bg-stone-100 transition-colors flex items-center gap-2"
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
            group px-8 py-3.5 rounded-full font-semibold text-sm transition-all duration-300 flex items-center gap-2
            ${loading
              ? "bg-stone-100 text-stone-400 cursor-not-allowed"
              : "bg-[#1a1a1a] text-white shadow-lg shadow-black/10 hover:bg-[#2d6a4f] hover:-translate-y-0.5"
            }
          `}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating PDF...
            </>
          ) : (
            <>
              Generate Resume
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TemplateSelector;
