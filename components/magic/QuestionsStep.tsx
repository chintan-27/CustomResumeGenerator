import React from "react";

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
  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // Group questions by target entity
  const experienceQuestions = questions.filter((q) => q.target_entity === "experience");
  const projectQuestions = questions.filter((q) => q.target_entity === "project");

  const getTargetName = (question: Question): string => {
    // Use target_name from question if available (from backend)
    if (question.target_name) {
      return question.target_name;
    }
    // Fallback to looking up from arrays
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
            className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
            placeholder="Enter a number..."
          />
        );
      case "radio":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {question.options?.map((option, i) => (
              <label
                key={i}
                className={`flex items-center gap-3 p-3.5 bg-white border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  value === option
                    ? 'border-violet-500 bg-violet-50 shadow-sm shadow-violet-500/20'
                    : 'border-gray-200 hover:border-violet-300 hover:bg-gray-50'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  value === option ? 'border-violet-500 bg-violet-500' : 'border-gray-300'
                }`}>
                  {value === option && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <span className={`text-sm font-medium ${value === option ? 'text-violet-700' : 'text-gray-700'}`}>
                  {option}
                </span>
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="sr-only"
                />
              </label>
            ))}
          </div>
        );
      case "multiselect":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {question.options?.map((option, i) => {
              const selectedOptions = value ? value.split(",").filter(Boolean) : [];
              const isSelected = selectedOptions.includes(option);
              return (
                <label
                  key={i}
                  className={`flex items-center gap-3 p-3.5 bg-white border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-violet-500 bg-violet-50 shadow-sm shadow-violet-500/20'
                      : 'border-gray-200 hover:border-violet-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    isSelected ? 'border-violet-500 bg-violet-500' : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm font-medium ${isSelected ? 'text-violet-700' : 'text-gray-700'}`}>
                    {option}
                  </span>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {
                      const newSelected = isSelected
                        ? selectedOptions.filter((o) => o !== option)
                        : [...selectedOptions, option];
                      handleAnswerChange(question.id, newSelected.join(","));
                    }}
                    className="sr-only"
                  />
                </label>
              );
            })}
          </div>
        );
      default:
        // Fallback to text, but style it nicely
        return (
          <textarea
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all resize-none"
            rows={2}
            placeholder="Type your answer..."
          />
        );
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "metrics":
        return { label: "Metrics", color: "bg-purple-100 text-purple-700" };
      case "verification":
        return { label: "Clarification", color: "bg-blue-100 text-blue-700" };
      case "gap_filling":
        return { label: "Details", color: "bg-green-100 text-green-700" };
      default:
        return { label: "Question", color: "bg-gray-100 text-gray-700" };
    }
  };

  const answeredCount = Object.values(answers).filter((a) => a && a.trim()).length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 mb-6 shadow-lg shadow-violet-500/30">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Help Us Strengthen Your Resume
        </h2>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Answer these questions to add specific metrics and details to your bullet points
        </p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-50 rounded-full border border-violet-100">
          <div className="w-2 h-2 bg-violet-500 rounded-full" />
          <span className="text-sm text-violet-700">
            {answeredCount} of {questions.length} answered (optional but recommended)
          </span>
        </div>
      </div>

      <div className="space-y-8">
        {/* Experience Questions */}
        {experienceQuestions.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-violet-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                Experience Questions
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-5">
                {experienceQuestions.map((question) => {
                  const typeInfo = getQuestionTypeLabel(question.question_type);
                  return (
                    <div key={question.id} className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          {getTargetName(question)}
                        </span>
                      </div>
                      <label className="block text-base font-semibold text-gray-900 mb-2">
                        {question.question_text}
                      </label>
                      {question.context && (
                        <p className="text-sm text-gray-500 mb-4 flex items-start gap-1.5">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          </div>
        )}

        {/* Project Questions */}
        {projectQuestions.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                Project Questions
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-5">
                {projectQuestions.map((question) => {
                  const typeInfo = getQuestionTypeLabel(question.question_type);
                  return (
                    <div key={question.id} className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          {getTargetName(question)}
                        </span>
                      </div>
                      <label className="block text-base font-semibold text-gray-900 mb-2">
                        {question.question_text}
                      </label>
                      {question.context && (
                        <p className="text-sm text-gray-500 mb-4 flex items-start gap-1.5">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          </div>
        )}
      </div>

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
          onClick={onSubmit}
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
              Generating Content...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Continue to Generation
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

export default QuestionsStep;
