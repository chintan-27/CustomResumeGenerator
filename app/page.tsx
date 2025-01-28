"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";

type ResumeResponse = {
  resumeUrl: string;
};

const Home: React.FC = () => {
  const [jobDescription, setJobDescription] = useState<string>("");
  const [yamlFile, setYamlFile] = useState<File | null>(null);
  const [resumeURL, setResumeURL] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Handle file change event
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setYamlFile(e.target.files[0]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!jobDescription || !yamlFile) {
      alert("Please provide a job description and upload a YAML file.");
      return;
    }

    const formData = new FormData();
    formData.append("job_description", jobDescription);
    formData.append("yaml_file", yamlFile);

    // try {
      setLoading(true);
      const response = await axios.post<Blob>("http://localhost:5000/generate-resume", formData, {
        responseType: "blob",
      });

      // Create URL for the PDF blob
      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const pdfURL = URL.createObjectURL(pdfBlob);
      setResumeURL(pdfURL);
    // } catch (error) {
    //   console.error("Error generating resume:", error);
    //   alert("An error occurred while generating the resume.");
    // } finally {
      setLoading(false);
    // }
  };

  return (
    <div>
      <h1>Resume Generator</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="Paste job description here"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={6}
          style={{ width: "100%", marginBottom: "16px" }}
        />
        <input
          type="file"
          accept=".yaml"
          onChange={handleFileChange}
          style={{ marginBottom: "16px" }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Generating..." : "Generate Resume"}
        </button>
      </form>

      {resumeURL && (
        <div style={{ marginTop: "24px" }}>
          <h2>Your Resume:</h2>
          <a href={resumeURL} target="_blank" rel="noopener noreferrer">
            Download Resume
          </a>
        </div>
      )}
    </div>
  );
};

export default Home;
