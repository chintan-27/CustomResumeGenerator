import React from "react";

interface FinalPreviewProps {
  pdfUrl: string;
  latexContent: string;
  templateUsed: string;
  onStartOver: () => void;
  onBack: () => void;
}

const FinalPreview: React.FC<FinalPreviewProps> = ({
  pdfUrl,
  latexContent,
  templateUsed,
  onStartOver,
  onBack,
}) => {
  const [showLatex, setShowLatex] = React.useState(false);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = "resume.pdf";
    link.click();
  };

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(latexContent);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Success Header */}
      <div className="bg-[#0f1f18] rounded-2xl p-10 text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#2d6a4f] mb-6 shadow-lg">
          <svg className="w-10 h-10 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">
          Your Resume is Ready!
        </h2>
        <p className="text-white/50">
          Template: <span className="font-medium text-[#4ade80]">{templateUsed}</span>
        </p>
      </div>

      {/* PDF Preview Card */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-8 shadow-sm">
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-3 text-sm text-[#6b7280] font-medium" style={{ fontFamily: "var(--font-mono)" }}>
              resume.pdf
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLatex(!showLatex)}
              className="px-4 py-2 text-sm font-medium text-[#6b7280] hover:text-[#1a1a1a] hover:bg-stone-100 rounded-xl transition-colors"
            >
              {showLatex ? "Show PDF" : "View LaTeX"}
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-sm font-semibold bg-[#1a1a1a] text-white rounded-full hover:bg-[#2d6a4f] transition-colors shadow-lg shadow-black/10"
            >
              Download
            </button>
          </div>
        </div>
        <div className="p-6">
          {showLatex ? (
            <div className="relative">
              <button
                onClick={handleCopyLatex}
                className="absolute top-3 right-3 px-3 py-1.5 text-xs font-medium bg-white/10 text-[#4ade80] rounded-xl hover:bg-white/20 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
              <pre className="bg-[#0f1f18] text-[#4ade80] p-6 rounded-2xl overflow-x-auto text-sm max-h-[600px] overflow-y-auto font-mono">
                {latexContent}
              </pre>
            </div>
          ) : (
            <div className="bg-stone-100 rounded-2xl overflow-hidden">
              <iframe
                src={pdfUrl}
                className="w-full h-[700px] border-0"
                title="Resume Preview"
              />
            </div>
          )}
        </div>
      </div>

      {/* Next Steps Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-8 shadow-sm">
        <h3 className="font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#2d6a4f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Next Steps
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { num: 1, title: "Review your resume", desc: "Make any final tweaks in the PDF" },
            { num: 2, title: "Test with ATS", desc: "Use Jobscan to verify compatibility" },
            { num: 3, title: "Write cover letter", desc: "Complement your tailored resume" },
            { num: 4, title: "Apply!", desc: "Submit before the deadline" },
          ].map((item) => (
            <div key={item.num} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#0f1f18] flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#4ade80]">{item.num}</span>
              </div>
              <div>
                <h4 className="font-medium text-[#1a1a1a] text-sm">{item.title}</h4>
                <p className="text-xs text-[#6b7280] mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
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
          Back to Templates
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={onStartOver}
            className="px-6 py-3 text-[#2d6a4f] font-medium rounded-full border border-[#2d6a4f]/30 hover:bg-[#2d6a4f]/5 transition-colors"
          >
            Generate for Another Job
          </button>
          <button
            onClick={handleDownload}
            className="group px-8 py-3.5 rounded-full font-semibold text-sm bg-[#1a1a1a] text-white shadow-lg shadow-black/10 hover:bg-[#2d6a4f] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Resume
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinalPreview;
