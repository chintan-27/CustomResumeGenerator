"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";

interface ResumeSession {
  id: number;
  template_id: string;
  page_count: number;
  status: string;
  created_at: string;
  job_title?: string;
}

const NAV_ITEMS = [
  {
    id: "resumes", label: "Resumes",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: "profile", label: "Profile",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [emailVerified, setEmailVerified] = useState(true);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { router.push("/login"); return; }

    const init = async () => {
      // Check onboarding first — redirect before rendering anything
      try {
        const res = await fetch("/python/user/status", {
          headers: { Authorization: `Bearer ${session?.accessToken}` },
        });
        const data = await res.json();
        if (!data.onboarding_completed) { router.push("/onboarding"); return; }
        setEmailVerified(data.email_verified ?? true);
      } catch (err) {
        console.error("Onboarding check failed:", err);
      }

      setOnboardingChecked(true);

      // Only fetch dashboard data after confirming onboarding is done
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

    init();
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

  const handleSendVerification = async () => {
    setSendingVerification(true);
    try {
      await fetch("/python/auth/send-verification", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
    } catch { /* silent */ } finally {
      setSendingVerification(false);
    }
  };

  const handleDownload = async (sessionId: number) => {
    setDownloadingId(sessionId);
    try {
      const res = await fetch(`/python/resume/download/${sessionId}`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resume-${sessionId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-5 bg-red-50 border border-red-200 rounded-2xl">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      );
    }

    switch (activeTab) {
      case "resumes":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[#1a1a1a]">Resumes</h2>
                <p className="text-[#6b7280] mt-0.5 text-sm">Tailored for each job application</p>
              </div>
              <Link
                href="/magic"
                className="px-5 py-2.5 bg-[#1a1a1a] text-white font-semibold rounded-full hover:bg-[#2d6a4f] transition-colors duration-200 text-sm flex items-center gap-2 shadow-lg shadow-black/10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Resume
              </Link>
            </div>

            {historyLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : resumeSessions.length > 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                <div className="grid grid-cols-[1fr_100px_90px_80px_40px] gap-4 px-5 py-3 border-b border-stone-100 bg-stone-50/80">
                  {["Job", "Template", "Date", "Status", ""].map((h, i) => (
                    <span key={i} className="text-xs font-medium uppercase tracking-widest text-stone-400" style={{ fontFamily: "var(--font-mono)" }}>
                      {h}
                    </span>
                  ))}
                </div>
                {resumeSessions.map((s) => (
                  <div key={s.id} className="grid grid-cols-[1fr_100px_90px_80px_40px] gap-4 px-5 py-4 border-b border-stone-100 last:border-0 hover:bg-stone-50/60 transition-colors items-center">
                    <span className="font-semibold text-sm text-[#1a1a1a] truncate">{s.job_title || "Untitled"}</span>
                    <span className="text-xs text-[#6b7280] capitalize truncate" style={{ fontFamily: "var(--font-mono)" }}>
                      {s.template_id || "—"}
                    </span>
                    <span className="text-xs text-stone-400" style={{ fontFamily: "var(--font-mono)" }}>
                      {s.created_at ? new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${s.status === "complete" ? "text-emerald-600" : "text-stone-400"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.status === "complete" ? "bg-emerald-500" : "bg-stone-300"}`} />
                      {s.status === "complete" ? "Done" : s.status}
                    </span>
                    <div className="flex justify-end">
                      {s.status === "complete" && (
                        <button
                          onClick={() => handleDownload(s.id)}
                          disabled={downloadingId === s.id}
                          className="p-1.5 text-stone-400 hover:text-[#2d6a4f] hover:bg-[#2d6a4f]/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Download PDF"
                        >
                          {downloadingId === s.id ? (
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 p-14 text-center shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-[#0f1f18] flex items-center justify-center mx-auto mb-5">
                  <svg className="w-6 h-6 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">No resumes yet</h3>
                <p className="text-[#6b7280] mb-7 max-w-xs mx-auto text-sm leading-relaxed">
                  Generate your first AI-powered resume tailored to a specific job posting
                </p>
                <Link
                  href="/magic"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a1a1a] text-white font-semibold rounded-full hover:bg-[#2d6a4f] transition-colors text-sm shadow-lg shadow-black/10"
                >
                  Build Your First Resume →
                </Link>
              </div>
            )}
          </div>
        );

      case "profile":
        return (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-2xl font-bold text-[#1a1a1a]">Profile</h2>
                <p className="text-[#6b7280] mt-0.5 text-sm">Your resume data across all sections</p>
              </div>
              <Link
                href="/onboarding"
                className="px-5 py-2.5 bg-[#1a1a1a] text-white font-semibold rounded-full hover:bg-[#2d6a4f] transition-colors duration-200 text-sm flex items-center gap-2 shadow-lg shadow-black/10"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </Link>
            </div>

            {/* Quick-nav pills */}
            <div className="flex flex-wrap gap-2">
              {["personal-info", "experience", "education", "projects", "skills", "certifications", "publications"].map((anchor) => (
                <a
                  key={anchor}
                  href={`#${anchor}`}
                  className="px-3 py-1.5 bg-stone-100 border border-stone-200 rounded-full text-xs font-medium text-[#1a1a1a] hover:bg-[#2d6a4f]/10 hover:border-[#2d6a4f]/30 hover:text-[#2d6a4f] transition-colors capitalize"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {anchor.replace("-", " ")}
                </a>
              ))}
            </div>

            {/* Personal Info */}
            <section id="personal-info">
              <h3 className="text-base font-bold text-[#1a1a1a] mb-3">Personal Info</h3>
              {loading ? <Skeleton className="h-48 w-full" /> : (
                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                  <div className="p-5 bg-[#0f1f18] flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#2d6a4f] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {dashboardData?.user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <h4 className="text-white font-bold">{dashboardData?.user?.name}</h4>
                      <p className="text-white/40 text-xs mt-0.5" style={{ fontFamily: "var(--font-mono)" }}>
                        {dashboardData?.user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="divide-y divide-stone-100">
                    {[
                      { label: "Location", value: [dashboardData?.user?.city, dashboardData?.user?.state].filter(Boolean).join(", ") },
                      { label: "Phone", value: dashboardData?.user?.number },
                      { label: "LinkedIn", value: dashboardData?.user?.linkedin },
                      { label: "GitHub", value: dashboardData?.user?.github },
                      { label: "Website", value: dashboardData?.user?.website },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between px-5 py-3">
                        <span className="text-xs font-medium uppercase tracking-widest text-stone-400 w-24 flex-shrink-0" style={{ fontFamily: "var(--font-mono)" }}>
                          {item.label}
                        </span>
                        <span className="text-sm text-[#1a1a1a] font-medium text-right">
                          {item.value || <span className="text-stone-300 font-normal">Not set</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Experience */}
            <section id="experience">
              <h3 className="text-base font-bold text-[#1a1a1a] mb-3">Experience</h3>
              {dashboardData?.experience?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.experience.map((exp: any, i: number) => (
                    <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h4 className="font-bold text-[#1a1a1a]">{exp.position}</h4>
                          <p className="text-[#2d6a4f] font-semibold text-sm mt-0.5">{exp.company}</p>
                          <p className="text-xs text-stone-400 mt-1.5" style={{ fontFamily: "var(--font-mono)" }}>
                            {exp.start_date} — {exp.current ? "Present" : exp.end_date}
                          </p>
                        </div>
                        {exp.current && (
                          <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full flex-shrink-0">
                            Current
                          </span>
                        )}
                      </div>
                      {exp.description && (
                        <p className="text-[#6b7280] mt-3 text-sm leading-relaxed border-t border-stone-100 pt-3">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState label="No experience added yet" />
              )}
            </section>

            {/* Education */}
            <section id="education">
              <h3 className="text-base font-bold text-[#1a1a1a] mb-3">Education</h3>
              {dashboardData?.education?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.education.map((edu: any, i: number) => (
                    <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                      <h4 className="font-bold text-[#1a1a1a]">{edu.university}</h4>
                      <p className="text-[#2d6a4f] font-semibold text-sm mt-0.5">
                        {edu.degree}{edu.major ? ` · ${edu.major}` : ""}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 mt-2">
                        <span className="text-xs text-stone-400" style={{ fontFamily: "var(--font-mono)" }}>
                          {edu.start_date} — {edu.end_date}
                        </span>
                        {edu.gpa && (
                          <span className="text-xs font-medium bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                            GPA {edu.gpa}/{edu.max_gpa || "4.0"}
                          </span>
                        )}
                      </div>
                      {edu.relevant_coursework && (
                        <div className="mt-3 pt-3 border-t border-stone-100">
                          <p className="text-xs font-medium uppercase tracking-widest text-stone-400 mb-1.5" style={{ fontFamily: "var(--font-mono)" }}>Coursework</p>
                          <p className="text-sm text-[#6b7280]">{edu.relevant_coursework}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState label="No education added yet" />
              )}
            </section>

            {/* Projects */}
            <section id="projects">
              <h3 className="text-base font-bold text-[#1a1a1a] mb-3">Projects</h3>
              {dashboardData?.projects?.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-3">
                  {dashboardData.projects.map((proj: any, i: number) => (
                    <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm flex flex-col">
                      <h4 className="font-bold text-[#1a1a1a]">{proj.name}</h4>
                      {proj.description && (
                        <p className="text-[#6b7280] mt-2 text-sm leading-relaxed flex-1">{proj.description}</p>
                      )}
                      {proj.link && (
                        <a href={proj.link} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-[#2d6a4f] hover:underline"
                          style={{ fontFamily: "var(--font-mono)" }}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View Project
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState label="No projects added yet" />
              )}
            </section>

            {/* Skills */}
            <section id="skills">
              <h3 className="text-base font-bold text-[#1a1a1a] mb-3">Skills</h3>
              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                {dashboardData?.skills ? (
                  <div className="flex flex-wrap gap-2">
                    {dashboardData.skills.split(",").map((skill: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 bg-stone-100 border border-stone-200 rounded-full text-sm text-[#1a1a1a] font-medium hover:bg-[#2d6a4f]/10 hover:border-[#2d6a4f]/30 hover:text-[#2d6a4f] transition-colors cursor-default">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#6b7280] text-center py-6 text-sm">No skills added yet</p>
                )}
              </div>
            </section>

            {/* Certifications */}
            <section id="certifications">
              <h3 className="text-base font-bold text-[#1a1a1a] mb-3">Certifications</h3>
              {dashboardData?.certifications?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.certifications.map((c: any, i: number) => (
                    <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-[#1a1a1a]">{c.name}</h4>
                          <p className="text-[#2d6a4f] font-semibold text-sm mt-0.5">{c.issuer}</p>
                          <div className="flex flex-wrap gap-3 mt-2">
                            {c.date_issued && (
                              <span className="text-xs text-stone-400" style={{ fontFamily: "var(--font-mono)" }}>Issued {c.date_issued}</span>
                            )}
                            {c.expiry_date && (
                              <span className="text-xs text-stone-400" style={{ fontFamily: "var(--font-mono)" }}>Expires {c.expiry_date}</span>
                            )}
                          </div>
                        </div>
                        {c.link && (
                          <a href={c.link} target="_blank" rel="noopener noreferrer"
                            className="flex-shrink-0 text-xs font-semibold text-[#2d6a4f] hover:underline flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Verify
                          </a>
                        )}
                      </div>
                      {c.credential_id && (
                        <p className="mt-2 text-xs text-stone-400" style={{ fontFamily: "var(--font-mono)" }}>ID: {c.credential_id}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState label="No certifications added yet" />
              )}
            </section>

            {/* Publications */}
            <section id="publications">
              <h3 className="text-base font-bold text-[#1a1a1a] mb-3">Publications</h3>
              {dashboardData?.publications?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.publications.map((p: any, i: number) => (
                    <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                      <h4 className="font-bold text-[#1a1a1a] leading-snug">{p.title}</h4>
                      <p className="text-sm text-[#6b7280] mt-1">{p.authors}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <span className="text-xs font-medium text-[#2d6a4f]">{p.venue}</span>
                        {p.year && <span className="text-xs text-stone-400" style={{ fontFamily: "var(--font-mono)" }}>{p.year}</span>}
                        {p.doi && <span className="text-xs text-stone-400" style={{ fontFamily: "var(--font-mono)" }}>DOI: {p.doi}</span>}
                      </div>
                      {p.abstract && (
                        <p className="mt-3 text-sm text-[#6b7280] leading-relaxed border-t border-stone-100 pt-3 line-clamp-3">{p.abstract}</p>
                      )}
                      {p.link && (
                        <a href={p.link} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-[#2d6a4f] hover:underline"
                          style={{ fontFamily: "var(--font-mono)" }}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View Paper
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState label="No publications added yet" />
              )}
            </section>
          </div>
        );

      default:
        return null;
    }
  };

  const SidebarContent = () => (
    <>
      <div className="px-6 py-5 border-b border-white/[0.08]">
        <Link href="/" className="font-bold text-lg text-white tracking-tight">
          Pari<span className="text-[#4ade80]">chaya</span>
        </Link>
        <p className="text-white/25 text-xs mt-0.5" style={{ fontFamily: "var(--font-mono)" }}>AI Resume Studio</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 pb-2 text-white/25 uppercase tracking-widest" style={{ fontSize: "10px", fontFamily: "var(--font-mono)" }}>
          Main
        </p>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 flex items-center gap-3 ${
              activeTab === item.id
                ? "bg-white/[0.12] text-white"
                : "text-white/40 hover:text-white/75 hover:bg-white/[0.06]"
            }`}
          >
            <span className={activeTab === item.id ? "text-[#4ade80]" : "opacity-60"}>{item.icon}</span>
            {item.label}
          </button>
        ))}

        <div className="pt-4 mt-2 border-t border-white/[0.08]">
          <p className="px-3 pb-2 text-white/25 uppercase tracking-widest" style={{ fontSize: "10px", fontFamily: "var(--font-mono)" }}>
            Tools
          </p>
          <Link
            href="/magic"
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 flex items-center gap-3 text-white/40 hover:text-white/75 hover:bg-white/[0.06]"
          >
            <span className="opacity-60">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </span>
            Generate Resume
          </Link>
          <Link
            href="/cover-letter"
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 flex items-center gap-3 text-white/40 hover:text-white/75 hover:bg-white/[0.06]"
          >
            <span className="opacity-60">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            Cover Letter
          </Link>
          <Link
            href="/jobs"
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 flex items-center gap-3 text-white/40 hover:text-white/75 hover:bg-white/[0.06]"
          >
            <span className="opacity-60">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </span>
            Job Tracker
          </Link>
        </div>
      </nav>

      <div className="px-4 py-4 border-t border-white/[0.08]">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#2d6a4f] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{session?.user?.name}</p>
            <p className="text-white/30 truncate" style={{ fontFamily: "var(--font-mono)", fontSize: "10px" }}>
              {session?.user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full px-3 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 text-xs font-medium transition-all duration-150 text-left"
        >
          Sign out →
        </button>
      </div>
    </>
  );

  // Block render until we've confirmed onboarding is done (prevents flash)
  if (!onboardingChecked) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed left-0 top-0 bottom-0 w-60 bg-[#0f1f18] flex flex-col z-40 transition-transform duration-300 ease-in-out ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        <SidebarContent />
      </aside>

      <main className="md:ml-60 flex-1 min-h-screen">
        <div className="p-5 md:p-8 max-w-4xl">
          {/* Mobile header */}
          <div className="flex items-center gap-3 mb-7 md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2.5 rounded-xl bg-[#0f1f18] text-white hover:bg-[#162820] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-bold text-[#1a1a1a]">
              Pari<span className="text-[#2d6a4f]">chaya</span>
            </span>
          </div>

          {!emailVerified && (
            <div className="mb-6 flex items-center gap-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
              <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-amber-800 flex-1">Verify your email to unlock all features.</p>
              <button
                onClick={handleSendVerification}
                disabled={sendingVerification}
                className="flex-shrink-0 px-4 py-1.5 rounded-full bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {sendingVerification ? "Sending…" : "Send email"}
              </button>
            </div>
          )}

          {renderContent()}
        </div>
      </main>
    </div>
  );
};

const EmptyState = ({ label }: { label: string }) => (
  <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-sm">
    <p className="text-[#6b7280] text-sm">{label}</p>
  </div>
);

export default Dashboard;
