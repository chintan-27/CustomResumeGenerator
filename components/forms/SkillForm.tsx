"use client";

import React, { useState } from "react";
import TagInput from "@/components/ui/TagInput";

const SkillForm = ({ nextStep, prevStep, onChange }: { nextStep: () => void; prevStep: () => void; onChange: (data: any) => void }) => {
  const [skills, setSkills] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChange({ skills });
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-auto">
      <h2 className="text-2xl font-bold mb-4">Skills</h2>
      <div className="mb-4">
        <label className="block text-gray-700">Add Your Skills</label>
        <TagInput 
          tags={skills}
          setTags={setSkills}
        />
      </div>
      <div className="flex justify-between">
        <button type="button" onClick={prevStep} className="p-2 bg-gray-300 rounded">
          Back
        </button>
        <button type="submit" className="p-2 bg-blue-500 text-white rounded">
          Next
        </button>
      </div>
    </form>
  );
};

export default SkillForm;
