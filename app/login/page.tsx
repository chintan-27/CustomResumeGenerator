"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { useSession, signIn } from "next-auth/react";

const Login: React.FC = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.push("/dashboard");
  }, [status, router]);

  const validate = () => {
    const e: typeof errors = {};
    if (!formData.email) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = "Enter a valid email";
    if (!formData.password) e.password = "Password is required";
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
      const result = await signIn("email-password", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });
      if (result?.error) setSubmitError("Invalid email or password. Please try again.");
      else router.push("/dashboard");
    } catch {
      setSubmitError("An unexpected error occurred. Please try again.");
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

  return (
    <div className="min-h-screen flex">
      {/* Left: Dark brand panel */}
      <div className="hidden lg:flex lg:w-[44%] bg-[#0f1f18] flex-col justify-between p-12 relative overflow-hidden">
        {/* Orbs */}
        <div className="absolute top-20 right-0 w-80 h-80 rounded-full bg-[#2d6a4f] opacity-20 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-10 left-0 w-60 h-60 rounded-full bg-[#c97d3f] opacity-10 blur-[70px] pointer-events-none" />

        <Link href="/" className="font-bold text-xl text-white relative z-10">
          Resume<span className="text-[#4ade80]">AI</span>
        </Link>

        <div className="relative z-10">
          <h1
            className="text-white font-bold leading-tight mb-5"
            style={{ fontSize: "clamp(2rem, 3.5vw, 3.2rem)" }}
          >
            Welcome
            <br />
            back.
          </h1>
          <p className="text-white/45 text-base leading-relaxed max-w-xs">
            Continue crafting your perfect, ATS-optimized resume with AI assistance.
          </p>
        </div>

        <p className="text-white/25 relative z-10" style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}>
          50,000+ professionals use ResumeAI
        </p>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="font-bold text-xl">
              Resume<span className="text-[#2d6a4f]">AI</span>
            </Link>
          </div>

          <h2 className="text-3xl font-bold mb-1">Sign in</h2>
          <p className="text-[#6b7280] text-sm mb-8">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#2d6a4f] font-semibold hover:underline">
              Sign up
            </Link>
          </p>

          {submitError && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
              {submitError}
            </div>
          )}

          {/* Google */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 transition-colors font-medium text-sm shadow-sm"
          >
            <FcGoogle size={20} />
            Continue with Google
          </button>

          <div className="flex items-center my-5 gap-3">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-stone-400" style={{ fontSize: "11px", fontFamily: "var(--font-mono)" }}>
              or
            </span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                className="block text-stone-500 mb-1.5 uppercase tracking-widest"
                style={{ fontSize: "11px", fontFamily: "var(--font-mono)" }}
              >
                Email address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`w-full px-4 py-3 rounded-xl border bg-stone-50 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] focus:bg-white transition-all text-sm ${
                  errors.email ? "border-red-300 bg-red-50" : "border-stone-200"
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-red-500" style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label
                  className="text-stone-500 uppercase tracking-widest"
                  style={{ fontSize: "11px", fontFamily: "var(--font-mono)" }}
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[#2d6a4f] hover:underline"
                  style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}
                >
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={`w-full px-4 py-3 rounded-xl border bg-stone-50 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] focus:bg-white transition-all text-sm ${
                  errors.password ? "border-red-300 bg-red-50" : "border-stone-200"
                }`}
              />
              {errors.password && (
                <p className="mt-1 text-red-500" style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-[#1a1a1a] text-white font-semibold rounded-full hover:bg-[#2d6a4f] transition-colors duration-200 shadow-lg shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed text-[15px]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign in →"
              )}
            </button>
          </form>

          <p
            className="text-center text-stone-400 mt-8"
            style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}
          >
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
