"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { useSession, signIn } from "next-auth/react";

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
  
    try {
      const result = await signIn("email-password", {
        redirect: false, // Prevent automatic redirection
        email: formData.email,
        password: formData.password,
      });
  
      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return status === "loading" ? (
    <p className="text-center text-gray-600">Loading...</p>
  ) : (
    <div className="h-screen flex flex-col justify-center items-center bg-[#f9f9f9] text-black">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-white p-8 shadow-lg rounded-xl w-96"
      >
        <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-orange-500 via-purple-500 to-black text-transparent bg-clip-text">
          Login
        </h2>
        {error && <p className="text-red-500 text-center mt-2">{error}</p>}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 p-3 mt-4 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
        >
          <FcGoogle size={24} /> Login with Google
        </button>
        <div className="flex items-center my-4">
          <hr className="flex-grow border-gray-300" />
          <span className="px-3 text-gray-500">or</span>
          <hr className="flex-grow border-gray-300" />
        </div>
        <form className="mt-4" onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 rounded-lg border border-gray-300 mt-2"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-3 rounded-lg border border-gray-300 mt-2"
            required
          />
          <Button type="submit" className="w-full mt-4 py-3 bg-orange-500 hover:bg-purple-500 rounded-lg text-white font-semibold" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
        <p className="text-center text-gray-600 mt-4">
          Don't have an account? <Link href="/signup" className="text-orange-500 hover:text-purple-500">Sign Up</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
