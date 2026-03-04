"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ResumeSession {
  id: number;
  template_id: string;
  page_count: number;
  status: string;
  created_at: string;
  job_title?: string;
}

const NAV_ITEMS = [
  { id: "resumes", label: "Resumes", icon: "◈" },
  { id: "profile", label: "Profile", icon: "◉" },
  { id: "experience", label: "Experience", icon: "◆" },
  { id: "education", label: "Education", icon: "◇" },
  { id: "projects", label: "Projects", icon: "◈" },
  { id: "skills", label: "Skills", icon: "◉" },
];

const Dashboard: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("resumes");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [resumeSessions, setResumeSessions] = useState<ResumeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { router.push("/login"); return; }

    const checkOnboarding = async () => {
      try {
        const res = await fetch("/python/user/status", {
          headers: { Authorization: `Bearer ${session?.accessToken}` },
        });
        const data = await res.json();
        if (!data.onboarding_completed) router.push("/onboarding");
      } catch (err) { console.error("Onboarding check failed:", err); }
    };

    const fetchDashboard = async () => {
      try {
        const res = await fetch("/python/user/dashboard", {
          headers: { Authorization: `Bearer ${session?.accessToken}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch dashboard");
        setDashboardData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkOnboarding();
    fetchDashboard();
  }, [session, status, router]);

  useEffect(() => {
    if (activeTab === "resumes" && session?.accessToken) fetchResumeSessions();
  }, [activeTab, session?.accessToken]);

  const fetchResumeSessions = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/python/resume/sessions", {
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setResumeSessions(data.sessions || []);
      }
    } catch (err) { console.error("Failed to fetch sessions:", err); }
    finally { setHistoryLoading(false); }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-5 bg-red-50 border border-red-200 rounded-2xl">
          <p className="text-red-700 text-sm font-medium">Error: {error}</p>
        </div>
      );
    }

    switch (activeTab) {
      case "resumes":
        return (
          <div className="space-y-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[#1a1a1a]">Your Resumes</h2>
                <p className="text-[#6b7280] mt-1 text-sm">AI-tailored for each job application</p>
              </div>
              <Link
                href="/magic"
                className="px-5 py-2.5 bg-[#1a1a1a] text-white font-semibold rounded-full hover:bg-[#2d6a4f] transition-colors duration-200 text-sm shadow-lg shadow-black/10 flex items-center gap-2"
              >
                + New Resume
              </Link>
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : resumeSessions.length > 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <div className="grid grid-cols-4 gap-4 px-5 py-3 border-b border-stone-100 bg-stone-50">
                  {["Job Title", "Template", "Date", "Status"].map((h) => (
                    <span key={h} className="text-xs uppercase tracking-widest text-stone-400" style={{ fontFamily: "var(--font-mono)" }}>
                      {h}
                    </span>
                  ))}
                </div>
                {resumeSessions.map((s) => (
                  <div
                    key={s.id}
                    className="grid grid-cols-4 gap-4 px-5 py-4 border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors items-center"
                  >
                    <span className="font-semibold text-sm text-[#1a1a1a] truncate">{s.job_title || "Untitled"}</span>
                    <span className="text-sm text-[#6b7280] capitalize" style={{ fontFamily: "var(--font-mono)" }}>
                      {s.template_id || "—"}
                    </span>
                    <span className="text-xs text-[#6b7280]" style={{ fontFamily: "var(--font-mono)" }}>
                      {s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        s.status === "complete" ? "text-emerald-700" : "text-stone-400"
                      }`}
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${s.status === "complete" ? "bg-emerald-500" : "bg-stone-300"}`} />
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 p-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-5 text-2xl">
                  📄
                </div>
                <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">No resumes yet</h3>
                <p className="text-[#6b7280] mb-7 max-w-sm mx-auto text-sm leading-relaxed">
                  Create your first AI-powered resume tailored to a specific job posting
                </p>
                <Link
                  href="/magic"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a1a1a] text-white font-semibold rounded-full hover:bg-[#2d6a4f] transition-colors duration-200 text-sm shadow-lg shadow-black/10"
                >
                  Get Started →
                </Link>
              </div>
            )}
          </div>
        );

      case "profile":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#1a1a1a]">Profile</h2>
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className="p-6 bg-[#0f1f18] flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#2d6a4f] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {dashboardData?.user?.name?.charAt(0) || "U"}
                </div>
                <div>
                  <h3 className="text-white font-bold">{dashboardData?.user?.name}</h3>
                  <p className="text-white/50 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                    {dashboardData?.user?.email}
                  </p>
                </div>
              </div>
              <div className="divide-y divide-stone-100">
                {[
                  { label: "Location", value: `${dashboardData?.user?.city || ""}${dashboardData?.user?.city && dashboardData?.user?.state ? ", " : ""}${dashboardData?.user?.state || ""}` },
                  { label: "Phone", value: dashboardData?.user?.number },
                  { label: "LinkedIn", value: dashboardData?.user?.linkedin },
                  { label: "GitHub", value: dashboardData?.user?.github },
                  { label: "Website", value: dashboardData?.user?.website },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-6 py-3.5">
                    <span className="text-xs uppercase tracking-widest text-stone-400" style={{ fontFamily: "var(--font-mono)" }}>
                      {item.label}
                    </span>
                    <span className="text-sm text-[#1a1a1a] font-medium">{item.value || <span className="text-stone-300">Not set</span>}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "experience":
        return (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-[#1a1a1a]">Experience</h2>
            {dashboardData?.experience?.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.experience.map((exp: any, i: number) => (
                  <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-[#1a1a1a]">{exp.position}</h3>
                        <p className="text-[#2d6a4f] font-semibold text-sm mt-0.5">{exp.company}</p>
                        <p className="text-xs text-stone-400 mt-1" style={{ fontFamily: "var(--font-mono)" }}>
                          {exp.start_date} — {exp.current ? "Present" : exp.end_date}
                        </p>
                      </div>
                      {exp.current && (
                        <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full flex-shrink-0" style={{ fontFamily: "var(--font-mono)" }}>
                          Current
                        </span>
                      )}
                    </div>
                    {exp.description && (
                      <p className="text-[#6b7280] mt-3 text-sm leading-relaxed">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                <p className="text-[#6b7280] text-sm">No experience added yet</p>
              </div>
            )}
          </div>
        );

      case "education":
        return (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-[#1a1a1a]">Education</h2>
            {dashboardData?.education?.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.education.map((edu: any, i: number) => (
                  <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5">
                    <h3 className="font-bold text-[#1a1a1a]">{edu.university}</h3>
                    <p className="text-[#2d6a4f] font-semibold text-sm mt-0.5">
                      {edu.degree} in {edu.major}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-stone-400" style={{ fontFamily: "var(--font-mono)" }}>
                      <span>{edu.start_date} — {edu.end_date}</span>
                      {edu.gpa && <span>GPA: {edu.gpa}/{edu.max_gpa || "4.0"}</span>}
                    </div>
                    {edu.relevant_coursework && (
                      <div className="mt-3 pt-3 border-t border-stone-100">
                        <p className="text-xs uppercase tracking-widest text-stone-400 mb-1.5" style={{ fontFamily: "var(--font-mono)" }}>
                          Coursework
                        </p>
                        <p className="text-sm text-[#6b7280]">{edu.relevant_coursework}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                <p className="text-[#6b7280] text-sm">No education added yet</p>
              </div>
            )}
          </div>
        );

      case "projects":
        return (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-[#1a1a1a]">Projects</h2>
            {dashboardData?.projects?.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-3">
                {dashboardData.projects.map((proj: any, i: number) => (
                  <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5">
                    <h3 className="font-bold text-[#1a1a1a]">{proj.name}</h3>
                    {proj.description && (
                      <p className="text-[#6b7280] mt-2 text-sm leading-relaxed">{proj.description}</p>
                    )}
                    {proj.link && (
                      <a
                        href={proj.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-[#2d6a4f] hover:underline"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        View Project →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                <p className="text-[#6b7280] text-sm">No projects added yet</p>
              </div>
            )}
          </div>
        );

      case "skills":
        return (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-[#1a1a1a]">Skills</h2>
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              {dashboardData?.skills ? (
                <div className="flex flex-wrap gap-2">
                  {dashboardData.skills.split(",").map((skill: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-stone-100 border border-stone-200 rounded-full text-sm text-[#1a1a1a] font-medium hover:bg-[#2d6a4f]/10 hover:border-[#2d6a4f]/30 hover:text-[#2d6a4f] transition-colors duration-150 cursor-default"
                    >
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[#6b7280] text-center py-6 text-sm">No skills added yet</p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-56 bg-[#0f1f18] flex flex-col z-40">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <Link href="/" className="font-bold text-lg text-white">
            Resume<span className="text-[#4ade80]">AI</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 flex items-center gap-2.5 ${
                activeTab === item.id
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5"
              }`}
            >
              <span className="text-xs opacity-60">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* User + Sign Out */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-7 h-7 rounded-full bg-[#2d6a4f] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {session?.user?.name?.charAt(0) || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{session?.user?.name}</p>
              <p className="text-xs text-white/30 truncate" style={{ fontFamily: "var(--font-mono)", fontSize: "10px" }}>
                {session?.user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full px-3 py-2 rounded-xl border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 text-xs font-medium transition-all duration-150"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Sign out →
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-56 flex-1 p-8">
        <div className="max-w-4xl">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
