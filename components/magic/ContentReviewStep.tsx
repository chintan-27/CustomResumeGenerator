import React, { useState } from "react";
import ContentEditor from "@/components/ui/ContentEditor";

interface GeneratedContent {
  type: string;
  target_id: number;
  target_name: string;
  position?: string;
  original_text: string;
  generated_text: string;
  keywords_used: string[];
  grounding_source: string;
}

interface ContentReview {
  content_id?: number;
  approved: boolean;
  edited_text?: string;
}

interface ContentReviewStepProps {
  generatedContent: GeneratedContent[];
  skillsOrganized: Record<string, string[]>;
  onSubmit: (reviews: ContentReview[]) => void;
  onBack: () => void;
  loading: boolean;
}

const ContentReviewStep: React.FC<ContentReviewStepProps> = ({
  generatedContent,
  skillsOrganized,
  onSubmit,
  onBack,
  loading,
}) => {
  const [reviews, setReviews] = useState<Record<string, ContentReview>>({});

  const handleApprove = (index: number, approved: boolean, editedText?: string) => {
    setReviews((prev) => ({
      ...prev,
      [index]: { approved, edited_text: editedText },
    }));
  };

  const handleSubmit = () => {
    const reviewsList = Object.entries(reviews).map(([index, review]) => ({
      content_id: parseInt(index),
      ...review,
    }));
    onSubmit(reviewsList);
  };

  // Group content by type and target
  const experienceContent: Record<string, GeneratedContent[]> = {};
  const projectContent: Record<string, GeneratedContent[]> = {};

  generatedContent.forEach((content, index) => {
    const key = `${content.target_id}-${content.target_name}`;
    const contentWithIndex = { ...content, _index: index };

    if (content.type === "experience") {
      if (!experienceContent[key]) experienceContent[key] = [];
      experienceContent[key].push(contentWithIndex as GeneratedContent & { _index: number });
    } else if (content.type === "project") {
      if (!projectContent[key]) projectContent[key] = [];
      projectContent[key].push(contentWithIndex as GeneratedContent & { _index: number });
    }
  });

  const approvedCount = Object.values(reviews).filter((r) => r.approved).length;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-6 shadow-lg shadow-emerald-500/30">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Review Your Generated Content
        </h2>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Review, edit, and approve each bullet point. All content is grounded in your actual data.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <span className="text-sm text-emerald-700">
            {approvedCount} of {generatedContent.length} approved
          </span>
        </div>
      </div>

      {/* Anti-hallucination notice */}
      <div className="mb-8 p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-emerald-900 mb-1">Grounded Content Guarantee</h4>
            <p className="text-sm text-emerald-700">
              Every bullet point is generated ONLY from your provided information.
              No metrics, skills, or achievements have been invented.
              <span className="inline-block ml-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-medium">Keywords highlighted</span> are from the job description.
            </p>
          </div>
        </div>
      </div>

      {/* Experience bullets */}
      {Object.keys(experienceContent).length > 0 && (
        <div className="mb-8 bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-violet-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              Experience Bullet Points
            </h3>
          </div>
          <div className="p-6">
            {Object.entries(experienceContent).map(([key, bullets]) => (
              <div key={key} className="mb-6 last:mb-0">
                <h4 className="font-medium text-gray-800 mb-4 pb-2 border-b border-gray-100">
                  {bullets[0]?.position} at {bullets[0]?.target_name}
                </h4>
                <div className="space-y-4">
                  {bullets.map((bullet: GeneratedContent & { _index?: number }) => (
                    <ContentEditor
                      key={bullet._index}
                      originalText={bullet.original_text}
                      generatedText={bullet.generated_text}
                      keywordsUsed={bullet.keywords_used}
                      onApprove={(approved, editedText) =>
                        handleApprove(bullet._index!, approved, editedText)
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project bullets */}
      {Object.keys(projectContent).length > 0 && (
        <div className="mb-8 bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              Project Bullet Points
            </h3>
          </div>
          <div className="p-6">
            {Object.entries(projectContent).map(([key, bullets]) => (
              <div key={key} className="mb-6 last:mb-0">
                <h4 className="font-medium text-gray-800 mb-4 pb-2 border-b border-gray-100">{bullets[0]?.target_name}</h4>
                <div className="space-y-4">
                  {bullets.map((bullet: GeneratedContent & { _index?: number }) => (
                    <ContentEditor
                      key={bullet._index}
                      originalText={bullet.original_text}
                      generatedText={bullet.generated_text}
                      keywordsUsed={bullet.keywords_used}
                      onApprove={(approved, editedText) =>
                        handleApprove(bullet._index!, approved, editedText)
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills preview */}
      {Object.keys(skillsOrganized).length > 0 && (
        <div className="mb-8 bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              Skills (Organized by Category)
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(skillsOrganized).map(([category, skills]) => (
                <div key={category}>
                  <h5 className="font-medium text-gray-800 mb-3 text-sm">{category}</h5>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, i) => (
                      <span
                        key={i}
                        className="inline-block bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 text-xs font-medium px-3 py-1.5 rounded-full border border-purple-100"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-10 flex justify-between items-center">
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
          className={`group px-8 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
            loading
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 hover:-translate-y-0.5"
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Continue to Template Selection
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

export default ContentReviewStep;
