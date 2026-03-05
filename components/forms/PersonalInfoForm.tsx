"use client";

import React, { useState, useEffect } from "react";

const PersonalInfoForm = ({
  nextStep,
  onChange,
  initialData = {}
}: {
  nextStep: () => void;
  onChange: (data: any) => void;
  initialData?: any;
}) => {
  const [formData, setFormData] = useState({
    city: "",
    state: "",
    number: "",
    website: "",
    linkedin: "",
    github: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData((prev) => ({ ...prev, ...initialData }));
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors((prev) => { const n = { ...prev }; delete n[e.target.name]; return n; });
    }
  };

  const isValidUrl = (url: string) => {
    if (!url) return true;
    try { new URL(url.startsWith("http") ? url : `https://${url}`); return true; } catch { return false; }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.linkedin) {
      errs.linkedin = "LinkedIn profile is required";
    } else if (!isValidUrl(formData.linkedin)) {
      errs.linkedin = "Enter a valid LinkedIn URL";
    }
    if (formData.github && !isValidUrl(formData.github)) {
      errs.github = "Enter a valid GitHub URL";
    }
    if (formData.website && !isValidUrl(formData.website)) {
      errs.website = "Enter a valid website URL";
    }
    if (formData.number && formData.number.replace(/\D/g, "").length < 10) {
      errs.number = "Phone number must be at least 10 digits";
    }
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onChange(formData);
    nextStep();
  };

  const inputClass = (field: string) =>
    `w-full pl-10 pr-4 py-3 border rounded-xl text-[#1a1a1a] placeholder-stone-400 focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] focus:bg-white outline-none transition-all ${
      errors[field]
        ? "border-red-300 bg-red-50"
        : "border-stone-200 bg-stone-50"
    }`;

  const plainInputClass = (field: string) =>
    `w-full px-4 py-3 border rounded-xl text-[#1a1a1a] placeholder-stone-400 focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] focus:bg-white outline-none transition-all ${
      errors[field]
        ? "border-red-300 bg-red-50"
        : "border-stone-200 bg-stone-50"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0f1f18] mb-4 shadow-lg shadow-black/20">
          <svg className="w-7 h-7 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#1a1a1a]">Your Contact Info</h2>
        <p className="text-[#6b7280] mt-1">How can employers reach you?</p>
      </div>

      {/* Professional Links */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest">Professional Links</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">
              LinkedIn <span className="text-[#2d6a4f]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </span>
              <input
                type="text"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange}
                className={inputClass("linkedin")}
                placeholder="linkedin.com/in/yourname"
              />
            </div>
            {errors.linkedin && <p className="mt-1 text-red-500 text-xs">{errors.linkedin}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">GitHub</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </span>
              <input
                type="text"
                name="github"
                value={formData.github}
                onChange={handleChange}
                className={inputClass("github")}
                placeholder="github.com/yourname"
              />
            </div>
            {errors.github && <p className="mt-1 text-red-500 text-xs">{errors.github}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">Website/Portfolio</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </span>
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className={inputClass("website")}
              placeholder="yourwebsite.com"
            />
          </div>
          {errors.website && <p className="mt-1 text-red-500 text-xs">{errors.website}</p>}
        </div>
      </div>

      {/* Contact Details */}
      <div className="space-y-4 pt-4 border-t border-stone-100">
        <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest">Contact Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">Phone</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </span>
              <input
                type="tel"
                name="number"
                value={formData.number}
                onChange={handleChange}
                className={inputClass("number")}
                placeholder="(555) 123-4567"
              />
            </div>
            {errors.number && <p className="mt-1 text-red-500 text-xs">{errors.number}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={plainInputClass("city")}
                placeholder="San Francisco"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={plainInputClass("state")}
                placeholder="CA"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="pt-6">
        <button
          type="submit"
          className="w-full py-3.5 bg-[#1a1a1a] text-white font-semibold rounded-full shadow-lg shadow-black/10 hover:bg-[#2d6a4f] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
        >
          Continue
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </form>
  );
};

export default PersonalInfoForm;
