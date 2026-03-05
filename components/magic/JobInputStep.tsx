import React from "react";

interface JobInputStepProps {
  jobDescription: string;
  setJobDescription: (value: string) => void;
  onAnalyze: () => void;
  loading: boolean;
  error?: string;
}

const JobInputStep: React.FC<JobInputStepProps> = ({
  jobDescription,
  setJobDescription,
  onAnalyze,
  loading,
  error,
}) => {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0f1f18] mb-6 shadow-lg shadow-black/20">
          <svg className="w-8 h-8 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-[#1a1a1a] mb-3">
          Paste Your Target Job Description
        </h2>
        <p className="text-[#6b7280] text-lg max-w-xl mx-auto">
          Our AI will analyze the requirements and create a tailored resume that speaks directly to recruiters
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-8">
          <textarea
            className="w-full h-72 p-5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] focus:bg-white resize-none transition-all duration-200 text-[#1a1a1a] placeholder-stone-400 outline-none"
            placeholder="Paste the full job description here...

Example:
We are looking for a Senior Software Engineer with 3+ years of experience in React, TypeScript, and Node.js. The ideal candidate will have experience with cloud services (AWS/GCP), microservices architecture, and agile methodologies.

Responsibilities:
• Design and implement scalable web applications
• Collaborate with cross-functional teams
• Mentor junior developers..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#6b7280]">
              {jobDescription.length} characters
            </span>
            {jobDescription.length > 0 && jobDescription.length < 100 && (
              <span className="text-sm text-[#c97d3f] flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Add more details for better results
              </span>
            )}
          </div>
          <button
            onClick={onAnalyze}
            disabled={loading || jobDescription.length < 50}
            className={`
              group relative px-8 py-3.5 rounded-full font-semibold text-sm transition-all duration-300
              ${loading || jobDescription.length < 50
                ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                : "bg-[#1a1a1a] text-white shadow-lg shadow-black/10 hover:bg-[#2d6a4f] hover:-translate-y-0.5"
              }
            `}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Analyze & Continue
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
        <div className="p-5 rounded-2xl bg-white border border-stone-200">
          <div className="w-10 h-10 rounded-xl bg-[#2d6a4f]/10 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-[#2d6a4f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="font-semibold text-[#1a1a1a] mb-1">Smart Analysis</h3>
          <p className="text-sm text-[#6b7280]">AI extracts key requirements and skills from any job posting</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-stone-200">
          <div className="w-10 h-10 rounded-xl bg-[#2d6a4f]/10 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-[#2d6a4f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-[#1a1a1a] mb-1">ATS Optimized</h3>
          <p className="text-sm text-[#6b7280]">Keywords matched exactly for applicant tracking systems</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-stone-200">
          <div className="w-10 h-10 rounded-xl bg-[#c97d3f]/10 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-[#c97d3f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="font-semibold text-[#1a1a1a] mb-1">No Hallucinations</h3>
          <p className="text-sm text-[#6b7280]">Content grounded only in your real experience</p>
        </div>
      </div>
    </div>
  );
};

export default JobInputStep;
