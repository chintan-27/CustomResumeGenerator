"use client";

import React from "react";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { motion } from "framer-motion";
import Card from "@/components/ui/Card";

const Home: React.FC = () => {
  return (
    <div className="bg-[#f9f9f9] text-black flex flex-col min-h-screen">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 bg-opacity-90 backdrop-blur-md">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 via-purple-500 to-black text-transparent bg-clip-text">
          AI Resume Generator
        </h1>
        <div>
          <Link href="/login" className="mr-4 text-gray-600 hover:text-black">Login</Link>
          <Link href="/signup">
            <Button className="bg-orange-500 hover:bg-purple-500 rounded-2xl px-6 py-2">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="h-screen flex flex-col justify-center items-center text-center px-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-7xl font-bold bg-gradient-to-r from-orange-500 via-purple-500 to-black text-transparent bg-clip-text">
            AI-Powered Resume Builder
          </h1>
          <p className="text-lg text-gray-700">
            Effortlessly create job-winning resumes tailored to your job application with the power of AI.
          </p>
          <Link href="/signup">
            <Button className="mt-6 px-6 py-3 text-lg font-semibold bg-orange-500 hover:bg-purple-500 rounded-2xl transition-all">
              Start Now
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="h-screen flex flex-col justify-center items-center text-center px-10">
        <h2 className="text-5xl font-bold text-black">How It Works</h2>
        <div className="flex justify-center mt-8 space-x-10">
          <Card className="max-w-xs p-6 bg-white shadow-md rounded-xl">
            <h3 className="text-xl font-semibold text-orange-400">Step 1</h3>
            <p className="text-gray-700 mt-2">Enter your details and job description.</p>
          </Card>
          <Card className="max-w-xs p-6 bg-white shadow-md rounded-xl">
            <h3 className="text-xl font-semibold text-purple-400">Step 2</h3>
            <p className="text-gray-700 mt-2">AI analyzes and crafts a professional resume.</p>
          </Card>
          <Card className="max-w-xs p-6 bg-white shadow-md rounded-xl">
            <h3 className="text-xl font-semibold text-orange-400">Step 3</h3>
            <p className="text-gray-700 mt-2">Download and use it to apply instantly.</p>
          </Card>
        </div>
      </section>

      {/* Additional Section - Benefits */}
      <section className="h-screen flex flex-col justify-center items-center text-center px-10 bg-white">
        <h2 className="text-5xl font-bold text-black">Why Choose AI Resumes?</h2>
        <p className="text-gray-700 max-w-3xl mx-auto mt-4">
          Our AI-driven approach ensures your resume is ATS-friendly, well-structured, and optimized for the job you want.
        </p>
      </section>

      {/* Footer */}
      <footer className="p-6 text-center bg-black text-white mt-auto">
        <p>&copy; 2025 AI Resume Generator. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
