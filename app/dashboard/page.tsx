"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Link from "next/link";

const Dashboard: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    const checkOnboardingStatus = async () => {
      try {
        const response = await fetch("/python/user/status", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to check onboarding status");
        }
        if (!data.onboarding_completed) {
          router.push("/onboarding");
        }
      } catch (err: any) {
        console.error("Onboarding check failed:", err.message);
      }
    };

    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/python/user/dashboard", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch dashboard data");
        }
        setDashboardData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkOnboardingStatus();
    fetchDashboardData();
  }, [session, router]);

  const renderProfileTab = () => {
    if (loading) return <p>Loading your profile...</p>;
    if (error) return <p className="text-red-500">Error: {error}</p>;
    if (!dashboardData) return null;

    const { user, education, experience, projects, skills } = dashboardData;

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Profile Overview</h2>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Location:</strong> {user.city || 'N/A'}, {user.state || 'N/A'}, {user.country || 'N/A'}</p>
        <p><strong>LinkedIn:</strong> {user.linkedin || 'N/A'}</p>
        <p><strong>GitHub:</strong> {user.github || 'N/A'}</p>
        <p><strong>Phone Number:</strong> {user.number || 'N/A'}</p>
        <p><strong>Website:</strong> {user.website || 'N/A'}</p>

        <h3 className="text-xl font-semibold mt-6">Education</h3>
        {education.map((edu: any, index: number) => (
          <div key={index}>
            <p><strong>University:</strong> {edu.university}</p>
            <p><strong>Degree:</strong> {edu.degree}</p>
            <p><strong>Major:</strong> {edu.major}</p>
            <p><strong>GPA:</strong> {edu.gpa || 'N/A'}</p>
            <p><strong>Max GPA:</strong> {edu.max_gpa || 'N/A'}</p>
            <p><strong>Start Date:</strong> {edu.start_date || 'N/A'}</p>
            <p><strong>End Date:</strong> {edu.end_date || 'N/A'}</p>
            <p><strong>Location:</strong> {edu.city || 'N/A'}, {edu.state || 'N/A'}, {edu.country || 'N/A'}</p>
            <p><strong>Relevant Coursework:</strong> {edu.relevant_coursework || 'N/A'}</p>
          </div>
        ))}

        <h3 className="text-xl font-semibold mt-6">Experience</h3>
        {experience.map((exp: any, index: number) => (
          <div key={index}>
            <p><strong>Position:</strong> {exp.position}</p>
            <p><strong>Company:</strong> {exp.company}</p>
            <p><strong>Description:</strong> {exp.description}</p>
            <p><strong>Start Date:</strong> {exp.start_date || 'N/A'}</p>
            <p><strong>End Date:</strong> {exp.end_date || 'N/A'}</p>
            <p><strong>Current:</strong> {exp.current ? 'Yes' : 'No'}</p>
          </div>
        ))}

        <h3 className="text-xl font-semibold mt-6">Projects</h3>
        {projects.map((proj: any, index: number) => (
          <div key={index}>
            <p><strong>Project Name:</strong> {proj.name}</p>
            <p><strong>Description:</strong> {proj.description}</p>
            <p><strong>Link:</strong> {proj.link || 'N/A'}</p>
            <p><strong>Details:</strong> {proj.details || 'N/A'}</p>
          </div>
        ))}

        <h3 className="text-xl font-semibold mt-6">Skills</h3>
        <p>{skills}</p>
      </div>
    );
  };

  const renderResumeMagicTab = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Your Resumes</h2>
        <p className="text-gray-600 text-lg mb-6">Manage and create resumes tailored for jobs</p>
        
        <Link href="/magic">
          <Button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 text-lg rounded-lg shadow-md transition duration-300">
            Create a New Resume
          </Button>
        </Link>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="flex justify-between items-center mb-8">
        <div className="flex space-x-4">
          <button onClick={() => setActiveTab("profile")} className={`p-2 ${activeTab === "profile" ? "font-bold border-b-2 border-blue-500" : ""}`}>
            Profile
          </button>
          <button onClick={() => setActiveTab("resume-magic")} className={`p-2 ${activeTab === "resume-magic" ? "font-bold border-b-2 border-blue-500" : ""}`}>
            Resumes
          </button>
        </div>
        <Button 
          onClick={() => signOut({ callbackUrl: "/login" })} 
          className="bg-red-500 text-white hover:bg-red-600 p-2 rounded"
        >
          Logout
        </Button>
      </div>
      <div>
        {activeTab === "profile" ? renderProfileTab() : renderResumeMagicTab()}
      </div>
    </div>
  );
};

export default Dashboard;
