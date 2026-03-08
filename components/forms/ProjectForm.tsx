"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Project {
  name: string;
  description: string;
  link: string;
  details: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
  fork: boolean;
  topics: string[];
  default_branch: string;
}

const emptyProject: Project = { name: "", description: "", link: "", details: "" };

const isValidUrl = (url: string) => {
  if (!url) return true;
  try { new URL(url.startsWith("http") ? url : `https://${url}`); return true; } catch { return false; }
};

const parseGitHubUrl = (url: string): { owner: string; repo: string } | null => {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    if (!u.hostname.includes("github.com")) return null;
    const parts = u.pathname.replace(/^\//, "").split("/");
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1].replace(/\.git$/, "") };
  } catch { return null; }
};

const extractGitHubUsername = (githubUrl: string): string | null => {
  if (!githubUrl) return null;
  try {
    const url = new URL(githubUrl.startsWith("http") ? githubUrl : `https://${githubUrl}`);
    const parts = url.pathname.replace(/^\//, "").split("/").filter(Boolean);
    return parts[0] || null;
  } catch { return null; }
};


const repoToProject = (repo: GitHubRepo): Project => {
  const techParts = [
    ...(repo.language ? [repo.language] : []),
    ...(repo.topics || []).slice(0, 5),
  ].filter((v, i, a) => a.indexOf(v) === i);
  return {
    name: repo.name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    description: repo.description || "",
    link: repo.html_url,
    details: techParts.join(", "),
  };
};

const ProjectForm = ({
  nextStep,
  prevStep,
  onChange,
  initialData = [],
  githubUsername,
}: {
  nextStep: () => void;
  prevStep: () => void;
  onChange: (data: any) => void;
  initialData?: Project[];
  githubUsername?: string | null;
}) => {
  const { data: session } = useSession();
  const [projectList, setProjectList] = useState<Project[]>([{ ...emptyProject }]);
  const [errors, setErrors] = useState<Record<string, string>[]>([{}]);
  const [importingIndex, setImportingIndex] = useState<number | null>(null);
  const [importError, setImportError] = useState<string>("");

  // Send repo metadata to backend — backend fetches README/tree with GITHUB_TOKEN (5000 req/hr)
  const summarizeRepo = async (owner: string, repo: string, repoData: any): Promise<string> => {
    const token = session?.accessToken;
    if (!token) throw new Error("Not authenticated");

    const res = await fetch("/python/github/summarize-repo", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        owner,
        repo_name: repoData.name,
        repo_description: repoData.description || "",
        default_branch: repoData.default_branch || "main",
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => res.status.toString());
      throw new Error(`AI summarization failed (${res.status}): ${errText}`);
    }
    const data = await res.json();
    return data.description || repoData.description || "";
  };

  // GitHub repo browser state
  const [browserOpen, setBrowserOpen] = useState(false);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposError, setReposError] = useState("");
  const [selectedRepoIds, setSelectedRepoIds] = useState<Set<number>>(new Set());
  const [repoSearch, setRepoSearch] = useState("");
  const [hideForks, setHideForks] = useState(true);

  useEffect(() => {
    if (initialData.length > 0) {
      setProjectList(initialData);
      setErrors(initialData.map(() => ({})));
    }
  }, [initialData]);

  const handleChange = (index: number, field: keyof Project, value: string) => {
    setProjectList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setErrors((prev) => {
      const updated = [...prev];
      if (updated[index]) { const e = { ...updated[index] }; delete e[field as string]; updated[index] = e; }
      return updated;
    });
  };

  const addProject = () => {
    setProjectList([...projectList, { ...emptyProject }]);
    setErrors([...errors, {}]);
  };

  const removeProject = (index: number) => {
    if (projectList.length > 1) {
      setProjectList(projectList.filter((_, i) => i !== index));
      setErrors(errors.filter((_, i) => i !== index));
    }
  };

  const validate = () => {
    const allErrors = projectList.map((proj) => {
      const errs: Record<string, string> = {};
      if (!proj.name.trim()) errs.name = "Project name is required";
      if (!proj.details.trim()) errs.details = "Tech stack is required";
      if (proj.link && !isValidUrl(proj.link)) errs.link = "Enter a valid URL";
      return errs;
    });
    setErrors(allErrors);
    return allErrors.every((e) => Object.keys(e).length === 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onChange(projectList);
    nextStep();
  };

  const handleSkip = () => { onChange([]); nextStep(); };

  // ── Per-repo auto-fill (existing behaviour) ──────────────────────────────
  const importFromGitHub = async (index: number) => {
    const url = projectList[index].link;
    const parsed = parseGitHubUrl(url);
    if (!parsed) { setImportError("Paste a valid GitHub repo URL first"); return; }
    setImportError("");
    setImportingIndex(index);
    try {
      const [repoRes, langRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
          headers: { Accept: "application/vnd.github.mercy-preview+json" },
        }),
        fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/languages`),
      ]);

      if (!repoRes.ok) throw new Error("Repo not found or is private");
      const data = await repoRes.json();

      const langs = langRes.ok ? await langRes.json() : {};
      const langList = Object.keys(langs).slice(0, 6);
      const topics: string[] = data.topics || [];
      const tech = [...langList, ...topics.slice(0, 4)]
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(", ");

      // AI-generated description from full README + file tree
      let description = "";
      try {
        description = await summarizeRepo(parsed.owner, parsed.repo, data);
      } catch (aiErr: any) {
        // AI failed but we still have name/tech — show a warning but don't block
        setImportError(`AI description failed: ${aiErr.message}. Other fields filled from GitHub.`);
      }

      setProjectList((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          name: updated[index].name || data.name?.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) || "",
          // Always apply AI description if available; only keep existing if AI returned nothing
          description: description || updated[index].description,
          details: updated[index].details || tech,
          link: `https://github.com/${parsed.owner}/${parsed.repo}`,
        };
        return updated;
      });
    } catch (err: any) {
      setImportError(err.message || "Failed to fetch repo info");
    } finally { setImportingIndex(null); }
  };

  // ── GitHub repo browser ───────────────────────────────────────────────────
  const openBrowser = async () => {
    setBrowserOpen(true);
    if (repos.length > 0) return; // already loaded
    const username = githubUsername;
    if (!username) return;
    setReposLoading(true);
    setReposError("");
    try {
      const res = await fetch(
        `https://api.github.com/users/${username}/repos?sort=updated&per_page=100&type=owner`,
        { headers: { Accept: "application/vnd.github.mercy-preview+json" } }
      );
      if (!res.ok) throw new Error(res.status === 404 ? "GitHub user not found" : "Failed to fetch repos");
      const data: GitHubRepo[] = await res.json();
      setRepos(data);
    } catch (err: any) {
      setReposError(err.message || "Could not load repos");
    } finally { setReposLoading(false); }
  };

  const toggleRepo = (id: number) => {
    setSelectedRepoIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const [addingRepos, setAddingRepos] = useState(false);
  const [addingProgress, setAddingProgress] = useState("");

  // Process items in sequential batches to avoid GitHub (60 req/hr) + LLM rate limits
  const processBatched = async <T, R>(
    items: T[],
    fn: (item: T) => Promise<R>,
    batchSize = 2,
    delayMs = 400
  ): Promise<R[]> => {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(fn));
      results.push(...batchResults);
      if (i + batchSize < items.length) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
    return results;
  };

  const addSelectedRepos = async () => {
    const selected = repos.filter((r) => selectedRepoIds.has(r.id));
    setAddingRepos(true);
    setReposError("");
    setAddingProgress(`0 / ${selected.length}`);

    let failedCount = 0;
    let doneCount = 0;

    const withDescription = await processBatched(
      selected,
      async (repo) => {
        const base = repoToProject(repo);
        const [owner, repoName] = repo.full_name.split("/");
        try {
          const description = await summarizeRepo(owner, repoName, repo);
          doneCount++;
          setAddingProgress(`${doneCount} / ${selected.length}`);
          return { ...base, description: description || base.description };
        } catch (err: any) {
          failedCount++;
          doneCount++;
          setAddingProgress(`${doneCount} / ${selected.length}`);
          console.error(`AI summarize failed for ${repo.name}:`, err.message);
          return base;
        }
      },
      2,   // 2 repos at a time
      500  // 500ms between batches
    );

    if (failedCount > 0) {
      setReposError(`AI description failed for ${failedCount} repo${failedCount > 1 ? "s" : ""} — added with GitHub description instead.`);
    }
    setAddingProgress("");
    setAddingRepos(false);
    const filtered = projectList.filter((p) => p.name.trim() || p.description.trim() || p.link.trim());
    const combined = [...filtered, ...withDescription];
    setProjectList(combined.length ? combined : [{ ...emptyProject }]);
    setErrors(combined.map(() => ({})));
    onChange(combined);
    setSelectedRepoIds(new Set());
    setBrowserOpen(false);
  };

  const filteredRepos = repos.filter((r) => {
    if (hideForks && r.fork) return false;
    if (repoSearch && !r.name.toLowerCase().includes(repoSearch.toLowerCase())) return false;
    return true;
  });

  const inputClass = (err?: string) =>
    `w-full px-4 py-2.5 bg-white border rounded-xl text-[#1a1a1a] placeholder-stone-400 focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] outline-none transition-all ${
      err ? "border-red-300 bg-red-50" : "border-stone-200"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center mb-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0f1f18] mb-4 shadow-lg shadow-black/20">
          <svg className="w-7 h-7 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#1a1a1a]">Projects</h2>
        <p className="text-[#6b7280] mt-1">Showcase your best work</p>
      </div>

      {/* GitHub repo browser trigger */}
      {githubUsername && (
        <div>
          <button
            type="button"
            onClick={openBrowser}
            className="w-full flex items-center justify-between px-4 py-3 bg-[#0f1f18] rounded-xl text-sm font-semibold text-white hover:bg-[#162820] transition-colors"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#4ade80]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Browse GitHub repos — {githubUsername}
            </span>
            <svg className={`w-4 h-4 text-white/50 transition-transform ${browserOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {browserOpen && (
            <div className="mt-2 bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
              {/* Browser toolbar */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 bg-stone-50">
                <div className="relative flex-1">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={repoSearch}
                    onChange={(e) => setRepoSearch(e.target.value)}
                    placeholder="Search repos..."
                    className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-stone-200 rounded-lg outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20"
                  />
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <div
                    onClick={() => setHideForks((v) => !v)}
                    className={`w-8 h-4 rounded-full transition-colors relative flex-shrink-0 ${hideForks ? "bg-[#2d6a4f]" : "bg-stone-300"}`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${hideForks ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-xs text-stone-500">Hide forks</span>
                </label>
                {selectedRepoIds.size > 0 && (
                  <button
                    type="button"
                    onClick={addSelectedRepos}
                    disabled={addingRepos}
                    className="px-3 py-1.5 bg-[#1a1a1a] text-white text-xs font-semibold rounded-full hover:bg-[#2d6a4f] transition-colors flex-shrink-0 flex items-center gap-1.5 disabled:opacity-70"
                  >
                    {addingRepos ? (
                      <>
                        <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                        {addingProgress ? `Summarizing ${addingProgress}…` : "Starting…"}
                      </>
                    ) : (
                      `Add ${selectedRepoIds.size} selected`
                    )}
                  </button>
                )}
              </div>

              {/* Repo list */}
              <div className="max-h-72 overflow-y-auto">
                {reposLoading ? (
                  <div className="flex items-center justify-center py-10 gap-2 text-stone-400">
                    <div className="w-4 h-4 border-2 border-stone-300 border-t-[#2d6a4f] rounded-full animate-spin" />
                    <span className="text-sm">Loading repos…</span>
                  </div>
                ) : reposError ? (
                  <p className="text-center py-8 text-sm text-red-500">{reposError}</p>
                ) : filteredRepos.length === 0 ? (
                  <p className="text-center py-8 text-sm text-stone-400">
                    {repoSearch ? "No repos match your search" : "No public repos found"}
                  </p>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {filteredRepos.map((repo) => {
                      const isSelected = selectedRepoIds.has(repo.id);
                      const alreadyAdded = projectList.some((p) => p.link === repo.html_url);
                      return (
                        <div
                          key={repo.id}
                          onClick={() => !alreadyAdded && toggleRepo(repo.id)}
                          className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                            alreadyAdded
                              ? "opacity-40 cursor-not-allowed"
                              : isSelected
                              ? "bg-[#2d6a4f]/5 cursor-pointer"
                              : "hover:bg-stone-50 cursor-pointer"
                          }`}
                        >
                          {/* Checkbox */}
                          <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            isSelected ? "border-[#2d6a4f] bg-[#2d6a4f]" : "border-stone-300"
                          }`}>
                            {isSelected && (
                              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm font-semibold ${isSelected ? "text-[#2d6a4f]" : "text-[#1a1a1a]"}`}>
                                {repo.name}
                              </span>
                              {repo.fork && (
                                <span className="text-xs text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full">fork</span>
                              )}
                              {alreadyAdded && (
                                <span className="text-xs text-[#2d6a4f] bg-[#2d6a4f]/10 px-1.5 py-0.5 rounded-full">added</span>
                              )}
                            </div>
                            {repo.description && (
                              <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">{repo.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1">
                              {repo.language && (
                                <span className="flex items-center gap-1 text-xs text-stone-400">
                                  <span className="w-2 h-2 rounded-full bg-[#2d6a4f]/60 inline-block" />
                                  {repo.language}
                                </span>
                              )}
                              {repo.stargazers_count > 0 && (
                                <span className="flex items-center gap-1 text-xs text-stone-400">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 .587l3.668 7.431 8.332 1.151-6.064 5.828 1.48 8.279L12 18.897l-7.416 4.379 1.48-8.279L0 9.169l8.332-1.151z" />
                                  </svg>
                                  {repo.stargazers_count}
                                </span>
                              )}
                              <span className="text-xs text-stone-300">
                                {new Date(repo.updated_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Browser footer */}
              <div className="px-4 py-2.5 border-t border-stone-100 bg-stone-50 flex items-center justify-between">
                <span className="text-xs text-stone-400">
                  {filteredRepos.length} repo{filteredRepos.length !== 1 ? "s" : ""}
                  {selectedRepoIds.size > 0 && ` · ${selectedRepoIds.size} selected`}
                </span>
                <button
                  type="button"
                  onClick={() => { setBrowserOpen(false); setSelectedRepoIds(new Set()); }}
                  className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual import hint (when no GitHub username) */}
      {!githubUsername && (
        <div className="flex items-start gap-3 px-4 py-3 bg-[#0f1f18] rounded-xl">
          <svg className="w-4 h-4 text-[#4ade80] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          <p className="text-xs text-white/70">
            Paste a GitHub repo URL in the link field below and click <span className="text-[#4ade80] font-semibold">Auto-fill from GitHub</span> to import details automatically.
          </p>
        </div>
      )}

      {importError && (
        <p className="text-xs text-red-500 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {importError}
        </p>
      )}

      {/* Project entries */}
      <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-2">
        {projectList.map((proj, index) => (
          <div key={index} className="p-5 bg-stone-50 rounded-2xl border border-stone-200 relative">
            {projectList.length > 1 && (
              <button
                type="button"
                onClick={() => removeProject(index)}
                className="absolute top-3 right-3 p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">
                  Project Name <span className="text-[#2d6a4f]">*</span>
                </label>
                <input
                  type="text"
                  value={proj.name}
                  onChange={(e) => handleChange(index, "name", e.target.value)}
                  className={inputClass(errors[index]?.name)}
                  placeholder="AI Resume Builder"
                />
                {errors[index]?.name && <p className="mt-1 text-red-500 text-xs">{errors[index].name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">
                  Project Link <span className="text-stone-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={proj.link}
                    onChange={(e) => handleChange(index, "link", e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-[#1a1a1a] placeholder-stone-400 focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] outline-none transition-all ${errors[index]?.link ? "border-red-300 bg-red-50" : "border-stone-200"}`}
                    placeholder="github.com/project"
                  />
                </div>
                {errors[index]?.link && <p className="mt-1 text-red-500 text-xs">{errors[index].link}</p>}
                {proj.link && parseGitHubUrl(proj.link) && (
                  <button
                    type="button"
                    onClick={() => importFromGitHub(index)}
                    disabled={importingIndex === index}
                    className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#2d6a4f] hover:text-[#1a1a1a] transition-colors disabled:opacity-50"
                  >
                    {importingIndex === index ? (
                      <div className="w-3 h-3 border border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    )}
                    {importingIndex === index ? "Importing…" : "Auto-fill from GitHub"}
                  </button>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">
                Tech Stack / Tools Used <span className="text-[#2d6a4f]">*</span>
              </label>
              <input
                type="text"
                value={proj.details}
                onChange={(e) => handleChange(index, "details", e.target.value)}
                className={inputClass(errors[index]?.details)}
                placeholder="React, Node.js, PostgreSQL, AWS"
              />
              {errors[index]?.details && <p className="mt-1 text-red-500 text-xs">{errors[index].details}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">
                What does it do? <span className="text-stone-400 font-normal">(AI will enhance)</span>
              </label>
              <textarea
                value={proj.description}
                onChange={(e) => handleChange(index, "description", e.target.value)}
                className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-[#1a1a1a] placeholder-stone-400 focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] outline-none transition-all resize-none"
                rows={2}
                placeholder="Built an AI-powered tool that generates tailored resumes..."
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addProject}
        className="w-full py-3 border-2 border-dashed border-stone-200 text-[#6b7280] hover:border-[#2d6a4f]/40 hover:text-[#2d6a4f] hover:bg-[#2d6a4f]/5 rounded-xl transition-all flex items-center justify-center gap-2 font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Another Project
      </button>

      <div className="flex justify-between items-center pt-4">
        <button
          type="button"
          onClick={prevStep}
          className="px-6 py-2.5 text-[#6b7280] font-medium rounded-full hover:bg-stone-100 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          Back
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSkip}
            className="px-6 py-2.5 text-[#6b7280] font-medium rounded-full hover:bg-stone-100 transition-colors"
          >
            Skip for now
          </button>
          <button
            type="submit"
            className="px-8 py-2.5 bg-[#1a1a1a] text-white font-semibold rounded-full shadow-lg shadow-black/10 hover:bg-[#2d6a4f] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
          >
            Continue
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
};

export default ProjectForm;
