"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    if (!email) { setEmailError("Email is required"); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError("Enter a valid email address"); return false; }
    setEmailError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await fetch("/python/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col">
      <header className="border-b border-[#e5e3de] bg-white/80 backdrop-blur px-6 py-4">
        <Link href="/" className="font-bold text-xl">
          Pari<span className="text-[#2d6a4f]">chaya</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md"
        >
          {!submitted ? (
            <>
              <h1 className="text-3xl font-bold mb-2">Reset password</h1>
              <p className="text-[#6b7280] text-sm mb-8">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <label
                  className="block text-stone-500 mb-1.5 uppercase tracking-widest"
                  style={{ fontSize: "11px", fontFamily: "var(--font-mono)" }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(""); }}
                  placeholder="you@example.com"
                  className={`w-full px-4 py-3 rounded-xl border bg-white text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] transition-all text-sm ${
                    emailError ? "border-red-300" : "border-stone-200"
                  }`}
                />
                {emailError && (
                  <p className="mt-1 text-red-500" style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                    {emailError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-5 py-3.5 bg-[#1a1a1a] text-white font-semibold rounded-full hover:bg-[#2d6a4f] transition-colors duration-200 shadow-lg shadow-black/10 disabled:opacity-50 text-[15px]"
                >
                  {loading ? "Sending..." : "Send Reset Link →"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-[#6b7280]">
                <Link href="/login" className="text-[#2d6a4f] font-semibold hover:underline">
                  ← Back to Sign In
                </Link>
              </p>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-6 text-2xl text-emerald-600">
                ✓
              </div>
              <h2 className="text-2xl font-bold mb-3">Check your email</h2>
              <p className="text-[#6b7280] mb-8 leading-relaxed">
                If an account with{" "}
                <span className="font-semibold text-[#1a1a1a]">{email}</span> exists, you&apos;ll
                receive a password reset link shortly.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a1a1a] text-white font-semibold rounded-full hover:bg-[#2d6a4f] transition-colors duration-200 text-sm"
              >
                ← Back to Sign In
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
