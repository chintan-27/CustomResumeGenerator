import React from "react";

interface Template {
  id: string;
  name: string;
  description: string;
  ats_compliant: boolean;
  preview_image?: string;
}

interface TemplateCardProps {
  template: Template;
  selected: boolean;
  onSelect: () => void;
  className?: string;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  selected,
  onSelect,
  className = "",
}) => {
  return (
    <div
      onClick={onSelect}
      className={`
        relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200
        ${selected ? "border-blue-500 bg-blue-50 shadow-lg" : "border-gray-200 hover:border-gray-300 hover:shadow-md"}
        ${className}
      `}
    >
      {/* Selection indicator */}
      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Preview placeholder */}
      <div className="aspect-[8.5/11] bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
        {template.preview_image ? (
          <img
            src={template.preview_image}
            alt={`${template.name} preview`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center p-4">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs text-gray-400">Preview</span>
          </div>
        )}
      </div>

      {/* Template info */}
      <h3 className="font-semibold text-gray-800 mb-1">{template.name}</h3>
      <p className="text-sm text-gray-500 mb-2">{template.description}</p>

      {/* ATS badge */}
      {template.ats_compliant && (
        <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
          ATS Compliant
        </span>
      )}
    </div>
  );
};

export default TemplateCard;
