"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { signIn, useSession } from "next-auth/react";

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.push("/dashboard");
  }, [status, router]);

  const validate = () => {
    const e: typeof errors = {};
    if (!formData.name.trim()) e.name = "Name is required";
    if (!formData.email) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = "Enter a valid email";
    if (!formData.password) e.password = "Password is required";
    else if (formData.password.length < 8) e.password = "Min. 8 characters";
    if (!formData.confirmPassword) e.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name as keyof typeof errors])
      setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitError("");
    setLoading(true);
    try {
      const response = await fetch("python/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Signup failed");
      setSuccess(true);
      const result = await signIn("email-password", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });
      if (result?.error) throw new Error(result.error);
      router.push("/onboarding");
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
        <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const fields = [
    { name: "name", label: "Full Name", type: "text", placeholder: "John Doe" },
    { name: "email", label: "Email Address", type: "email", placeholder: "you@example.com" },
    { name: "password", label: "Password", type: "password", placeholder: "Min. 8 characters" },
    { name: "confirmPassword", label: "Confirm Password", type: "password", placeholder: "Repeat your password" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left: Dark brand panel */}
      <div className="hidden lg:flex lg:w-[44%] bg-[#0f1f18] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-20 right-0 w-80 h-80 rounded-full bg-[#2d6a4f] opacity-20 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-[#c97d3f] opacity-10 blur-[70px] pointer-events-none" />

        <Link href="/" className="font-bold text-xl text-white relative z-10">
          Resume<span className="text-[#4ade80]">AI</span>
        </Link>

        <div className="relative z-10">
          <h1
            className="text-white font-bold leading-tight mb-5"
            style={{ fontSize: "clamp(1.8rem, 3.5vw, 3rem)" }}
          >
            Your resume,
            <br />
            perfected
            <br />
            by AI.
          </h1>
          <div className="space-y-3 mt-8">
            {[
              "ATS-optimized templates",
              "AI content — zero hallucinations",
              "Exact keyword matching",
              "Instant, print-ready PDF",
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#4ade80]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#4ade80]" style={{ fontSize: "10px" }}>✓</span>
                </div>
                <span className="text-white/50 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/25 relative z-10" style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}>
          50,000+ professionals use ResumeAI
        </p>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md py-8"
        >
          <div className="lg:hidden mb-8">
            <Link href="/" className="font-bold text-xl">
              Resume<span className="text-[#2d6a4f]">AI</span>
            </Link>
          </div>

          <h2 className="text-3xl font-bold mb-1">Create account</h2>
          <p className="text-[#6b7280] text-sm mb-8">
            Already have an account?{" "}
            <Link href="/login" className="text-[#2d6a4f] font-semibold hover:underline">
              Sign in
            </Link>
          </p>

          {submitError && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
              {submitError}
            </div>
          )}

          {success && (
            <div className="mb-5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium">
              Account created! Redirecting...
            </div>
          )}

          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 transition-colors font-medium text-sm shadow-sm mb-5"
          >
            <FcGoogle size={20} />
            Continue with Google
          </button>

          <div className="flex items-center mb-5 gap-3">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-stone-400" style={{ fontSize: "11px", fontFamily: "var(--font-mono)" }}>
              or
            </span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {fields.map((field) => (
              <div key={field.name}>
                <label
                  className="block text-stone-500 mb-1.5 uppercase tracking-widest"
                  style={{ fontSize: "11px", fontFamily: "var(--font-mono)" }}
                >
                  {field.label}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name as keyof typeof formData]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className={`w-full px-4 py-3 rounded-xl border bg-stone-50 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] focus:bg-white transition-all text-sm ${
                    errors[field.name as keyof typeof errors] ? "border-red-300 bg-red-50" : "border-stone-200"
                  }`}
                />
                {errors[field.name as keyof typeof errors] && (
                  <p className="mt-1 text-red-500" style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                    {errors[field.name as keyof typeof errors]}
                  </p>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-[#1a1a1a] text-white font-semibold rounded-full hover:bg-[#2d6a4f] transition-colors duration-200 shadow-lg shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed text-[15px]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                "Create account →"
              )}
            </button>
          </form>

          <p
            className="text-center text-stone-400 mt-8"
            style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}
          >
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
