import React, { useState, useEffect, useMemo } from "react";
import { usePortfolio } from "../context/PortfolioContext";
import { PortfolioData, SkillGroup } from "../data/portfolioData";
import {
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_FILE_PATH,
  getSessionToken,
  setSessionToken,
  clearSessionToken,
  validateGitHubToken,
  savePortfolioToGitHub,
} from "../services/githubData";
import {
  Lock,
  ShieldCheck,
  FolderGit2,
  Settings,
  Plus,
  Trash2,
  Edit3,
  X,
  Save,
  CheckCircle2,
  RefreshCw,
  User,
  Award,
  Menu,
  KeyRound,
  RotateCcw,
  UploadCloud,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminDashboard({ isOpen, onClose }: AdminDashboardProps) {
  const { portfolio, markSavedToGitHub, refreshPortfolio, dataSource, dataSourceMessage } = usePortfolio();

  // GitHub Token Session Authentication State (sessionStorage only, never hardcoded)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [validatingToken, setValidatingToken] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [verifiedBranch, setVerifiedBranch] = useState<string>("main");

  // Local Staged Draft Portfolio (all add/edit/delete operations mutate this draft until Save to GitHub)
  const [draftPortfolio, setDraftPortfolio] = useState<PortfolioData>(() => structuredClone(portfolio));
  const [commitMessage, setCommitMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [lastCommitUrl, setLastCommitUrl] = useState<string | null>(null);

  // Dashboard Navigation State
  const [activeTab, setActiveTab] = useState<"credentials" | "projects" | "certifications" | "core">("projects");
  const [coreSubTab, setCoreSubTab] = useState<"biography" | "skills" | "experience">("biography");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Active sub-form state
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Inline delete confirmation key (avoids window.confirm inside iframes)
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);

  // New skill category inline input (avoids window.prompt inside iframes)
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  // Certifications form state
  const [certName, setCertName] = useState("");
  const [certIssuer, setCertIssuer] = useState("");
  const [certDate, setCertDate] = useState("");
  const [certUrl, setCertUrl] = useState("");

  // Projects form state
  const [projId, setProjId] = useState("");
  const [projTitle, setProjTitle] = useState("");
  const [projSubtitle, setProjSubtitle] = useState("");
  const [projTechString, setProjTechString] = useState("");
  const [projHighlights, setProjHighlights] = useState<string[]>([""]);
  const [projStats, setProjStats] = useState<{ label: string; value: string }[]>([]);

  // Experience form state
  const [expId, setExpId] = useState("");
  const [expRole, setExpRole] = useState("");
  const [expCompany, setExpCompany] = useState("");
  const [expLocation, setExpLocation] = useState("");
  const [expPeriod, setExpPeriod] = useState("");
  const [expHighlights, setExpHighlights] = useState<string[]>([""]);

  // Detect whether draft differs from live portfolio state
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(draftPortfolio) !== JSON.stringify(portfolio);
  }, [draftPortfolio, portfolio]);

  // On opening the panel, check sessionStorage for an existing token and initialize draft
  useEffect(() => {
    if (!isOpen) return;

    const existingToken = getSessionToken();
    setLoginError(null);
    setActionError(null);
    setConfirmDeleteKey(null);

    if (existingToken) {
      setIsAuthenticated(true);
      setDraftPortfolio(structuredClone(portfolio));
    } else {
      setIsAuthenticated(false);
    }
  }, [isOpen]);

  // Keep draft synced when live portfolio refreshes and user has no unsaved edits
  useEffect(() => {
    if (isAuthenticated && !hasUnsavedChanges) {
      setDraftPortfolio(structuredClone(portfolio));
    }
  }, [portfolio]);

  const showTransientStatus = (msg: string, duration = 4500) => {
    setActionError(null);
    setSaveStatus(msg);
    if (duration > 0) {
      setTimeout(() => {
        setSaveStatus((current) => (current === msg ? null : current));
      }, duration);
    }
  };

  // --- TOKEN VALIDATION & SESSION AUTH ---
  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = tokenInput.trim();
    if (!cleaned) return;

    setValidatingToken(true);
    setLoginError(null);

    const result = await validateGitHubToken(cleaned);

    if (!result.valid) {
      setValidatingToken(false);
      setLoginError(result.error || "GitHub token validation failed.");
      return;
    }

    setSessionToken(cleaned);
    setVerifiedBranch(result.defaultBranch || "main");
    setTokenInput("");
    setValidatingToken(false);
    setIsAuthenticated(true);
    setDraftPortfolio(structuredClone(portfolio));
    setLastCommitUrl(null);
    showTransientStatus(`Token verified for ${result.repoFullName || `${GITHUB_OWNER}/${GITHUB_REPO}`}. Stored in sessionStorage only.`);
  };

  const handleLogout = () => {
    clearSessionToken();
    setIsAuthenticated(false);
    setTokenInput("");
    setLoginError(null);
    setActionError(null);
    setSaveStatus(null);
    setLastCommitUrl(null);
    setEditingItemIndex(null);
    setIsAddingNew(false);
    setConfirmDeleteKey(null);
    setDraftPortfolio(structuredClone(portfolio));
    window.dispatchEvent(new Event("admin-logout"));
  };

  const handleReloadFromGitHub = async () => {
    setIsReloading(true);
    setActionError(null);
    setSaveStatus("Reloading data.json from GitHub Contents API...");

    try {
      const res = await refreshPortfolio({ silent: true });
      setDraftPortfolio(structuredClone(res.data));
      setEditingItemIndex(null);
      setIsAddingNew(false);
      setConfirmDeleteKey(null);
      setIsReloading(false);
      showTransientStatus(res.message);
    } catch (err: any) {
      setIsReloading(false);
      setSaveStatus(null);
      setActionError(err?.message || "Failed to reload data.json from GitHub.");
    }
  };

  const handleDiscardDraft = () => {
    setDraftPortfolio(structuredClone(portfolio));
    setEditingItemIndex(null);
    setIsAddingNew(false);
    setConfirmDeleteKey(null);
    setCommitMessage("");
    setActionError(null);
    showTransientStatus("Staged draft discarded. Restored live state.", 3000);
  };

  // --- SAVE STAGED DRAFT TO GITHUB ---
  const handleSaveToGitHub = async () => {
    const token = getSessionToken();
    if (!token) {
      setIsAuthenticated(false);
      setLoginError("Session token missing. Please re-enter your GitHub fine-grained token.");
      return;
    }

    setIsSaving(true);
    setActionError(null);
    setLastCommitUrl(null);
    setSaveStatus("Fetching latest SHA & committing data.json to GitHub...");

    try {
      const result = await savePortfolioToGitHub(draftPortfolio, token, commitMessage);

      // Update live local state immediately after successful GitHub save
      const committedSnapshot = structuredClone(draftPortfolio);
      markSavedToGitHub(committedSnapshot, result.commitSha);
      setDraftPortfolio(structuredClone(committedSnapshot));
      setCommitMessage("");
      setEditingItemIndex(null);
      setIsAddingNew(false);
      setConfirmDeleteKey(null);
      setIsSaving(false);

      if (result.commitUrl) {
        setLastCommitUrl(result.commitUrl);
      }

      const shortSha = result.commitSha ? result.commitSha.slice(0, 7) : "OK";
      setSaveStatus(`Saved data.json to GitHub successfully (commit ${shortSha}). Live portfolio updated.`);
    } catch (err: any) {
      setIsSaving(false);
      setSaveStatus(null);
      setActionError(err?.message || "Failed to commit data.json to GitHub.");
    }
  };

  // --- PROJECTS STAGED CRUD ---
  const startEditProject = (idx: number) => {
    const item = draftPortfolio.projects[idx];
    setEditingItemIndex(idx);
    setIsAddingNew(false);
    setActionError(null);
    setConfirmDeleteKey(null);

    setProjId(item.id);
    setProjTitle(item.title);
    setProjSubtitle(item.subtitle);
    setProjTechString(item.tech.join(", "));
    setProjHighlights(item.highlights.length > 0 ? [...item.highlights] : [""]);
    setProjStats(item.stats ? structuredClone(item.stats) : []);
  };

  const startAddProject = () => {
    setEditingItemIndex(null);
    setIsAddingNew(true);
    setActionError(null);
    setConfirmDeleteKey(null);

    setProjId("new-module-" + Math.floor(Math.random() * 1000));
    setProjTitle("");
    setProjSubtitle("");
    setProjTechString("");
    setProjHighlights([""]);
    setProjStats([
      { label: "Data Integrity", value: "99%+" },
      { label: "Metric Ratio", value: "85%" },
    ]);
  };

  const stageProjectForm = () => {
    if (!projTitle.trim() || !projId.trim()) {
      setActionError("Title and Module ID parameters are mandatory.");
      return;
    }

    const compiledItem = {
      id: projId.trim().toLowerCase().replace(/\s+/g, "-"),
      title: projTitle.trim(),
      subtitle: projSubtitle.trim(),
      tech: projTechString
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      highlights: projHighlights.map((h) => h.trim()).filter(Boolean),
      stats: projStats.filter((s) => s.label.trim()),
    };

    const updatedProjects = [...draftPortfolio.projects];
    if (isAddingNew) {
      updatedProjects.push(compiledItem);
    } else if (editingItemIndex !== null) {
      updatedProjects[editingItemIndex] = compiledItem;
    }

    setDraftPortfolio((prev) => ({
      ...prev,
      projects: updatedProjects,
    }));
    setEditingItemIndex(null);
    setIsAddingNew(false);
    showTransientStatus("Project staged locally. Click 'SAVE TO GITHUB' to commit.", 3500);
  };

  const deleteProjectIndex = (idx: number) => {
    setDraftPortfolio((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== idx),
    }));
    setConfirmDeleteKey(null);
    showTransientStatus("Project deletion staged locally. Click 'SAVE TO GITHUB' to commit.", 3500);
  };

  // --- EXPERIENCE STAGED CRUD ---
  const startEditExperience = (idx: number) => {
    const item = draftPortfolio.experience[idx];
    setEditingItemIndex(idx);
    setIsAddingNew(false);
    setActionError(null);
    setConfirmDeleteKey(null);

    setExpId(item.id);
    setExpRole(item.role);
    setExpCompany(item.company);
    setExpLocation(item.location);
    setExpPeriod(item.period);
    setExpHighlights(item.highlights.length > 0 ? [...item.highlights] : [""]);
  };

  const startAddExperience = () => {
    setEditingItemIndex(null);
    setIsAddingNew(true);
    setActionError(null);
    setConfirmDeleteKey(null);

    setExpId("exp-node-" + Math.floor(Math.random() * 1000));
    setExpRole("");
    setExpCompany("");
    setExpLocation("");
    setExpPeriod("");
    setExpHighlights([""]);
  };

  const stageExperienceForm = () => {
    if (!expRole.trim() || !expCompany.trim() || !expId.trim()) {
      setActionError("Role, Company, and Node ID parameters are mandatory.");
      return;
    }

    const compiledItem = {
      id: expId.trim().toLowerCase().replace(/\s+/g, "-"),
      role: expRole.trim(),
      company: expCompany.trim(),
      location: expLocation.trim(),
      period: expPeriod.trim(),
      highlights: expHighlights.map((h) => h.trim()).filter(Boolean),
    };

    const updatedExperience = [...draftPortfolio.experience];
    if (isAddingNew) {
      updatedExperience.push(compiledItem);
    } else if (editingItemIndex !== null) {
      updatedExperience[editingItemIndex] = compiledItem;
    }

    setDraftPortfolio((prev) => ({
      ...prev,
      experience: updatedExperience,
    }));
    setEditingItemIndex(null);
    setIsAddingNew(false);
    showTransientStatus("Experience staged locally. Click 'SAVE TO GITHUB' to commit.", 3500);
  };

  const deleteExperienceIndex = (idx: number) => {
    setDraftPortfolio((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== idx),
    }));
    setConfirmDeleteKey(null);
    showTransientStatus("Experience deletion staged locally. Click 'SAVE TO GITHUB' to commit.", 3500);
  };

  // --- SKILLS STAGED CRUD ---
  const updateDraftSkills = (updater: (groups: SkillGroup[]) => SkillGroup[]) => {
    setDraftPortfolio((prev) => ({
      ...prev,
      skills: updater(structuredClone(prev.skills)),
    }));
  };

  const addSkillToGroup = (gIdx: number, text: string) => {
    const cleaned = text.trim();
    if (!cleaned) return;
    updateDraftSkills((groups) => {
      groups[gIdx].skills.push(cleaned);
      return groups;
    });
  };

  const deleteSkillFromGroup = (gIdx: number, sIdx: number) => {
    updateDraftSkills((groups) => {
      groups[gIdx].skills.splice(sIdx, 1);
      return groups;
    });
  };

  const handleAddSkillCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    updateDraftSkills((groups) => [...groups, { category: trimmed, skills: [] }]);
    setNewCategoryName("");
    setShowNewCategoryInput(false);
    showTransientStatus(`Category "${trimmed}" added to draft.`, 3000);
  };

  const deleteSkillGroupIndex = (idx: number) => {
    updateDraftSkills((groups) => groups.filter((_, i) => i !== idx));
    setConfirmDeleteKey(null);
    showTransientStatus("Skill category removed from draft.", 3000);
  };

  // --- CERTIFICATIONS STAGED CRUD ---
  const startEditCertification = (idx: number) => {
    const item = draftPortfolio.certifications[idx];
    setEditingItemIndex(idx);
    setIsAddingNew(false);
    setActionError(null);
    setConfirmDeleteKey(null);

    setCertName(item.name);
    setCertIssuer(item.issuer);
    setCertDate(item.date);
    setCertUrl(item.credentialUrl || "");
  };

  const startAddCertification = () => {
    setEditingItemIndex(null);
    setIsAddingNew(true);
    setActionError(null);
    setConfirmDeleteKey(null);

    setCertName("");
    setCertIssuer("");
    setCertDate("");
    setCertUrl("");
  };

  const stageCertificationForm = () => {
    if (!certName.trim() || !certIssuer.trim()) {
      setActionError("Certification Name and Issuer parameters are mandatory.");
      return;
    }

    const compiledItem = {
      name: certName.trim(),
      issuer: certIssuer.trim(),
      date: certDate.trim() || new Date().getFullYear().toString(),
      ...(certUrl.trim() ? { credentialUrl: certUrl.trim() } : {}),
    };

    const updatedCerts = [...(draftPortfolio.certifications || [])];
    if (isAddingNew) {
      updatedCerts.push(compiledItem);
    } else if (editingItemIndex !== null) {
      updatedCerts[editingItemIndex] = compiledItem;
    }

    setDraftPortfolio((prev) => ({
      ...prev,
      certifications: updatedCerts,
    }));
    setCertName("");
    setCertIssuer("");
    setCertDate("");
    setCertUrl("");
    setEditingItemIndex(null);
    setIsAddingNew(false);
    showTransientStatus("Certificate staged locally. Click 'SAVE TO GITHUB' to commit.", 3500);
  };

  const deleteCertificationIndex = (idx: number) => {
    setDraftPortfolio((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== idx),
    }));
    setConfirmDeleteKey(null);
    showTransientStatus("Certificate deletion staged locally. Click 'SAVE TO GITHUB' to commit.", 3500);
  };

  // --- BIOGRAPHY (personalInfo) LIVE DRAFT UPDATER ---
  const updatePersonalField = (field: keyof PortfolioData["personalInfo"], value: string) => {
    setDraftPortfolio((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value,
      },
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/90 z-[9999] overflow-y-auto font-mono flex items-center justify-center p-4 backdrop-blur-md text-sm antialiased text-slate-200">
      <div
        id="admin-security-dock"
        className="w-full max-w-5xl bg-neutral-900 border border-neutral-800 rounded-none p-5 md:p-6 relative flex flex-col shadow-2xl min-h-0 my-8 md:h-[680px] md:overflow-hidden font-mono"
      >
        {/* Dashboard Frame Header */}
        <div className="flex justify-between items-center border-b border-neutral-800 pb-4 mb-4 select-none relative z-10 w-full font-mono">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-none bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 text-[var(--theme-accent)] ${
                isAuthenticated ? "animate-pulse" : ""
              }`}
            >
              <ShieldCheck className="w-5 h-5 text-[var(--theme-accent)]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                  &gt;_ ROOT_ADMIN_DOCK
                </h1>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-none border font-mono font-bold ${
                    isAuthenticated
                      ? "bg-cyan-950/40 text-[var(--theme-accent)] border-cyan-800/30"
                      : "bg-red-950/30 text-red-400 border-red-900/40"
                  }`}
                >
                  {isAuthenticated ? "[GITHUB_SESSION_ACTIVE]" : "[TOKEN_REQUIRED]"}
                </span>
                {isAuthenticated && hasUnsavedChanges && (
                  <span className="text-[10px] px-2 py-0.5 rounded-none border bg-amber-950/40 text-amber-300 border-amber-700/40 font-mono font-bold">
                    [UNSAVED_DRAFT]
                  </span>
                )}
              </div>
              <p className="text-[10px] text-neutral-400 mt-0.5 font-mono">
                GITHUB CONTENTS SYNC // {GITHUB_OWNER}/{GITHUB_REPO}/{GITHUB_FILE_PATH}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 relative z-20">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 border border-red-900/50 bg-red-950/20 hover:bg-rose-950/40 text-red-400 hover:text-rose-300 rounded-none transition duration-200 text-[10px] font-mono flex items-center space-x-1.5 cursor-pointer shrink-0 shadow-lg uppercase font-bold"
                title="Clear sessionStorage token and lock panel"
              >
                <span>LOGOUT</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 border border-neutral-800 text-neutral-400 hover:text-white rounded-none hover:bg-neutral-800 transition duration-200 cursor-pointer shrink-0"
              title="Close Dashboard"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ==================== SCREEN PHASE 1: GITHUB FINE-GRAINED TOKEN GATE ==================== */}
        {!isAuthenticated && (
          <div className="flex-1 flex flex-col justify-center items-center py-8 relative z-10 w-full max-w-md mx-auto font-mono">
            <div className="w-full space-y-5">
              <div className="text-center space-y-2">
                <div className="h-12 w-12 rounded-none bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/25 text-[var(--theme-accent)] flex items-center justify-center mx-auto">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-accent)]">
                  &gt;_ GITHUB_TOKEN_AUTHENTICATION
                </h2>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Enter a GitHub fine-grained Personal Access Token with{" "}
                  <span className="text-white font-semibold">Contents: Read and write</span> access to{" "}
                  <span className="text-[var(--theme-accent)]">
                    {GITHUB_OWNER}/{GITHUB_REPO}
                  </span>
                  . Your token is validated live and stored in{" "}
                  <span className="text-white font-semibold">sessionStorage</span> only.
                </p>
              </div>

              <form onSubmit={handleTokenSubmit} className="space-y-4 w-full font-mono text-xs">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] text-neutral-400 block uppercase tracking-wider font-bold">
                    GITHUB_FINE_GRAINED_TOKEN
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="github_pat_..."
                      autoComplete="off"
                      spellCheck="false"
                      className="w-full py-2.5 pl-10 pr-4 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none placeholder-neutral-700 transition duration-200"
                      disabled={validatingToken}
                    />
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  </div>
                </div>

                {loginError && (
                  <div className="p-3 border border-red-900/50 bg-red-950/30 text-red-400 text-[11px] rounded-none text-left leading-relaxed flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[var(--theme-accent)] hover:bg-cyan-400 text-neutral-950 font-bold rounded-none transition duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-40 uppercase tracking-wider"
                  disabled={validatingToken || !tokenInput.trim()}
                >
                  {validatingToken ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-neutral-950" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-neutral-950" />
                  )}
                  <span>{validatingToken ? "VALIDATING_WITH_GITHUB..." : "VERIFY_&_UNLOCK_DOCK"}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ==================== SCREEN PHASE 2: AUTHENTICATED STAGED EDITOR ==================== */}
        {isAuthenticated && (
          <div className="flex-1 flex flex-col md:flex-row relative z-10 min-h-0 md:h-full md:overflow-hidden font-mono text-xs w-full max-w-full">
            {/* Mobile Top Bar */}
            <div className="flex md:hidden items-center justify-between p-3.5 bg-neutral-950 border border-neutral-800 mb-4 select-none w-full shadow-lg">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-1.5 border border-neutral-800 hover:bg-neutral-900 text-[var(--theme-accent)] transition duration-150 cursor-pointer flex items-center space-x-1.5"
                title="Toggle Dashboard Sidebar Menu"
              >
                <Menu className="w-4 h-4" />
                <span className="font-mono text-[10px] font-bold tracking-wider">MENU</span>
              </button>
              <div className="text-right">
                <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-[var(--theme-accent)] block">
                  [{activeTab.toUpperCase()}_CONSOLE]
                </span>
                <span className="text-[8px] text-neutral-500 font-mono block uppercase">
                  {hasUnsavedChanges ? "UNSAVED_DRAFT" : "SYNCED"}
                </span>
              </div>
            </div>

            {/* Mobile Sidebar Overlay Backdrop */}
            {isMobileSidebarOpen && (
              <div
                className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-[999] md:hidden transition-opacity duration-300 pointer-events-auto"
                onClick={() => setIsMobileSidebarOpen(false)}
              />
            )}

            {/* Sidebar Controls */}
            <div
              className={`fixed md:relative top-0 bottom-0 left-0 w-64 md:w-52 bg-neutral-950 md:bg-transparent border-r border-neutral-800 md:border-r-0 pb-6 md:pb-0 pt-6 md:pt-0 px-5 md:px-0 md:pr-4 flex flex-col gap-2 shrink-0 select-none font-mono font-semibold z-[1000] md:z-auto transition-transform duration-300 md:translate-x-0 ${
                isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
              }`}
            >
              <div className="flex md:hidden justify-between items-center mb-6 border-b border-neutral-800 pb-3">
                <span className="text-[10px] font-bold tracking-wider uppercase font-mono text-[var(--theme-accent)]">
                  &gt;_ NAVIGATION
                </span>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1 border border-neutral-800 text-neutral-400 hover:text-white transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="hidden md:block text-[10px] font-bold uppercase tracking-wider mb-2 px-1 text-[var(--theme-accent)]">
                NAVIGATION
              </span>

              <button
                onClick={() => {
                  setActiveTab("credentials");
                  setEditingItemIndex(null);
                  setIsAddingNew(false);
                  setConfirmDeleteKey(null);
                  setIsMobileSidebarOpen(false);
                }}
                className={`p-2.5 md:p-2 rounded-none border text-left cursor-pointer transition flex items-center space-x-2 font-mono ${
                  activeTab === "credentials"
                    ? "border-[var(--theme-accent)]/60 bg-neutral-900 text-white"
                    : "border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800/40"
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0 text-[var(--theme-accent)]" />
                <span className="font-semibold text-xs tracking-wider uppercase">GitHub Session</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("projects");
                  setEditingItemIndex(null);
                  setIsAddingNew(false);
                  setConfirmDeleteKey(null);
                  setIsMobileSidebarOpen(false);
                }}
                className={`p-2.5 md:p-2 rounded-none border text-left cursor-pointer transition flex items-center justify-between font-mono ${
                  activeTab === "projects"
                    ? "border-[var(--theme-accent)]/60 bg-neutral-900 text-white"
                    : "border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800/40"
                }`}
              >
                <span className="flex items-center space-x-2">
                  <FolderGit2 className="w-4 h-4 shrink-0 text-[var(--theme-accent)]" />
                  <span className="font-semibold text-xs tracking-wider uppercase">Projects</span>
                </span>
                <span className="text-[10px] text-neutral-500">{draftPortfolio.projects.length}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("certifications");
                  setEditingItemIndex(null);
                  setIsAddingNew(false);
                  setConfirmDeleteKey(null);
                  setIsMobileSidebarOpen(false);
                }}
                className={`p-2.5 md:p-2 rounded-none border text-left cursor-pointer transition flex items-center justify-between font-mono ${
                  activeTab === "certifications"
                    ? "border-[var(--theme-accent)]/60 bg-neutral-900 text-white"
                    : "border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800/40"
                }`}
              >
                <span className="flex items-center space-x-2">
                  <Award className="w-4 h-4 shrink-0 text-[var(--theme-accent)]" />
                  <span className="font-semibold text-xs tracking-wider uppercase">Certificates</span>
                </span>
                <span className="text-[10px] text-neutral-500">{draftPortfolio.certifications.length}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("core");
                  setEditingItemIndex(null);
                  setIsAddingNew(false);
                  setConfirmDeleteKey(null);
                  setIsMobileSidebarOpen(false);
                }}
                className={`p-2.5 md:p-2 rounded-none border text-left cursor-pointer transition flex items-center space-x-2 font-mono ${
                  activeTab === "core"
                    ? "border-[var(--theme-accent)]/60 bg-neutral-900 text-white"
                    : "border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800/40"
                }`}
              >
                <Settings className="w-4 h-4 shrink-0 text-[var(--theme-accent)]" />
                <span className="font-semibold text-xs tracking-wider uppercase">Core Settings</span>
              </button>

              <div className="mt-auto pt-4 border-t border-neutral-800 space-y-2">
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 border border-red-900/50 bg-red-950/20 hover:bg-rose-950/40 text-red-400 font-bold rounded-none transition duration-200 text-[10px] font-mono cursor-pointer uppercase tracking-wider"
                >
                  LOGOUT_SESSION
                </button>
              </div>
            </div>

            {/* Content Editor Frame Panel */}
            <div className="flex-1 flex flex-col justify-between min-h-0 md:h-full md:overflow-hidden font-mono max-w-full overflow-x-hidden">
              {/* Output alerts for states */}
              {(saveStatus || actionError) && (
                <div className="mb-3 space-y-1.5 font-mono shrink-0">
                  {saveStatus && (
                    <div className="p-2.5 border border-[var(--theme-accent)]/30 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] rounded-none flex items-center justify-between gap-2 font-medium text-[11px] font-mono">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{saveStatus}</span>
                      </div>
                      {lastCommitUrl && (
                        <a
                          href={lastCommitUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline flex items-center gap-1 shrink-0 hover:text-white"
                        >
                          <span>View Commit</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                  {actionError && (
                    <div className="p-2.5 border border-rose-500/40 bg-rose-950/30 text-rose-300 rounded-none font-medium text-[11px] flex items-center justify-between gap-2 font-mono">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>{actionError}</span>
                      </div>
                      <button
                        onClick={() => setActionError(null)}
                        className="text-rose-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Internal Sub-Tab Navigation Bar for Core Settings */}
              {activeTab === "core" && (
                <div
                  id="core-subtab-switch"
                  className="flex border-b border-neutral-800 pb-2 mb-3 space-x-1 select-none font-mono font-semibold text-[10px] overflow-x-auto w-full max-w-full shrink-0"
                >
                  <button
                    onClick={() => {
                      setCoreSubTab("biography");
                      setEditingItemIndex(null);
                      setIsAddingNew(false);
                    }}
                    className={`px-3 py-1.5 border rounded-none transition uppercase tracking-wider font-mono cursor-pointer shrink-0 ${
                      coreSubTab === "biography"
                        ? "border-[var(--theme-accent)]/60 bg-neutral-900 text-white font-bold"
                        : "border-transparent text-neutral-400 hover:text-white"
                    }`}
                  >
                    Biography Narrative
                  </button>
                  <button
                    onClick={() => {
                      setCoreSubTab("skills");
                      setEditingItemIndex(null);
                      setIsAddingNew(false);
                    }}
                    className={`px-3 py-1.5 border rounded-none transition uppercase tracking-wider font-mono cursor-pointer shrink-0 ${
                      coreSubTab === "skills"
                        ? "border-[var(--theme-accent)]/60 bg-neutral-900 text-white font-bold"
                        : "border-transparent text-neutral-400 hover:text-white"
                    }`}
                  >
                    Skills Matrix ({draftPortfolio.skills.length})
                  </button>
                  <button
                    onClick={() => {
                      setCoreSubTab("experience");
                      setEditingItemIndex(null);
                      setIsAddingNew(false);
                    }}
                    className={`px-3 py-1.5 border rounded-none transition uppercase tracking-wider font-mono cursor-pointer shrink-0 ${
                      coreSubTab === "experience"
                        ? "border-[var(--theme-accent)]/60 bg-neutral-900 text-white font-bold"
                        : "border-transparent text-neutral-400 hover:text-white"
                    }`}
                  >
                    Professional Experience ({draftPortfolio.experience.length})
                  </button>
                </div>
              )}

              {/* ==================================================== */}
              {/* TAB MODULE: GITHUB SESSION & SYNC */}
              {/* ==================================================== */}
              {activeTab === "credentials" && (
                <div id="credentials-panel" className="flex-grow flex flex-col overflow-y-auto space-y-5 pr-1 pb-4">
                  <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-4 rounded-none select-none">
                    <div>
                      <h2 className="font-mono font-semibold text-xs tracking-wider uppercase text-[var(--theme-accent)]">
                        &gt;_ GITHUB_SESSION_CONFIGURATION
                      </h2>
                      <p className="text-[11px] text-neutral-400 font-mono">
                        FINE-GRAINED TOKEN SESSION & REPOSITORY CONTENTS API SYNC
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs">
                    {/* Active Session Info Card */}
                    <div className="bg-neutral-950 p-5 border border-neutral-800 rounded-none space-y-4">
                      <h3 className="text-white uppercase tracking-wider font-bold text-[10px] border-b border-neutral-800 pb-2">
                        // ACTIVE_GITHUB_SESSION
                      </h3>
                      <div className="space-y-3 font-mono">
                        <div className="flex justify-between border-b border-neutral-900 pb-1.5">
                          <span className="text-neutral-400 uppercase text-[10px] tracking-wider">REPOSITORY</span>
                          <span className="text-white text-[11px] font-semibold">
                            {GITHUB_OWNER}/{GITHUB_REPO}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-neutral-900 pb-1.5">
                          <span className="text-neutral-400 uppercase text-[10px] tracking-wider">TARGET_FILE</span>
                          <span className="text-[var(--theme-accent)] font-semibold text-[11px]">
                            {GITHUB_FILE_PATH} ({verifiedBranch})
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-neutral-900 pb-1.5">
                          <span className="text-neutral-400 uppercase text-[10px] tracking-wider">TOKEN_STORAGE</span>
                          <span className="text-emerald-400 font-semibold uppercase text-[10px] tracking-wider">
                            ● sessionStorage ONLY
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400 uppercase text-[10px] tracking-wider">LOAD_SOURCE</span>
                          <span className="text-neutral-300 text-[10px] uppercase font-mono tracking-wider">
                            {dataSource === "github"
                              ? "GITHUB_LIVE"
                              : dataSource === "github-empty"
                              ? "GITHUB_404_EMPTY"
                              : "BUNDLED_FALLBACK"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Remote Sync Control */}
                    <div className="bg-neutral-950 p-5 border border-neutral-800 rounded-none space-y-4 flex flex-col justify-between">
                      <div>
                        <h3 className="text-white uppercase tracking-wider font-bold text-[10px] border-b border-neutral-800 pb-2">
                          // REMOTE_GITHUB_SYNC
                        </h3>
                        <p className="text-neutral-400 text-[11px] leading-relaxed mt-2.5 font-mono">
                          Pull the latest <span className="text-white">data.json</span> directly from GitHub Contents API.
                          This replaces any unsaved local draft changes with the remote file.
                        </p>
                      </div>
                      <div className="pt-3 space-y-2">
                        <button
                          onClick={handleReloadFromGitHub}
                          disabled={isReloading || isSaving}
                          className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-[var(--theme-accent)]/40 text-[var(--theme-accent)] hover:text-cyan-300 font-bold rounded-none transition duration-200 text-[10px] font-mono cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 uppercase tracking-wider"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isReloading ? "animate-spin" : ""}`} />
                          <span>{isReloading ? "FETCHING_FROM_GITHUB..." : "RELOAD_DATA_FROM_GITHUB"}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-950 p-5 border border-neutral-800 rounded-none space-y-2 font-mono">
                    <h3 className="text-white uppercase tracking-wider font-bold text-[10px] border-b border-neutral-800 pb-2">
                      // DATA_PIPELINE_STATUS
                    </h3>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">{dataSourceMessage}</p>
                    <p className="text-[10px] text-neutral-500 leading-relaxed">
                      All edits made in Projects, Certificates, Skills, Experiences, and Biography are staged locally. Use
                      the <span className="text-[var(--theme-accent)] font-bold">SAVE TO GITHUB</span> bar below to commit
                      the updated <span className="text-white">data.json</span> in a single Git commit.
                    </p>
                  </div>
                </div>
              )}

              {/* ==================================================== */}
              {/* TAB MODULE: PROJECTS */}
              {/* ==================================================== */}
              {activeTab === "projects" && (
                <div className="flex-grow flex flex-col overflow-y-auto pr-1">
                  {editingItemIndex === null && !isAddingNew ? (
                    <div className="space-y-4 font-mono">
                      <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-4 rounded-none">
                        <div>
                          <h2 className="font-bold text-xs uppercase tracking-wider text-[var(--theme-accent)]">
                            &gt;_ Projects Inventory
                          </h2>
                          <p className="text-[10px] text-neutral-400 select-none">
                            RECORDED DEV NODES AND REPOSITORIES
                          </p>
                        </div>
                        <button
                          onClick={startAddProject}
                          className="px-3.5 py-2 bg-[var(--theme-accent)] hover:bg-cyan-400 text-neutral-950 font-bold rounded-none transition duration-200 text-[10px] flex items-center space-x-1.5 cursor-pointer uppercase tracking-wider"
                        >
                          <Plus className="w-4 h-4 text-neutral-950 shrink-0" />
                          <span>NEW_NODE</span>
                        </button>
                      </div>

                      {draftPortfolio.projects.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-neutral-800 font-mono text-neutral-500 text-xs rounded-none">
                          NO PROJECTS IN DRAFT. CLICK &apos;NEW_NODE&apos; TO ADD ONE.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
                          {draftPortfolio.projects.map((proj, idx) => {
                            const deleteKey = `project-${idx}`;
                            return (
                              <div
                                key={`${proj.id}-${idx}`}
                                className="bg-neutral-950 p-4 border border-neutral-800 rounded-none hover:border-[var(--theme-accent)]/40 transition duration-200 relative flex flex-col justify-between min-h-[160px]"
                              >
                                <div>
                                  <div className="flex justify-between items-center mb-1.5 gap-2">
                                    <span className="font-bold text-xs text-white uppercase tracking-wider truncate">
                                      {proj.title}
                                    </span>
                                    <span className="text-[9px] px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded-none text-neutral-400 font-mono shrink-0">
                                      [ID: {proj.id}]
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-[var(--theme-accent)] font-semibold tracking-widest uppercase mb-3">
                                    {proj.subtitle}
                                  </p>

                                  <div className="flex flex-wrap gap-1.5 mb-3">
                                    {proj.tech.map((t, tIdx) => (
                                      <span
                                        key={`${t}-${tIdx}`}
                                        className="text-[10px] bg-neutral-900 text-neutral-300 px-2 py-0.5 rounded-none border border-neutral-800/60 font-mono"
                                      >
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex justify-end gap-2 border-t border-neutral-800 pt-3 mt-3 select-none">
                                  <button
                                    onClick={() => startEditProject(idx)}
                                    className="px-3 py-1.5 border border-neutral-800 bg-neutral-900 text-neutral-300 rounded-none hover:text-[var(--theme-accent)] hover:border-[var(--theme-accent)] transition duration-150 flex items-center space-x-1.5 cursor-pointer font-bold text-[10px] uppercase tracking-wider"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
                                    <span>EDIT</span>
                                  </button>

                                  {confirmDeleteKey === deleteKey ? (
                                    <div className="flex gap-1.5">
                                      <button
                                        onClick={() => deleteProjectIndex(idx)}
                                        className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-none cursor-pointer font-bold text-[10px] uppercase tracking-wider"
                                      >
                                        CONFIRM
                                      </button>
                                      <button
                                        onClick={() => setConfirmDeleteKey(null)}
                                        className="px-2.5 py-1.5 border border-neutral-700 text-neutral-300 hover:text-white rounded-none cursor-pointer text-[10px] uppercase"
                                      >
                                        CANCEL
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setConfirmDeleteKey(deleteKey)}
                                      className="px-3 py-1.5 border border-red-900/50 bg-red-950/20 hover:bg-rose-950/40 text-red-400 rounded-none hover:border-red-800 hover:text-rose-300 transition duration-150 flex items-center space-x-1.5 cursor-pointer font-bold text-[10px] uppercase tracking-wider"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                      <span>DELETE</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Projects Form Editor
                    <div className="space-y-4 pb-6 font-mono">
                      <div className="flex justify-between items-center pb-3 border-b border-neutral-800 font-mono">
                        <span className="text-white font-bold text-xs flex items-center space-x-2 uppercase tracking-wider">
                          <Edit3 className="w-4 h-4 text-[var(--theme-accent)]" />
                          <span>{isAddingNew ? "INIT_NEW_PROJECT_NODE" : `EDIT_PROJECT_NODE: ${projId}`}</span>
                        </span>
                        <button
                          onClick={() => {
                            setEditingItemIndex(null);
                            setIsAddingNew(false);
                          }}
                          className="px-2.5 py-1 text-[10px] border border-neutral-800 rounded-none text-neutral-400 hover:text-white cursor-pointer hover:bg-neutral-800 transition uppercase tracking-wider"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">
                            PROJECT_ID / SLUG_IDENTIFIER
                          </label>
                          <input
                            type="text"
                            value={projId}
                            onChange={(e) => setProjId(e.target.value)}
                            className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono disabled:opacity-60"
                            placeholder="e.g., bonito"
                            disabled={!isAddingNew}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">
                            TITLE_LABEL
                          </label>
                          <input
                            type="text"
                            value={projTitle}
                            onChange={(e) => setProjTitle(e.target.value)}
                            className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs"
                            placeholder="e.g., Bonito"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">
                            SUBTITLE_LABEL
                          </label>
                          <input
                            type="text"
                            value={projSubtitle}
                            onChange={(e) => setProjSubtitle(e.target.value)}
                            className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs"
                            placeholder="e.g., Sports Analytics Backend"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">
                            TECH_STACK_CSV_ARRAY
                          </label>
                          <input
                            type="text"
                            value={projTechString}
                            onChange={(e) => setProjTechString(e.target.value)}
                            className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs"
                            placeholder="e.g., Python, FastAPI, Pandas, PostgreSQL"
                          />
                        </div>
                      </div>

                      <div className="space-y-3 font-mono">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                            KEY_HIGHLIGHTS_BULLETS
                          </label>
                          <button
                            type="button"
                            onClick={() => setProjHighlights([...projHighlights, ""])}
                            className="px-2.5 py-1 text-[10px] border border-neutral-800 text-[var(--theme-accent)] hover:text-cyan-300 hover:bg-neutral-800 rounded-none transition uppercase tracking-wider font-bold cursor-pointer"
                          >
                            + ADD_RECORD
                          </button>
                        </div>

                        {projHighlights.map((hl, hlIdx) => (
                          <div key={hlIdx} className="flex gap-2">
                            <input
                              type="text"
                              value={hl}
                              onChange={(e) => {
                                const arr = [...projHighlights];
                                arr[hlIdx] = e.target.value;
                                setProjHighlights(arr);
                              }}
                              className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none flex-grow text-xs font-mono"
                              placeholder="Describe data outcomes, optimized performance records, etc."
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const arr = projHighlights.filter((_, i) => i !== hlIdx);
                                setProjHighlights(arr.length ? arr : [""]);
                              }}
                              className="px-2.5 border border-red-900/50 bg-red-950/20 text-red-400 rounded-none hover:bg-rose-900 hover:text-white transition flex items-center justify-center p-2.5 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Stats metric dashboard */}
                      <div className="space-y-3 font-mono">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                            QUANTITATIVE_METRICS_STAT (MAX 3)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              if (projStats.length >= 3) return;
                              setProjStats([...projStats, { label: "", value: "" }]);
                            }}
                            className="px-2.5 py-1 text-[10px] border border-neutral-800 text-[var(--theme-accent)] hover:text-cyan-300 hover:bg-neutral-800 rounded-none transition disabled:opacity-40 uppercase tracking-wider font-bold cursor-pointer"
                            disabled={projStats.length >= 3}
                          >
                            + ADD_METRIC
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {projStats.map((st, sIdx) => (
                            <div
                              key={sIdx}
                              className="p-3 border border-neutral-800 rounded-none bg-neutral-950 space-y-2 relative"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setProjStats(projStats.filter((_, i) => i !== sIdx));
                                }}
                                className="absolute top-1.5 right-1.5 text-neutral-400 hover:text-white cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>

                              <input
                                type="text"
                                value={st.label}
                                onChange={(e) => {
                                  const arr = [...projStats];
                                  arr[sIdx] = { ...arr[sIdx], label: e.target.value };
                                  setProjStats(arr);
                                }}
                                className="p-1.5 text-[10px] bg-neutral-900 border border-neutral-800 outline-none text-white rounded-none w-full font-mono"
                                placeholder="Label (e.g., Accuracy)"
                              />
                              <input
                                type="text"
                                value={st.value}
                                onChange={(e) => {
                                  const arr = [...projStats];
                                  arr[sIdx] = { ...arr[sIdx], value: e.target.value };
                                  setProjStats(arr);
                                }}
                                className="p-1.5 text-[10px] bg-neutral-900 border border-neutral-800 outline-none rounded-none w-full font-bold font-mono text-[var(--theme-accent)]"
                                placeholder="Value (e.g., 99.4%)"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-neutral-800 flex justify-end gap-2 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItemIndex(null);
                            setIsAddingNew(false);
                          }}
                          className="px-4 py-2 bg-transparent text-neutral-400 hover:text-white rounded-none transition text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={stageProjectForm}
                          className="px-5 py-2 bg-[var(--theme-accent)] hover:bg-cyan-400 text-neutral-950 font-bold rounded-none transition flex items-center space-x-1.5 cursor-pointer text-[10px] uppercase tracking-wider"
                        >
                          <Save className="w-4 h-4 text-neutral-950 shrink-0" />
                          <span>STAGE_PROJECT_NODE</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ==================================================== */}
              {/* TAB MODULE: SKILLS */}
              {/* ==================================================== */}
              {activeTab === "core" && coreSubTab === "skills" && (
                <div className="flex-grow flex flex-col overflow-y-auto font-mono pr-1">
                  <div className="flex flex-wrap justify-between items-center gap-3 bg-neutral-900 border border-neutral-800 p-4 rounded-none mb-4 select-none">
                    <div>
                      <h2 className="font-bold text-xs uppercase tracking-wider text-[var(--theme-accent)]">
                        &gt;_ Skills Inventory
                      </h2>
                      <p className="text-[10px] text-neutral-400 select-none">
                        CONFIGURE SKILL TAGS AND RELATED CLUSTERS (AUTO-STAGED TO DRAFT)
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowNewCategoryInput((prev) => !prev)}
                        className="px-3 py-1.5 bg-[var(--theme-accent)] hover:bg-cyan-400 text-neutral-950 font-bold rounded-none transition duration-200 text-[10px] flex items-center space-x-1 cursor-pointer uppercase tracking-wider"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>NEW_CATEGORY</span>
                      </button>
                    </div>
                  </div>

                  {showNewCategoryInput && (
                    <form
                      onSubmit={handleAddSkillCategorySubmit}
                      className="mb-4 p-3 bg-neutral-950 border border-[var(--theme-accent)]/40 rounded-none flex flex-wrap gap-2 items-center"
                    >
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Category name (e.g., Cloud Architectures)..."
                        className="flex-1 min-w-[200px] p-2 bg-neutral-900 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none text-xs font-mono"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={!newCategoryName.trim()}
                        className="px-3 py-2 bg-[var(--theme-accent)] hover:bg-cyan-400 text-neutral-950 font-bold rounded-none text-[10px] uppercase tracking-wider cursor-pointer disabled:opacity-40"
                      >
                        ADD_CATEGORY
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewCategoryInput(false);
                          setNewCategoryName("");
                        }}
                        className="px-3 py-2 border border-neutral-800 text-neutral-400 hover:text-white rounded-none text-[10px] uppercase cursor-pointer"
                      >
                        CANCEL
                      </button>
                    </form>
                  )}

                  {draftPortfolio.skills.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-neutral-800 font-mono text-neutral-500 text-xs rounded-none">
                      NO SKILL CATEGORIES IN DRAFT. CLICK &apos;NEW_CATEGORY&apos; TO ADD ONE.
                    </div>
                  ) : (
                    <div className="space-y-4 pb-6">
                      {draftPortfolio.skills.map((group, groupIdx) => {
                        const deleteKey = `skill-group-${groupIdx}`;
                        return (
                          <div
                            key={groupIdx}
                            className="bg-neutral-950 p-4 border border-neutral-800 rounded-none space-y-3 relative"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="space-y-1 flex-1">
                                <span className="text-[10px] text-neutral-400 block font-bold uppercase tracking-wider">
                                  CATEGORY_HEADER_TAG
                                </span>
                                <input
                                  type="text"
                                  value={group.category}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateDraftSkills((groups) => {
                                      groups[groupIdx].category = val;
                                      return groups;
                                    });
                                  }}
                                  className="text-white font-bold bg-transparent border-b border-dashed border-neutral-700 focus:border-[var(--theme-accent)] outline-none text-xs tracking-wider uppercase pb-0.5 w-full max-w-sm"
                                />
                              </div>

                              {confirmDeleteKey === deleteKey ? (
                                <div className="flex gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => deleteSkillGroupIndex(groupIdx)}
                                    className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-none cursor-pointer font-bold text-[10px] uppercase"
                                  >
                                    CONFIRM
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteKey(null)}
                                    className="px-2.5 py-1 border border-neutral-700 text-neutral-300 hover:text-white rounded-none cursor-pointer text-[10px] uppercase"
                                  >
                                    CANCEL
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteKey(deleteKey)}
                                  className="text-rose-400 hover:text-rose-300 p-1.5 border border-red-900/50 bg-rose-950/20 rounded-none cursor-pointer text-[10px] font-bold shrink-0"
                                  title="Delete Whole Category"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <div className="space-y-2">
                              <span className="text-[10px] text-neutral-400 block font-bold uppercase tracking-wider">
                                ACTIVE_CHIPS_TAGS
                              </span>
                              <div className="flex flex-wrap gap-1.5 p-2 bg-neutral-900 rounded-none min-h-12 border border-neutral-800">
                                {group.skills.length === 0 ? (
                                  <span className="text-neutral-500 select-none p-1 text-[10px]">
                                    NO CHIPS INITIALIZED. APPEND RECORD BELOW.
                                  </span>
                                ) : (
                                  group.skills.map((skill: string, sIdx: number) => (
                                    <span
                                      key={sIdx}
                                      className="text-[10px] bg-cyan-950/35 text-[var(--theme-accent)] px-2.5 py-0.5 rounded-none border border-cyan-900/40 flex items-center space-x-1 select-none font-bold uppercase tracking-wide"
                                    >
                                      <span>{skill}</span>
                                      <button
                                        type="button"
                                        onClick={() => deleteSkillFromGroup(groupIdx, sIdx)}
                                        className="hover:text-white ml-1 font-bold text-rose-400 cursor-pointer"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>

                            {/* Quick Add Chip Form */}
                            <div className="pt-2 border-t border-neutral-900 max-w-sm">
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  const inField = e.currentTarget.elements.namedItem("chipInput") as HTMLInputElement;
                                  if (inField?.value) {
                                    addSkillToGroup(groupIdx, inField.value);
                                    inField.value = "";
                                  }
                                }}
                                className="flex gap-2"
                              >
                                <input
                                  name="chipInput"
                                  type="text"
                                  placeholder="Add skill chip (e.g., PyTorch)..."
                                  className="p-1.5 text-xs bg-neutral-900 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none flex-grow font-mono"
                                />
                                <button
                                  type="submit"
                                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-[10px] font-bold rounded-none uppercase tracking-wider cursor-pointer"
                                >
                                  + CHIP
                                </button>
                              </form>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ==================================================== */}
              {/* TAB MODULE: EXPERIENCE */}
              {/* ==================================================== */}
              {activeTab === "core" && coreSubTab === "experience" && (
                <div className="flex-grow flex flex-col overflow-y-auto font-mono pr-1">
                  {editingItemIndex === null && !isAddingNew ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-4 rounded-none">
                        <div>
                          <h2 className="font-bold text-xs uppercase tracking-wider text-[var(--theme-accent)]">
                            &gt;_ Professional Experience
                          </h2>
                          <p className="text-[10px] text-neutral-400 select-none">
                            RECORD OF PROFESSIONAL ROLES AND ENGAGEMENTS
                          </p>
                        </div>
                        <button
                          onClick={startAddExperience}
                          className="px-3.5 py-2 bg-[var(--theme-accent)] hover:bg-cyan-400 text-neutral-950 font-bold rounded-none transition duration-200 text-[10px] flex items-center space-x-1.5 cursor-pointer uppercase tracking-wider"
                        >
                          <Plus className="w-4 h-4 text-neutral-950 shrink-0" />
                          <span>NEW_ROLE</span>
                        </button>
                      </div>

                      {draftPortfolio.experience.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-neutral-800 font-mono text-neutral-500 text-xs rounded-none">
                          NO EXPERIENCE ENTRIES IN DRAFT. CLICK &apos;NEW_ROLE&apos; TO ADD ONE.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 pb-6">
                          {draftPortfolio.experience.map((exp, idx) => {
                            const deleteKey = `exp-${idx}`;
                            return (
                              <div
                                key={`${exp.id}-${idx}`}
                                className="bg-neutral-950 p-4 border border-neutral-800 rounded-none hover:border-[var(--theme-accent)]/40 transition duration-200 relative flex flex-col md:flex-row justify-between items-start gap-4 font-mono"
                              >
                                <div className="flex-grow space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-bold text-xs text-white uppercase tracking-wider">
                                      {exp.role}
                                    </span>
                                    <span className="text-[var(--theme-accent)] font-bold text-[10px]">
                                      @ {exp.company}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-neutral-400">
                                    {exp.period} · {exp.location}
                                  </p>

                                  <p className="text-[10px] text-neutral-300 max-w-2xl leading-relaxed pt-1.5 font-mono">
                                    {exp.highlights[0] || "No achievements logged."}
                                  </p>
                                </div>

                                <div className="flex self-end md:self-center gap-2 select-none shrink-0">
                                  <button
                                    onClick={() => startEditExperience(idx)}
                                    className="px-3 py-1.5 border border-neutral-800 bg-neutral-900 text-neutral-300 rounded-none hover:text-[var(--theme-accent)] hover:border-[var(--theme-accent)] transition duration-150 flex items-center space-x-1.5 cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
                                    <span>EDIT</span>
                                  </button>

                                  {confirmDeleteKey === deleteKey ? (
                                    <div className="flex gap-1.5">
                                      <button
                                        onClick={() => deleteExperienceIndex(idx)}
                                        className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-none cursor-pointer font-bold text-[10px] uppercase"
                                      >
                                        CONFIRM
                                      </button>
                                      <button
                                        onClick={() => setConfirmDeleteKey(null)}
                                        className="px-2.5 py-1.5 border border-neutral-700 text-neutral-300 hover:text-white rounded-none cursor-pointer text-[10px] uppercase"
                                      >
                                        CANCEL
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setConfirmDeleteKey(deleteKey)}
                                      className="px-3 py-1.5 border border-red-900/50 bg-red-950/20 hover:bg-rose-950/40 text-red-400 rounded-none hover:border-red-800 hover:text-rose-300 transition duration-150 flex items-center space-x-1.5 cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                      <span>DELETE</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Experience Form Editor
                    <div className="space-y-4 pb-6 font-mono text-xs">
                      <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
                        <span className="font-bold text-xs flex items-center space-x-2 uppercase tracking-wider text-[var(--theme-accent)]">
                          <Edit3 className="w-4 h-4 text-[var(--theme-accent)]" />
                          <span>{isAddingNew ? "INGEST_NEW_POSITION" : `EDIT_POSITION_NODE: ${expId}`}</span>
                        </span>
                        <button
                          onClick={() => {
                            setEditingItemIndex(null);
                            setIsAddingNew(false);
                          }}
                          className="px-2.5 py-1 text-[10px] border border-neutral-800 rounded-none text-neutral-400 hover:text-white cursor-pointer hover:bg-neutral-800 transition uppercase tracking-wider"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">
                            TOKEN_NODE_ID
                          </label>
                          <input
                            type="text"
                            value={expId}
                            onChange={(e) => setExpId(e.target.value)}
                            className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono disabled:opacity-60"
                            placeholder="e.g., lead-engineer"
                            disabled={!isAddingNew}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">
                            ROLE_TITLE
                          </label>
                          <input
                            type="text"
                            value={expRole}
                            onChange={(e) => setExpRole(e.target.value)}
                            className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono"
                            placeholder="e.g., Senior Data Engineer"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">
                            ORGANIZATION_NAME
                          </label>
                          <input
                            type="text"
                            value={expCompany}
                            onChange={(e) => setExpCompany(e.target.value)}
                            className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono"
                            placeholder="e.g., Code Conquerors"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">
                            DURATION_PERIOD
                          </label>
                          <input
                            type="text"
                            value={expPeriod}
                            onChange={(e) => setExpPeriod(e.target.value)}
                            className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono"
                            placeholder="e.g., Jun 2025 - Present"
                          />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">
                            LOCATION_GEOLOCATION
                          </label>
                          <input
                            type="text"
                            value={expLocation}
                            onChange={(e) => setExpLocation(e.target.value)}
                            className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono"
                            placeholder="e.g., Guna, MP, India"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                            ACHIEVEMENTS_BULLETS
                          </label>
                          <button
                            type="button"
                            onClick={() => setExpHighlights([...expHighlights, ""])}
                            className="px-2.5 py-1 text-[10px] border border-neutral-800 text-[var(--theme-accent)] hover:text-cyan-300 hover:bg-neutral-800 rounded-none transition uppercase tracking-wider font-bold cursor-pointer"
                          >
                            + ADD_BULLET
                          </button>
                        </div>

                        {expHighlights.map((hl, hlIdx) => (
                          <div key={hlIdx} className="flex gap-2">
                            <input
                              type="text"
                              value={hl}
                              onChange={(e) => {
                                const arr = [...expHighlights];
                                arr[hlIdx] = e.target.value;
                                setExpHighlights(arr);
                              }}
                              className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none flex-grow text-xs font-mono"
                              placeholder="Describe quantitative metrics..."
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const arr = expHighlights.filter((_, i) => i !== hlIdx);
                                setExpHighlights(arr.length ? arr : [""]);
                              }}
                              className="px-2.5 border border-red-900/50 bg-red-950/20 text-red-400 rounded-none hover:bg-rose-900 hover:text-white transition flex items-center justify-center p-2.5 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-neutral-800 flex justify-end gap-2 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItemIndex(null);
                            setIsAddingNew(false);
                          }}
                          className="px-4 py-2 bg-transparent text-neutral-400 hover:text-white rounded-none transition text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={stageExperienceForm}
                          className="px-5 py-2 bg-[var(--theme-accent)] hover:bg-cyan-400 text-neutral-950 font-bold rounded-none transition flex items-center space-x-1.5 cursor-pointer text-[10px] uppercase tracking-wider"
                        >
                          <Save className="w-4 h-4 text-neutral-950 shrink-0" />
                          <span>STAGE_ROLE</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ==================================================== */}
              {/* TAB MODULE: BIOGRAPHY (personalInfo in data.json) */}
              {/* ==================================================== */}
              {activeTab === "core" && coreSubTab === "biography" && (
                <div className="flex-grow flex flex-col overflow-y-auto font-mono pr-1">
                  <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-4 rounded-none mb-4 select-none">
                    <div>
                      <h2 className="font-bold text-xs uppercase tracking-wider text-[var(--theme-accent)]">
                        &gt;_ Bio Narrative & Links
                      </h2>
                      <p className="text-[10px] text-neutral-400 select-none">
                        STORED IN DATA.JSON // EDITS AUTO-STAGE TO DRAFT
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 font-mono text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">
                        FULL_NAME_LABEL
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <input
                          type="text"
                          value={draftPortfolio.personalInfo.name}
                          onChange={(e) => updatePersonalField("name", e.target.value)}
                          className="p-2.5 pl-10 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono"
                          placeholder="Arunam Jain"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 pt-2 border-b border-neutral-800 pb-1">
                      <span className="text-[10px] text-[var(--theme-accent)] font-bold uppercase tracking-wider block">
                        Headline Details
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">
                        PRIMARY_TITLE
                      </label>
                      <input
                        type="text"
                        value={draftPortfolio.personalInfo.title}
                        onChange={(e) => updatePersonalField("title", e.target.value)}
                        className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono"
                        placeholder="Data Science Coordinator & Technical Lead"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">
                        SUBTITLE / KEYWORDS
                      </label>
                      <input
                        type="text"
                        value={draftPortfolio.personalInfo.subTitle}
                        onChange={(e) => updatePersonalField("subTitle", e.target.value)}
                        className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono"
                        placeholder="Python Developer & Full-Stack Analyst"
                      />
                    </div>

                    <div className="md:col-span-2 pt-2 border-b border-neutral-800 pb-1">
                      <span className="text-[10px] text-[var(--theme-accent)] font-bold uppercase tracking-wider block">
                        CONTACT & LINKS
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">
                        EMAIL_ADDRESS_MX
                      </label>
                      <input
                        type="email"
                        value={draftPortfolio.personalInfo.email}
                        onChange={(e) => updatePersonalField("email", e.target.value)}
                        className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono"
                        placeholder="arunamjaindps7@gmail.com"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">
                        LOCATION_GEOLOCATION
                      </label>
                      <input
                        type="text"
                        value={draftPortfolio.personalInfo.location}
                        onChange={(e) => updatePersonalField("location", e.target.value)}
                        className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono"
                        placeholder="Guna, MP, India"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">
                        GITHUB_PROFILE_URI
                      </label>
                      <input
                        type="text"
                        value={draftPortfolio.personalInfo.githubUrl}
                        onChange={(e) => updatePersonalField("githubUrl", e.target.value)}
                        className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono"
                        placeholder="https://github.com/ArunamJain"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">
                        LINKEDIN_PROFILE_URI
                      </label>
                      <input
                        type="text"
                        value={draftPortfolio.personalInfo.linkedinUrl}
                        onChange={(e) => updatePersonalField("linkedinUrl", e.target.value)}
                        className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono"
                        placeholder="https://linkedin.com/in/arunam-jain"
                      />
                    </div>

                    <div className="md:col-span-2 pt-2 border-b border-neutral-800 pb-1">
                      <span className="text-[10px] text-[var(--theme-accent)] font-bold uppercase tracking-wider block">
                        BIO_NARRATIVE_LOG
                      </span>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">
                        BIOGRAPHY_SUMMARY
                      </label>
                      <textarea
                        value={draftPortfolio.personalInfo.bio}
                        onChange={(e) => updatePersonalField("bio", e.target.value)}
                        rows={4}
                        className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono leading-relaxed"
                        placeholder="Write biography summary..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ==================================================== */}
              {/* TAB MODULE: CERTIFICATIONS */}
              {/* ==================================================== */}
              {activeTab === "certifications" && (
                <div className="flex-grow flex flex-col overflow-y-auto pr-1">
                  {editingItemIndex === null && !isAddingNew ? (
                    <div className="space-y-4 flex-grow flex flex-col">
                      <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-4 rounded-none select-none">
                        <div>
                          <h2 className="font-mono font-semibold text-xs tracking-wider uppercase text-[var(--theme-accent)]">
                            &gt;_ CERTIFICATION_REGISTRY
                          </h2>
                          <p className="text-[11px] text-neutral-400 font-mono">
                            Manage validated certifications and credentials
                          </p>
                        </div>
                        <button
                          onClick={startAddCertification}
                          className="px-3.5 py-2 bg-[var(--theme-accent)] hover:bg-cyan-400 text-neutral-950 font-semibold rounded-none transition duration-200 text-xs flex items-center space-x-1.5 cursor-pointer font-mono"
                        >
                          <Plus className="w-4 h-4 text-neutral-950 shrink-0" />
                          <span>ADD_CREDENTIAL</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 pb-6">
                        {draftPortfolio.certifications && draftPortfolio.certifications.length > 0 ? (
                          draftPortfolio.certifications.map((cert, idx) => {
                            const deleteKey = `cert-${idx}`;
                            return (
                              <div
                                key={`${cert.name}-${idx}`}
                                className="bg-neutral-950 p-4 border border-neutral-800 rounded-none hover:border-[var(--theme-accent)]/40 transition duration-200 relative flex flex-col md:flex-row justify-between items-start gap-4 font-mono"
                              >
                                <div className="flex-grow space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold text-xs text-white uppercase tracking-wide">
                                      &gt; {cert.name}
                                    </span>
                                    <span className="text-[var(--theme-accent)] font-semibold text-[10px]">
                                      [{cert.issuer}]
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-neutral-400">ISSUED: {cert.date}</p>
                                  {cert.credentialUrl && (
                                    <p className="text-[10px] text-neutral-500 truncate max-w-lg">
                                      URL: {cert.credentialUrl}
                                    </p>
                                  )}
                                </div>

                                <div className="flex self-end md:self-center gap-2 select-none shrink-0">
                                  <button
                                    onClick={() => startEditCertification(idx)}
                                    className="px-3 py-1.5 border border-neutral-800 bg-neutral-900 text-neutral-300 rounded-none hover:text-white hover:border-[var(--theme-accent)] transition duration-150 flex items-center space-x-1.5 cursor-pointer text-[10px] font-semibold uppercase"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
                                    <span>EDIT</span>
                                  </button>

                                  {confirmDeleteKey === deleteKey ? (
                                    <div className="flex gap-1.5">
                                      <button
                                        onClick={() => deleteCertificationIndex(idx)}
                                        className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-none cursor-pointer font-bold text-[10px] uppercase"
                                      >
                                        CONFIRM
                                      </button>
                                      <button
                                        onClick={() => setConfirmDeleteKey(null)}
                                        className="px-2.5 py-1.5 border border-neutral-700 text-neutral-300 hover:text-white rounded-none cursor-pointer text-[10px] uppercase"
                                      >
                                        CANCEL
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setConfirmDeleteKey(deleteKey)}
                                      className="px-3 py-1.5 border border-red-900/50 bg-red-950/20 hover:bg-rose-950/40 text-red-400 rounded-none hover:border-red-800 hover:text-rose-300 transition duration-150 flex items-center space-x-1.5 cursor-pointer text-[10px] font-semibold uppercase"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>DELETE</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-12 border border-dashed border-neutral-800 font-mono text-neutral-500 text-xs rounded-none">
                            NO CERTIFICATIONS IN DRAFT. CLICK &apos;ADD_CREDENTIAL&apos; TO ADD ONE.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Certification Form Editor
                    <div className="space-y-4 pb-6 font-mono text-xs">
                      <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
                        <span className="font-semibold text-xs flex items-center space-x-2 text-[var(--theme-accent)] uppercase">
                          {isAddingNew ? (
                            <Award className="w-4 h-4 text-[var(--theme-accent)]" />
                          ) : (
                            <Edit3 className="w-4 h-4 text-[var(--theme-accent)]" />
                          )}
                          <span>{isAddingNew ? "Add New Certificate" : "UPDATE_CREDENTIAL_NODE"}</span>
                        </span>
                        <button
                          onClick={() => {
                            setEditingItemIndex(null);
                            setIsAddingNew(false);
                          }}
                          className="px-2.5 py-1 text-xs border border-neutral-800 rounded-none text-neutral-400 hover:text-white cursor-pointer hover:bg-neutral-800/40 transition"
                        >
                          CANCEL
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[10px] font-medium block uppercase tracking-wider text-[var(--theme-accent)]">
                            {isAddingNew ? "Title" : "Certification Name"}
                          </label>
                          <input
                            type="text"
                            value={certName}
                            onChange={(e) => setCertName(e.target.value)}
                            className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono"
                            placeholder={isAddingNew ? "e.g., Data Analysis with Python" : "e.g., Python (Basic) Certificate"}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-medium block uppercase tracking-wider text-[var(--theme-accent)]">
                            {isAddingNew ? "Issuer / Organization" : "Issuer / Authority"}
                          </label>
                          <input
                            type="text"
                            value={certIssuer}
                            onChange={(e) => setCertIssuer(e.target.value)}
                            className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono"
                            placeholder={isAddingNew ? "e.g., freeCodeCamp" : "e.g., HackerRank"}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-medium block uppercase tracking-wider text-[var(--theme-accent)]">
                            {isAddingNew ? "Issue Date / Period" : "Issue Year / Date"}
                          </label>
                          <input
                            type="text"
                            value={certDate}
                            onChange={(e) => setCertDate(e.target.value)}
                            className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono"
                            placeholder={isAddingNew ? "e.g., 2026" : "e.g., 2024"}
                          />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[10px] font-medium block uppercase tracking-wider text-[var(--theme-accent)]">
                            Credential URL
                          </label>
                          <input
                            type="text"
                            value={certUrl}
                            onChange={(e) => setCertUrl(e.target.value)}
                            className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono"
                            placeholder="e.g., https://proof.freecodecamp.org/..."
                          />
                          <p className="text-[9px] text-neutral-500 font-mono tracking-tight leading-normal">
                            Optional direct URL link to the certificate proof or uploaded PDF file
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-neutral-800 flex justify-end gap-2 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItemIndex(null);
                            setIsAddingNew(false);
                          }}
                          className="px-4 py-2 bg-transparent text-neutral-400 hover:text-white rounded-none transition text-xs font-semibold font-mono cursor-pointer"
                        >
                          CANCEL
                        </button>
                        <button
                          type="button"
                          onClick={stageCertificationForm}
                          className="px-5 py-2 bg-[var(--theme-accent)] hover:bg-cyan-400 text-neutral-950 font-semibold rounded-none transition flex items-center space-x-1.5 cursor-pointer text-xs font-mono"
                        >
                          <Save className="w-4 h-4 text-neutral-950 shrink-0" />
                          <span>{isAddingNew ? "STAGE_CERTIFICATE" : "STAGE_CREDENTIAL"}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ==================================================== */}
              {/* PERSISTENT GITHUB COMMIT / SAVE BAR */}
              {/* ==================================================== */}
              <div className="mt-3 pt-3 border-t border-neutral-800 bg-neutral-950/90 p-3 flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 shrink-0">
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  disabled={isSaving}
                  placeholder="Optional commit message (default: update data.json via Aurora admin)..."
                  className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none text-[11px] font-mono placeholder-neutral-600"
                />

                <div className="flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    disabled={!hasUnsavedChanges || isSaving}
                    className="px-3 py-2 border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-none transition text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Discard all unstaged local edits"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>DISCARD</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveToGitHub}
                    disabled={isSaving || (!hasUnsavedChanges && dataSource === "github")}
                    className="px-4 py-2 bg-[var(--theme-accent)] hover:bg-cyan-400 text-neutral-950 font-bold rounded-none transition text-[10px] uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                  >
                    {isSaving ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-neutral-950" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5 text-neutral-950" />
                    )}
                    <span>{isSaving ? "COMMITTING_TO_GITHUB..." : "SAVE_TO_GITHUB"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
