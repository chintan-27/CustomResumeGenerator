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
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 mb-6 shadow-lg shadow-emerald-500/30 animate-bounce-slow">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Your Resume is Ready!
        </h2>
        <p className="text-gray-500 text-lg">
          Template: <span className="font-medium text-violet-600">{templateUsed}</span>
        </p>
      </div>

      {/* PDF Preview Card */}
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-3 text-sm text-gray-500 font-medium">resume.pdf</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLatex(!showLatex)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {showLatex ? "Show PDF" : "View LaTeX"}
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-violet-500/30 transition-all"
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
                className="absolute top-3 right-3 px-3 py-1.5 text-xs font-medium bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
              <pre className="bg-gray-900 text-emerald-400 p-6 rounded-2xl overflow-x-auto text-sm max-h-[600px] overflow-y-auto font-mono">
                {latexContent}
              </pre>
            </div>
          ) : (
            <div className="bg-gray-100 rounded-2xl overflow-hidden">
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
      <div className="bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-50 rounded-2xl border border-violet-100 p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Next Steps
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-violet-600">1</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm">Review your resume</h4>
              <p className="text-xs text-gray-500 mt-0.5">Make any final tweaks in the PDF</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-violet-600">2</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm">Test with ATS</h4>
              <p className="text-xs text-gray-500 mt-0.5">Use Jobscan to verify compatibility</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-violet-600">3</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm">Write cover letter</h4>
              <p className="text-xs text-gray-500 mt-0.5">Complement your tailored resume</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-violet-600">4</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm">Apply!</h4>
              <p className="text-xs text-gray-500 mt-0.5">Submit before the deadline</p>
            </div>
          </div>
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
          Back to Templates
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={onStartOver}
            className="px-6 py-3 text-violet-600 font-medium rounded-xl border-2 border-violet-200 hover:bg-violet-50 transition-colors"
          >
            Generate for Another Job
          </button>
          <button
            onClick={handleDownload}
            className="group px-8 py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Resume
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinalPreview;
