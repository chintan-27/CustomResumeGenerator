import React, { useState } from "react";

interface Question {
  id: number;
  question_type: string;
  target_entity: string;
  target_id: number;
  question_text: string;
  input_type: string;
  options?: string[];
  context?: string;
  target_name?: string;
}

interface Experience {
  id: number;
  position: string;
  company: string;
}

interface Project {
  id: number;
  name: string;
}

interface QuestionsStepProps {
  questions: Question[];
  experiences: Experience[];
  projects: Project[];
  answers: Record<number, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
}

const QuestionsStep: React.FC<QuestionsStepProps> = ({
  questions,
  experiences,
  projects,
  answers,
  setAnswers,
  onSubmit,
  onBack,
  loading,
}) => {
  // Separate state for free-text overrides (per question id)
  const [customText, setCustomText] = useState<Record<number, string>>({});

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleCustomTextChange = (questionId: number, text: string, inputType: string) => {
    setCustomText((prev) => ({ ...prev, [questionId]: text }));
    if (inputType === "radio") {
      // Custom text overrides the radio selection entirely
      handleAnswerChange(questionId, text || "");
    } else {
      // multiselect: preserve selected options, append custom text as extra entry
      const existing = answers[questionId] || "";
      const selectedOptions = existing
        .split(",")
        .filter((o) => o && questions.find((q) => q.id === questionId)?.options?.includes(o));
      const combined = text ? [...selectedOptions, text].join(",") : selectedOptions.join(",");
      handleAnswerChange(questionId, combined);
    }
  };

  const experienceQuestions = questions.filter((q) => q.target_entity === "experience");
  const projectQuestions = questions.filter((q) => q.target_entity === "project");

  const getTargetName = (question: Question): string => {
    if (question.target_name) return question.target_name;
    if (question.target_entity === "experience") {
      const exp = experiences[question.target_id];
      return exp ? `${exp.position} at ${exp.company}` : "Unknown experience";
    } else {
      const proj = projects[question.target_id];
      return proj ? proj.name : "Unknown project";
    }
  };

  const renderQuestionInput = (question: Question) => {
    const value = answers[question.id] || "";

    switch (question.input_type) {
      case "number":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] focus:bg-white outline-none transition-all"
            placeholder="Enter a number..."
          />
        );
      case "radio": {
        const custom = customText[question.id] || "";
        const isCustomActive = custom.length > 0;
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {question.options?.map((option, i) => (
                <div
                  key={i}
                  role="radio"
                  aria-checked={!isCustomActive && value === option}
                  tabIndex={0}
                  onClick={() => {
                    setCustomText((prev) => ({ ...prev, [question.id]: "" }));
                    handleAnswerChange(question.id, option);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      setCustomText((prev) => ({ ...prev, [question.id]: "" }));
                      handleAnswerChange(question.id, option);
                    }
                  }}
                  className={`flex items-center gap-3 p-3.5 bg-white border-2 rounded-xl cursor-pointer select-none transition-all duration-200 ${
                    !isCustomActive && value === option
                      ? "border-[#2d6a4f] bg-[#2d6a4f]/5"
                      : isCustomActive
                      ? "border-stone-200 opacity-50"
                      : "border-stone-200 hover:border-[#2d6a4f]/40 hover:bg-stone-50"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    !isCustomActive && value === option ? "border-[#2d6a4f] bg-[#2d6a4f]" : "border-stone-300"
                  }`}>
                    {!isCustomActive && value === option && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <span className={`text-sm font-medium ${!isCustomActive && value === option ? "text-[#2d6a4f]" : "text-[#1a1a1a]"}`}>
                    {option}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-stone-200" />
              <span className="text-xs text-stone-400 font-medium px-2">or type your own</span>
              <div className="flex-1 h-px bg-stone-200" />
            </div>
            <input
              type="text"
              value={custom}
              onChange={(e) => handleCustomTextChange(question.id, e.target.value, "radio")}
              placeholder="Type a specific value..."
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] focus:bg-white outline-none transition-all"
            />
          </div>
        );
      }
      case "multiselect": {
        const custom = customText[question.id] || "";
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {question.options?.map((option, i) => {
                const selectedOptions = value ? value.split(",").filter((o) => question.options?.includes(o)) : [];
                const isSelected = selectedOptions.includes(option);
                const toggle = () => {
                  const newSelected = isSelected
                    ? selectedOptions.filter((o) => o !== option)
                    : [...selectedOptions, option];
                  const combined = custom ? [...newSelected, custom].join(",") : newSelected.join(",");
                  handleAnswerChange(question.id, combined);
                };
                return (
                  <div
                    key={i}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onClick={toggle}
                    onKeyDown={(e) => (e.key === " " || e.key === "Enter") && toggle()}
                    className={`flex items-center gap-3 p-3.5 bg-white border-2 rounded-xl cursor-pointer select-none transition-all duration-200 ${
                      isSelected
                        ? "border-[#2d6a4f] bg-[#2d6a4f]/5"
                        : "border-stone-200 hover:border-[#2d6a4f]/40 hover:bg-stone-50"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                      isSelected ? "border-[#2d6a4f] bg-[#2d6a4f]" : "border-stone-300"
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm font-medium ${isSelected ? "text-[#2d6a4f]" : "text-[#1a1a1a]"}`}>
                      {option}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-stone-200" />
              <span className="text-xs text-stone-400 font-medium px-2">or add your own</span>
              <div className="flex-1 h-px bg-stone-200" />
            </div>
            <input
              type="text"
              value={custom}
              onChange={(e) => handleCustomTextChange(question.id, e.target.value, "multiselect")}
              placeholder="Add a specific technology, tool, or detail..."
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] focus:bg-white outline-none transition-all"
            />
          </div>
        );
      }
      default:
        return (
          <textarea
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] focus:bg-white outline-none transition-all resize-none"
            rows={2}
            placeholder="Type your answer..."
          />
        );
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "metrics":
        return { label: "Metrics", color: "bg-[#2d6a4f]/10 text-[#2d6a4f]" };
      case "verification":
        return { label: "Clarification", color: "bg-blue-50 text-blue-700" };
      case "gap_filling":
        return { label: "Details", color: "bg-amber-50 text-amber-700" };
      default:
        return { label: "Question", color: "bg-stone-100 text-stone-600" };
    }
  };

  const answeredCount = Object.values(answers).filter((a) => a && a.trim()).length;

  const renderGroup = (groupQuestions: Question[], title: string, icon: React.ReactNode) => (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
      <div className="px-6 py-4 bg-[#0f1f18] flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      <div className="p-6 space-y-5">
        {groupQuestions.map((question) => {
          const typeInfo = getQuestionTypeLabel(question.question_type);
          return (
            <div key={question.id} className="p-5 rounded-2xl bg-stone-50 border border-stone-200">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeInfo.color}`}>
                  {typeInfo.label}
                </span>
                <span className="text-xs text-[#6b7280] font-medium">{getTargetName(question)}</span>
              </div>
              <p className="text-base font-semibold text-[#1a1a1a] mb-2">
                {question.question_text}
              </p>
              {question.context && (
                <p className="text-sm text-[#6b7280] mb-4 flex items-start gap-1.5">
                  <svg className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {question.context}
                </p>
              )}
              {renderQuestionInput(question)}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0f1f18] mb-6 shadow-lg shadow-black/20">
          <svg className="w-8 h-8 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-[#1a1a1a] mb-3">
          Help Us Strengthen Your Resume
        </h2>
        <p className="text-[#6b7280] text-lg max-w-xl mx-auto">
          Answer these questions to add specific metrics and details to your bullet points
        </p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#2d6a4f]/10 rounded-full border border-[#2d6a4f]/20">
          <div className="w-2 h-2 bg-[#2d6a4f] rounded-full" />
          <span className="text-sm text-[#2d6a4f] font-medium">
            {answeredCount} of {questions.length} answered (optional but recommended)
          </span>
        </div>
      </div>

      <div className="space-y-8">
        {experienceQuestions.length > 0 && renderGroup(
          experienceQuestions,
          "Experience Questions",
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )}

        {projectQuestions.length > 0 && renderGroup(
          projectQuestions,
          "Project Questions",
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-10 flex justify-between items-center">
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
          onClick={onSubmit}
          disabled={loading}
          className={`group px-8 py-3.5 rounded-full font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
            loading
              ? "bg-stone-100 text-stone-400 cursor-not-allowed"
              : "bg-[#1a1a1a] text-white shadow-lg shadow-black/10 hover:bg-[#2d6a4f] hover:-translate-y-0.5"
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating Content...
            </>
          ) : (
            <>
              Continue to Generation
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

export default QuestionsStep;
