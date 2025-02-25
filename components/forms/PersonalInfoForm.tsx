"use client";

import React, { useState } from "react";

const PersonalInfoForm = ({ nextStep, onChange }: { nextStep: () => void; onChange: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    city: "",
    state: "",
    number: "",
    website: "",
    linkedin: "",
    github: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChange(formData);
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold">Personal Information</h2>
      
      <div>
        <label className="block text-gray-700">Linkedin</label>
        <input
          type="url"
          name="linkedin"
          value={formData.linkedin}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
          required
        />
      </div>
      
      <div>
        <label className="block text-gray-700">GitHub</label>
        <input
          type="url"
          name="github"
          value={formData.github}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
          required
        />
      </div>
      
      <div>
        <label className="block text-gray-700">City</label>
        <input
          type="text"
          name="city"
          value={formData.city}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>
      
      <div>
        <label className="block text-gray-700">State</label>
        <input
          type="text"
          name="state"
          value={formData.state}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>
      
      <div>
        <label className="block text-gray-700">Phone Number</label>
        <input
          type="tel"
          name="number"
          value={formData.number}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>

      <div>
        <label className="block text-gray-700">Website</label>
        <input
          type="url"
          name="website"
          value={formData.website}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>

      <button type="submit" className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Next
      </button>
    </form>
  );
};

export default PersonalInfoForm;
