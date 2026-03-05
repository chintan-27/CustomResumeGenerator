"use client";

import React, { useState, useEffect } from "react";

interface Certification {
  name: string;
  issuer: string;
  date_issued: string;
  expiry_date: string;
  credential_id: string;
  link: string;
}

const emptyCert: Certification = {
  name: "", issuer: "", date_issued: "", expiry_date: "", credential_id: "", link: "",
};

const isValidUrl = (url: string) => {
  if (!url) return true;
  try { new URL(url.startsWith("http") ? url : `https://${url}`); return true; } catch { return false; }
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => String(currentYear - i + 5));

const CertificationForm = ({
  nextStep,
  prevStep,
  onChange,
  initialData = [],
}: {
  nextStep: () => void;
  prevStep: () => void;
  onChange: (data: any) => void;
  initialData?: Certification[];
}) => {
  const [certList, setCertList] = useState<Certification[]>([{ ...emptyCert }]);
  const [errors, setErrors] = useState<Record<string, string>[]>([{}]);

  useEffect(() => {
    if (initialData.length > 0) {
      setCertList(initialData);
      setErrors(initialData.map(() => ({})));
    }
  }, []);

  const update = (idx: number, field: keyof Certification, value: string) => {
    const updated = certList.map((c, i) => i === idx ? { ...c, [field]: value } : c);
    setCertList(updated);
    onChange(updated);
    if (errors[idx]?.[field]) {
      const newErrors = [...errors];
      newErrors[idx] = { ...newErrors[idx], [field]: "" };
      setErrors(newErrors);
    }
  };

  const addCert = () => {
    setCertList([...certList, { ...emptyCert }]);
    setErrors([...errors, {}]);
  };

  const removeCert = (idx: number) => {
    if (certList.length === 1) { setCertList([{ ...emptyCert }]); setErrors([{}]); return; }
    const updated = certList.filter((_, i) => i !== idx);
    setCertList(updated);
    setErrors(errors.filter((_, i) => i !== idx));
    onChange(updated);
  };

  const validate = () => {
    const newErrors = certList.map((c) => {
      const e: Record<string, string> = {};
      if (!c.name.trim()) e.name = "Certification name is required";
      if (!c.issuer.trim()) e.issuer = "Issuer is required";
      if (c.link && !isValidUrl(c.link)) e.link = "Enter a valid URL";
      return e;
    });
    setErrors(newErrors);
    return newErrors.every((e) => Object.keys(e).length === 0);
  };

  const handleNext = () => {
    // If all certs are empty, skip validation (section is optional)
    const allEmpty = certList.every((c) => !c.name.trim() && !c.issuer.trim());
    if (allEmpty || validate()) {
      onChange(allEmpty ? [] : certList);
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
        <h2 className="text-2xl font-bold text-[#1a1a1a]">Certifications</h2>
        <p className="text-[#6b7280] text-sm mt-1">AWS, Google Cloud, PMP, CFA — any credential worth showing</p>
        <span className="inline-block mt-2 text-xs text-stone-400 bg-stone-100 rounded-full px-3 py-1">Optional — skip if none</span>
      </div>

      {certList.map((cert, idx) => (
        <div key={idx} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-stone-400" style={{ fontFamily: "var(--font-mono)" }}>
              Cert {idx + 1}
            </span>
            {certList.length > 1 && (
              <button onClick={() => removeCert(idx)} className="text-xs text-red-400 hover:text-red-600 transition-colors">
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a] mb-1.5">Certification Name *</label>
              <input value={cert.name} onChange={(e) => update(idx, "name", e.target.value)}
                className={inputClass(errors[idx]?.name)} placeholder="AWS Solutions Architect" />
              {errors[idx]?.name && <p className="mt-1 text-red-500 text-xs">{errors[idx].name}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a] mb-1.5">Issuing Organization *</label>
              <input value={cert.issuer} onChange={(e) => update(idx, "issuer", e.target.value)}
                className={inputClass(errors[idx]?.issuer)} placeholder="Amazon Web Services" />
              {errors[idx]?.issuer && <p className="mt-1 text-red-500 text-xs">{errors[idx].issuer}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a] mb-1.5">Date Issued</label>
              <div className="flex gap-2">
                <select value={cert.date_issued?.split(" ")[0] || ""} onChange={(e) => {
                    const yr = cert.date_issued?.split(" ")[1] || "";
                    update(idx, "date_issued", e.target.value ? `${e.target.value} ${yr}` : "");
                  }} className={`flex-1 ${inputClass()}`}>
                  <option value="">Month</option>
                  {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={cert.date_issued?.split(" ")[1] || ""} onChange={(e) => {
                    const mo = cert.date_issued?.split(" ")[0] || "";
                    update(idx, "date_issued", e.target.value ? `${mo} ${e.target.value}` : "");
                  }} className={`flex-1 ${inputClass()}`}>
                  <option value="">Year</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a] mb-1.5">Expiry Date</label>
              <div className="flex gap-2">
                <select value={cert.expiry_date?.split(" ")[0] || ""} onChange={(e) => {
                    const yr = cert.expiry_date?.split(" ")[1] || "";
                    update(idx, "expiry_date", e.target.value ? `${e.target.value} ${yr}` : "");
                  }} className={`flex-1 ${inputClass()}`}>
                  <option value="">Month</option>
                  {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={cert.expiry_date?.split(" ")[1] || ""} onChange={(e) => {
                    const mo = cert.expiry_date?.split(" ")[0] || "";
                    update(idx, "expiry_date", e.target.value ? `${mo} ${e.target.value}` : "");
                  }} className={`flex-1 ${inputClass()}`}>
                  <option value="">Year</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <p className="text-xs text-stone-400 mt-1">Leave blank if no expiry</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a] mb-1.5">Credential ID</label>
              <input value={cert.credential_id} onChange={(e) => update(idx, "credential_id", e.target.value)}
                className={inputClass()} placeholder="ABC-123-XYZ" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a] mb-1.5">Verification Link</label>
              <input value={cert.link} onChange={(e) => update(idx, "link", e.target.value)}
                className={inputClass(errors[idx]?.link)} placeholder="https://..." />
              {errors[idx]?.link && <p className="mt-1 text-red-500 text-xs">{errors[idx].link}</p>}
            </div>
          </div>
        </div>
      ))}

      <button onClick={addCert}
        className="w-full py-3 border-2 border-dashed border-stone-200 rounded-2xl text-sm font-medium text-stone-400 hover:border-[#2d6a4f]/40 hover:text-[#2d6a4f] transition-colors">
        + Add Another Certification
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

export default CertificationForm;
