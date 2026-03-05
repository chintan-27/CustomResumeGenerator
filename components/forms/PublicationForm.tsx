"use client";

import React, { useState, useEffect } from "react";

interface Publication {
  title: string;
  authors: string;
  venue: string;
  year: string;
  doi: string;
  link: string;
  abstract: string;
}

const emptyPub: Publication = {
  title: "", authors: "", venue: "", year: "", doi: "", link: "", abstract: "",
};

const isValidUrl = (url: string) => {
  if (!url) return true;
  try { new URL(url.startsWith("http") ? url : `https://${url}`); return true; } catch { return false; }
};

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 40 }, (_, i) => String(currentYear - i + 2));

const PublicationForm = ({
  nextStep,
  prevStep,
  onChange,
  initialData = [],
}: {
  nextStep: () => void;
  prevStep: () => void;
  onChange: (data: any) => void;
  initialData?: Publication[];
}) => {
  const [pubList, setPubList] = useState<Publication[]>([{ ...emptyPub }]);
  const [errors, setErrors] = useState<Record<string, string>[]>([{}]);

  useEffect(() => {
    if (initialData.length > 0) {
      setPubList(initialData);
      setErrors(initialData.map(() => ({})));
    }
  }, []);

  const update = (idx: number, field: keyof Publication, value: string) => {
    const updated = pubList.map((p, i) => i === idx ? { ...p, [field]: value } : p);
    setPubList(updated);
    onChange(updated);
    if (errors[idx]?.[field]) {
      const newErrors = [...errors];
      newErrors[idx] = { ...newErrors[idx], [field]: "" };
      setErrors(newErrors);
    }
  };

  const addPub = () => { setPubList([...pubList, { ...emptyPub }]); setErrors([...errors, {}]); };

  const removePub = (idx: number) => {
    if (pubList.length === 1) { setPubList([{ ...emptyPub }]); setErrors([{}]); return; }
    const updated = pubList.filter((_, i) => i !== idx);
    setPubList(updated);
    setErrors(errors.filter((_, i) => i !== idx));
    onChange(updated);
  };

  const validate = () => {
    const newErrors = pubList.map((p) => {
      const e: Record<string, string> = {};
      if (!p.title.trim()) e.title = "Title is required";
      if (!p.authors.trim()) e.authors = "Authors are required";
      if (!p.venue.trim()) e.venue = "Venue / journal is required";
      if (p.link && !isValidUrl(p.link)) e.link = "Enter a valid URL";
      return e;
    });
    setErrors(newErrors);
    return newErrors.every((e) => Object.keys(e).length === 0);
  };

  const handleNext = () => {
    const allEmpty = pubList.every((p) => !p.title.trim() && !p.authors.trim());
    if (allEmpty || validate()) {
      onChange(allEmpty ? [] : pubList);
      nextStep();
    }
  };

  const inputClass = (err?: string) =>
    `w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-[#2d6a4f]/20 focus:bg-white ${
      err ? "border-red-300 bg-red-50" : "border-stone-200 bg-stone-50 focus:border-[#2d6a4f]"
    }`;

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-[#1a1a1a]">Publications</h2>
        <p className="text-[#6b7280] text-sm mt-1">Research papers, articles, conference proceedings</p>
        <span className="inline-block mt-2 text-xs text-stone-400 bg-stone-100 rounded-full px-3 py-1">Optional — skip if none</span>
      </div>

      {pubList.map((pub, idx) => (
        <div key={idx} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-stone-400" style={{ fontFamily: "var(--font-mono)" }}>
              Publication {idx + 1}
            </span>
            {pubList.length > 1 && (
              <button onClick={() => removePub(idx)} className="text-xs text-red-400 hover:text-red-600 transition-colors">
                Remove
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1a1a1a] mb-1.5">Paper Title *</label>
            <input value={pub.title} onChange={(e) => update(idx, "title", e.target.value)}
              className={inputClass(errors[idx]?.title)}
              placeholder="Attention Is All You Need" />
            {errors[idx]?.title && <p className="mt-1 text-red-500 text-xs">{errors[idx].title}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1a1a1a] mb-1.5">Authors *</label>
            <input value={pub.authors} onChange={(e) => update(idx, "authors", e.target.value)}
              className={inputClass(errors[idx]?.authors)}
              placeholder="Your Name, Co-Author Name, et al." />
            {errors[idx]?.authors && <p className="mt-1 text-red-500 text-xs">{errors[idx].authors}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#1a1a1a] mb-1.5">Venue / Journal *</label>
              <input value={pub.venue} onChange={(e) => update(idx, "venue", e.target.value)}
                className={inputClass(errors[idx]?.venue)}
                placeholder="NeurIPS, Nature, IEEE TPAMI..." />
              {errors[idx]?.venue && <p className="mt-1 text-red-500 text-xs">{errors[idx].venue}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a] mb-1.5">Year</label>
              <select value={pub.year} onChange={(e) => update(idx, "year", e.target.value)}
                className={inputClass()}>
                <option value="">Year</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a] mb-1.5">DOI</label>
              <input value={pub.doi} onChange={(e) => update(idx, "doi", e.target.value)}
                className={inputClass()} placeholder="10.xxxx/xxxxx" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a] mb-1.5">Link</label>
              <input value={pub.link} onChange={(e) => update(idx, "link", e.target.value)}
                className={inputClass(errors[idx]?.link)} placeholder="https://arxiv.org/..." />
              {errors[idx]?.link && <p className="mt-1 text-red-500 text-xs">{errors[idx].link}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1a1a1a] mb-1.5">Abstract <span className="text-stone-400 font-normal">(optional)</span></label>
            <textarea value={pub.abstract} onChange={(e) => update(idx, "abstract", e.target.value)}
              rows={3}
              className={`${inputClass()} resize-none`}
              placeholder="Brief summary of the paper..." />
          </div>
        </div>
      ))}

      <button onClick={addPub}
        className="w-full py-3 border-2 border-dashed border-stone-200 rounded-2xl text-sm font-medium text-stone-400 hover:border-[#2d6a4f]/40 hover:text-[#2d6a4f] transition-colors">
        + Add Another Publication
      </button>

      <div className="flex justify-between pt-2">
        <button onClick={prevStep} className="px-6 py-3 text-[#6b7280] font-medium rounded-full hover:bg-stone-100 transition-colors">
          Back
        </button>
        <button onClick={handleNext}
          className="px-8 py-3 bg-[#1a1a1a] text-white font-semibold rounded-full hover:bg-[#2d6a4f] transition-colors shadow-lg shadow-black/10 text-sm">
          Continue →
        </button>
      </div>
    </div>
  );
};

export default PublicationForm;
