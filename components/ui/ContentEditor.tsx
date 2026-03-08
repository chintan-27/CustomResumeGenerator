import React, { useState } from "react";
import { useSession } from "next-auth/react";

interface ContentEditorProps {
  originalText: string;
  generatedText: string;
  keywordsUsed?: string[];
  onApprove: (approved: boolean, editedText?: string) => void;
  entityType?: string;
  entityName?: string;
  entityDescription?: string;
  className?: string;
}

const ContentEditor: React.FC<ContentEditorProps> = ({
  originalText,
  generatedText,
  keywordsUsed = [],
  onApprove,
  entityType = "experience",
  entityName = "",
  entityDescription = "",
  className = "",
}) => {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(generatedText);
  const [approved, setApproved] = useState(false);
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [aiInstruction, setAiInstruction] = useState("");
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteError, setRewriteError] = useState("");

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
    onApprove(true, editedText !== generatedText ? editedText : undefined);
  };

  const handleReject = () => {
    setApproved(false);
    onApprove(false);
  };

  const handleAiRewrite = async () => {
    if (!aiInstruction.trim()) return;
    setIsRewriting(true);
    setRewriteError("");
    try {
      const res = await fetch("/python/resume/rewrite-bullet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          bullet_text: editedText,
          instruction: aiInstruction,
          entity_type: entityType,
          entity_name: entityName,
          entity_description: entityDescription,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rewrite failed");
      setEditedText(data.rewritten);
      setAiInstruction("");
      setShowAiPrompt(false);
      setIsEditing(false);
      // Mark as unapproved so user reviews the new text
      setApproved(false);
    } catch (err: unknown) {
      setRewriteError(err instanceof Error ? err.message : "Rewrite failed");
    } finally {
      setIsRewriting(false);
    }
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
            dangerouslySetInnerHTML={{ __html: highlightKeywords(editedText) }}
          />
        )}
      </div>

      {/* AI Rewrite panel */}
      {showAiPrompt && (
        <div className="mx-5 mb-4 p-4 bg-stone-50 border border-stone-200 rounded-xl">
          <p className="text-xs font-medium text-[#1a1a1a] mb-2 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-[#2d6a4f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Rewrite instruction
          </p>
          <textarea
            value={aiInstruction}
            onChange={(e) => setAiInstruction(e.target.value)}
            placeholder='e.g. "make it more quantified", "use stronger action verbs", "emphasize leadership"'
            className="w-full px-3 py-2.5 rounded-lg border border-stone-200 bg-white text-sm text-[#1a1a1a] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] resize-none leading-relaxed"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAiRewrite();
            }}
          />
          {rewriteError && (
            <p className="mt-2 text-xs text-red-500">{rewriteError}</p>
          )}
          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={handleAiRewrite}
              disabled={isRewriting || !aiInstruction.trim()}
              className="px-4 py-1.5 text-xs font-semibold bg-[#1a1a1a] text-white rounded-full hover:bg-[#2d6a4f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isRewriting ? (
                <>
                  <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Rewriting…
                </>
              ) : (
                "Rewrite"
              )}
            </button>
            <button
              onClick={() => { setShowAiPrompt(false); setAiInstruction(""); setRewriteError(""); }}
              className="px-4 py-1.5 text-xs font-medium text-[#6b7280] border border-stone-200 rounded-full hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <span className="ml-auto text-xs text-stone-400">⌘↵ to rewrite</span>
          </div>
        </div>
      )}

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
          onClick={() => { setShowAiPrompt(!showAiPrompt); setRewriteError(""); }}
          className={`px-4 py-2 text-xs font-medium rounded-full transition-colors flex items-center gap-1.5 ${
            showAiPrompt
              ? "bg-[#2d6a4f]/10 text-[#2d6a4f] border border-[#2d6a4f]/20"
              : "text-[#6b7280] border border-stone-200 hover:bg-stone-100"
          }`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI Rewrite
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
