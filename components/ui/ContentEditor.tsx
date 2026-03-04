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
      const regex = new RegExp(`(${keyword})`, "gi");
      highlighted = highlighted.replace(
        regex,
        '<span class="bg-yellow-200 px-1 rounded">$1</span>'
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
    <div className={`border rounded-lg p-4 bg-white ${className}`}>
      {/* Original text - collapsed by default */}
      <details className="mb-3">
        <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
          View original description
        </summary>
        <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded">{originalText}</p>
      </details>

      {/* Generated text */}
      <div className="mb-3">
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Generated bullet point:
        </label>
        {isEditing ? (
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />
        ) : (
          <p
            className="text-sm p-3 bg-blue-50 rounded-lg"
            dangerouslySetInnerHTML={{ __html: highlightKeywords(generatedText) }}
          />
        )}
      </div>

      {/* Keywords used */}
      {keywordsUsed.length > 0 && (
        <div className="mb-3">
          <span className="text-xs text-gray-500">Keywords used: </span>
          {keywordsUsed.map((keyword, i) => (
            <span
              key={i}
              className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded mr-1 mb-1"
            >
              {keyword}
            </span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition"
        >
          {isEditing ? "Preview" : "Edit"}
        </button>
        <button
          onClick={handleApprove}
          className={`text-sm px-3 py-1.5 rounded-lg transition ${
            approved
              ? "bg-green-500 text-white"
              : "bg-green-100 text-green-700 hover:bg-green-200"
          }`}
        >
          {approved ? "Approved" : "Approve"}
        </button>
        {approved && (
          <button
            onClick={handleReject}
            className="text-sm px-3 py-1.5 text-red-600 hover:text-red-700"
          >
            Undo
          </button>
        )}
      </div>
    </div>
  );
};

export default ContentEditor;
