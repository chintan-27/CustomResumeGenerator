import React, { useState } from "react";

interface ContentEditorProps {
  originalText: string;
  generatedText: string;
  keywordsUsed?: string[];
  onApprove: (approved: boolean, editedText?: string) => void;
  className?: string;
}

const ContentEditor: React.FC<ContentEditorProps> = ({
  originalText,
  generatedText,
  keywordsUsed = [],
  onApprove,
  className = "",
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(generatedText);
  const [approved, setApproved] = useState(false);

  const highlightKeywords = (text: string) => {
    if (!keywordsUsed.length) return text;
    let highlighted = text;
    keywordsUsed.forEach((keyword) => {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escaped})`, "gi");
      highlighted = highlighted.replace(
        regex,
        '<mark style="background:#fef08a;color:#1a1a1a;padding:0 2px;border-radius:3px;">$1</mark>'
      );
    });
    return highlighted;
  };

  const handleApprove = () => {
    setApproved(true);
    onApprove(true, isEditing ? editedText : undefined);
  };

  const handleReject = () => {
    setApproved(false);
    onApprove(false);
  };

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
        approved
          ? "border-[#2d6a4f]/30 bg-[#2d6a4f]/5"
          : "border-stone-200 bg-white"
      } ${className}`}
    >
      {/* Original text toggle */}
      <details className="group">
        <summary className="px-5 pt-4 pb-2 text-xs font-medium text-[#6b7280] cursor-pointer hover:text-[#1a1a1a] select-none list-none flex items-center gap-1.5">
          <svg
            className="w-3 h-3 transition-transform group-open:rotate-90"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          View original description
        </summary>
        <p className="mx-5 mb-3 text-sm text-[#6b7280] bg-stone-50 border border-stone-200 rounded-xl p-3 leading-relaxed">
          {originalText}
        </p>
      </details>

      {/* Generated bullet */}
      <div className="px-5 pb-4">
        <p className="text-xs font-medium text-[#6b7280] mb-2">Generated bullet point:</p>
        {isEditing ? (
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] resize-none leading-relaxed"
            rows={3}
          />
        ) : (
          <p
            className="text-sm text-[#1a1a1a] bg-stone-50 rounded-xl px-4 py-3 leading-relaxed break-words"
            dangerouslySetInnerHTML={{ __html: highlightKeywords(isEditing ? editedText : generatedText) }}
          />
        )}
      </div>

      {/* Keywords */}
      {keywordsUsed.length > 0 && (
        <div className="px-5 pb-4 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-[#6b7280]">Keywords used:</span>
          {keywordsUsed.map((kw, i) => (
            <span
              key={i}
              className="text-xs px-2.5 py-1 bg-[#2d6a4f]/10 text-[#2d6a4f] rounded-full border border-[#2d6a4f]/20 font-medium"
            >
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="px-5 pb-4 flex items-center gap-2">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 text-xs font-medium text-[#6b7280] border border-stone-200 rounded-full hover:bg-stone-100 transition-colors"
        >
          {isEditing ? "Preview" : "Edit"}
        </button>
        <button
          onClick={approved ? handleReject : handleApprove}
          className={`px-4 py-2 text-xs font-semibold rounded-full transition-all duration-200 ${
            approved
              ? "bg-[#2d6a4f] text-white shadow-sm shadow-[#2d6a4f]/20"
              : "bg-[#2d6a4f]/10 text-[#2d6a4f] hover:bg-[#2d6a4f] hover:text-white"
          }`}
        >
          {approved ? "✓ Approved" : "Approve"}
        </button>
      </div>
    </div>
  );
};

export default ContentEditor;
