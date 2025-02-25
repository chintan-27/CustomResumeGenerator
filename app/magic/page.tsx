"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";

const MagicPage: React.FC = () => {
  const { data: session } = useSession();
  const [jobDescription, setJobDescription] = useState("");
  const [latexContent, setLatexContent] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerateResume = async () => {
    setLoading(true);
    setError("");

    try {
      const token = session?.accessToken;
      if (!token) throw new Error("Authentication token is missing");

      const response = await fetch("/python/resume/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ job_description: jobDescription }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate resume");
      }

      // Extract JSON response
      const jsonResponse = await response.json();
      setLatexContent(jsonResponse.latex_content);

      // Construct the full PDF URL
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5328";
      setPdfUrl(`${baseUrl}/${jsonResponse.pdf_url}`);

    } catch (err: any) {
      setError(err.message || "An error occurred while generating the resume.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">Generate Your AI-Powered Resume</h1>
      
      <textarea
        className="w-full max-w-2xl p-4 border border-gray-300 rounded mb-4"
        placeholder="Paste the job description here..."
        rows={6}
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
      />

      {error && <p className="text-red-500">{error}</p>}

      <Button
        onClick={handleGenerateResume}
        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md transition duration-300"
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate Resume"}
      </Button>

      {/* Display LaTeX content */}
      {latexContent && (
        <div className="mt-8 w-full max-w-2xl p-4 bg-white border border-gray-300 rounded">
          <h2 className="text-xl font-bold mb-2">LaTeX Content</h2>
          <pre className="text-sm overflow-x-auto">{latexContent}</pre>
        </div>
      )}

      {/* Display PDF if generated */}
      {pdfUrl && (
        <div className="mt-8 w-full max-w-2xl p-4 bg-white border border-gray-300 rounded">
          <h2 className="text-xl font-bold mb-2">Generated Resume (PDF)</h2>
          <iframe src={pdfUrl} className="w-full h-[600px] border rounded" />
          <a
            href={pdfUrl}
            download="resume.pdf"
            className="block mt-4 text-blue-500 hover:underline text-center"
          >
            Download PDF
          </a>
        </div>
      )}
    </div>
  );
};

export default MagicPage;
