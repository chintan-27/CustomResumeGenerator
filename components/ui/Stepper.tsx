import React from "react";

interface Step {
  id: string;
  label: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: string;
  className?: string;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep, className = "" }) => {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between relative">
        {/* Progress bar background */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10" />

        {/* Active progress bar */}
        <div
          className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-500 -z-10"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = step.id === currentStep;
          const isUpcoming = index > currentIndex;

          return (
            <div key={step.id} className="flex flex-col items-center relative">
              {/* Step circle */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                  transition-all duration-300 border-2
                  ${isCompleted ? "bg-gradient-to-br from-violet-600 to-indigo-600 border-transparent text-white shadow-lg shadow-violet-500/30" : ""}
                  ${isCurrent ? "bg-white border-violet-600 text-violet-600 shadow-lg shadow-violet-500/20 scale-110" : ""}
                  ${isUpcoming ? "bg-gray-50 border-gray-200 text-gray-400" : ""}
                `}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className={isCurrent ? "font-bold" : ""}>{index + 1}</span>
                )}
              </div>

              {/* Label */}
              <div className="mt-3 text-center">
                <span
                  className={`text-xs font-medium transition-colors duration-300 ${
                    isCurrent ? "text-violet-600" : isCompleted ? "text-gray-700" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Stepper;
