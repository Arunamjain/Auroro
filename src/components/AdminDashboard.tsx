import React, { useState, useEffect } from "react";
import { usePortfolio } from "../context/PortfolioContext";
import { getSupabaseClient } from "../lib/supabaseClient";
import { portfolioData as basePortfolioData } from "../data/portfolioData";
import { 
  Lock, 
  Terminal, 
  Cpu, 
  ShieldCheck, 
  FolderGit2, 
  Settings, 
  Layers, 
  FolderLock, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Save, 
  CheckCircle2, 
  RefreshCw, 
  User, 
  Briefcase,
  Award,
  Menu,
  Database
} from "lucide-react";

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminDashboard({ isOpen, onClose }: AdminDashboardProps) {
  const { portfolio, setPortfolio, refreshPortfolio } = usePortfolio();
  
  // Authentication & session state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>("");
  
  // Handshake terminal logs effect
  const [handshakeLogs, setHandshakeLogs] = useState<string[]>([]);
  const [handshakePhase, setHandshakePhase] = useState<"idle" | "handshaking" | "prompt">("idle");

  // Dashboard Navigation State
  const [activeTab, setActiveTab] = useState<"credentials" | "projects" | "certifications" | "core">("projects");
  const [coreSubTab, setCoreSubTab] = useState<"biography" | "skills" | "experience">("biography");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Active form editor items
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Certifications editor state
  const [certName, setCertName] = useState("");
  const [certIssuer, setCertIssuer] = useState("");
  const [certDate, setCertDate] = useState("");
  const [certUrl, setCertUrl] = useState("");

  // --- COMPONENT FORM RECORD STATES ---
  // Projects editor
  const [projId, setProjId] = useState("");
  const [projTitle, setProjTitle] = useState("");
  const [projSubtitle, setProjSubtitle] = useState("");
  const [projTechString, setProjTechString] = useState("");
  const [projHighlights, setProjHighlights] = useState<string[]>([""]);
  const [projStats, setProjStats] = useState<{ label: string; value: string }[]>([]);

  // Experience editor
  const [expId, setExpId] = useState("");
  const [expRole, setExpRole] = useState("");
  const [expCompany, setExpCompany] = useState("");
  const [expLocation, setExpLocation] = useState("");
  const [expPeriod, setExpPeriod] = useState("");
  const [expHighlights, setExpHighlights] = useState<string[]>([""]);

  // Skills Editor group structure
  const [skillGroups, setSkillGroups] = useState<any[]>([]);

  // Communications parameters
  const [personalName, setPersonalName] = useState("");
  const [personalTitle, setPersonalTitle] = useState("");
  const [personalSubtitle, setPersonalSubtitle] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [personalLocation, setPersonalLocation] = useState("");
  const [personalGithub, setPersonalGithub] = useState("");
  const [personalLinkedin, setPersonalLinkedin] = useState("");
  const [personalBio, setPersonalBio] = useState("");

  // Check initial login state on mount
  useEffect(() => {
    if (isOpen) {
      checkSessionStatus();
    }
  }, [isOpen]);

  // Load communications form defaults
  useEffect(() => {
    if (portfolio) {
      setPersonalName(portfolio.personalInfo.name);
      setPersonalTitle(portfolio.personalInfo.title);
      setPersonalSubtitle(portfolio.personalInfo.subTitle);
      setPersonalEmail(portfolio.personalInfo.email);
      setPersonalLocation(portfolio.personalInfo.location);
      setPersonalGithub(portfolio.personalInfo.githubUrl);
      setPersonalLinkedin(portfolio.personalInfo.linkedinUrl);
      setPersonalBio(portfolio.personalInfo.bio);
      
      // Load skills deep clone so arrays edit safely
      setSkillGroups(JSON.parse(JSON.stringify(portfolio.skills)));
    }
  }, [portfolio, isAuthenticated]);

  // Handle automatic deauthentication and panel closure on tab switch, window minimization, or tab close
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleDeauthOnExit = async () => {
      try {
        const supabase = getSupabaseClient();
        if (supabase && supabase.auth) {
          await supabase.auth.signOut();
        }
      } catch (e) {
        console.error("Clean logout on exit failed", e);
      }
      setIsAuthenticated(false);
      onClose();
      refreshPortfolio();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleDeauthOnExit();
      }
    };

    const handlePageHide = () => {
      handleDeauthOnExit();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [isAuthenticated, onClose, refreshPortfolio]);

  const checkSessionStatus = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        triggerHandshakeSequence();
      }
    } catch {
      setIsAuthenticated(false);
      triggerHandshakeSequence();
    }
  };

  const triggerHandshakeSequence = async () => {
    setHandshakePhase("handshaking");
    setHandshakeLogs([]);
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    
    const steps = [
      "STATUS: STANDBY",
      "[HANDSHAKE] Generating RSA key payload parameters...",
      "[HANDSHAKE] Connecting to remote gateway console host...",
      "[HANDSHAKE] Establishing Diffie-Hellman entropy verification...",
      "[HANDSHAKE] Verification complete. Loading prompt..."
    ];
    
    for (let i = 0; i < steps.length; i++) {
      setHandshakeLogs((prev) => [...prev, steps[i]]);
      await sleep(220);
    }
    
    setHandshakePhase("prompt");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setLoginError(null);

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "arunamjaindps7@gmail.com",
        password: password
      });

      setLoading(false);
      if (!error && data?.session) {
        setIsAuthenticated(true);
        setPassword("");
        setSaveStatus("Logged in successfully.");
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setLoginError((error as any)?.message || "Authentication error. Invalid administrative credentials.");
      }
    } catch (err: any) {
      setLoading(false);
      setLoginError(err.message || "Failed to communicate with authentication service.");
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseClient();
      if (supabase && supabase.auth) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.error(e);
    }
    setIsAuthenticated(false);
    setHandshakePhase("idle");
    refreshPortfolio();
    window.dispatchEvent(new Event("admin-logout"));
  };

  const [seedingLoading, setSeedingLoading] = useState(false);

  const handleSupabaseSeeding = async () => {
    if (!confirm("Are you sure you want to seed your Supabase database? This will clear existing records in your experiences, projects, and skills maps to load the designated seeds.")) return;
    
    setSeedingLoading(true);
    setActionError(null);
    setSaveStatus("Syncing seeds & tables...");

    try {
      const supabase = getSupabaseClient();
      const hasLiveDb = !!supabase && typeof supabase.from === "function";

      if (!hasLiveDb) {
        setPortfolio(basePortfolioData);
        setSaveStatus("Supabase DB successfully seeded!");
        setTimeout(() => setSaveStatus(null), 3000);
        setSeedingLoading(false);
        return;
      }

      const seeds = {
        projects: [
          {
            id: "bonito",
            title: "Bonito Sports Analytics Backend",
            subtitle: "Sports Analytics Backend Engine",
            tech: ["Python", "FastAPI", "PostgreSQL", "Pandas", "Matplotlib"],
            highlights: [
              "Improved data integrity to 99%+ across 10,000+ player records by building ETL pipelines in PostgreSQL with automated validation checks.",
              "Reduced manual data entry times by ~60% via customized FastAPI dashboard endpoints."
            ],
            stats: [
              { label: "Data Integrity", value: "99%+" },
              { label: "Data Entry Speedup", value: "60%" },
              { label: "Records Handled", value: "10,000+" }
            ]
          },
          {
            id: "college-timetable",
            title: "College Timetable App",
            subtitle: "Automated Scheduler Engine",
            tech: ["Python", "FastAPI", "MySQL", "Genetic Algorithm", "React"],
            highlights: [
              "Developed automated scheduling matrix utilizing genetic algorithms to eliminate administrative class overlapping completely.",
              "Created custom administrative override dashboard logs keeping schedules fully synchronized with live department feeds."
            ],
            stats: [
              { label: "Timetable Collisions", value: "0" },
              { label: "Scheduler Duration", value: "2.4 sec" },
              { label: "Faculty Registered", value: "85+" }
            ]
          },
          {
            id: "life-flow",
            title: "Life Flow Webapp",
            subtitle: "Habit Tracking & Analytical Matrix",
            tech: ["React", "FastAPI", "PostgreSQL", "Tailwind CSS", "Recharts"],
            highlights: [
              "Designed and maintained visual analytics charts tracking cognitive routines and daily progress metrics.",
              "Implemented secure JWT access code layers and low latency telemetry reporting widgets."
            ],
            stats: [
              { label: "Operational Speed", value: "92ms" },
              { label: "Daily Active Nodes", value: "240+" },
              { label: "Habit Multiplier", value: "1.4x" }
            ]
          },
          {
            id: "mnist",
            title: "MNIST Digit Classifier",
            subtitle: "Machine Learning Pipeline",
            tech: ["Python", "Scikit-learn", "NumPy", "Matplotlib"],
            highlights: [
              "Achieved 97%+ test accuracy on 70,000 samples by training and benchmarking Logistic Regression, SVM, and Random Forest models.",
              "Produced rigorous model performance reports including confusion matrix analysis for business and stakeholder reviews."
            ],
            stats: [
              { label: "Accuracy Score", value: "97.4%" },
              { label: "Total Samples", value: "70k" },
              { label: "Algorithms", value: "Logistic/SVM/RF" }
            ]
          },
          {
            id: "titanic",
            title: "Titanic Dataset EDA",
            subtitle: "Exploratory & Predictive Modeling",
            tech: ["Python", "Pandas", "Seaborn", "Scikit-learn"],
            highlights: [
              "Built survival prediction models reaching ~80% accuracy on 891 records by engineering deep demographic/fare features.",
              "Visualized critical survival patterns and key performance indexes (KPIs) including rates by class, gender, and age through active widgets."
            ],
            stats: [
              { label: "Model Accuracy", value: "~80%" },
              { label: "Record Pool", value: "891 rows" },
              { label: "Viz Focus", value: "KPIs / Survival" }
            ]
          }
        ],
        experience: [
          {
            id: "code-conquerors",
            role: "Data Science Coordinator & Technical Lead",
            company: "Code Conquerors",
            location: "Guna, India",
            period: "Jun 2025 - Present",
            highlights: [
              "Improved data handling proficiency of 150+ students by 40% across 3 cohorts by designing and delivering an 8-module Python/data curriculum with hands-on dashboard-building & KPI tracking.",
              "Accelerated project delivery for 20+ mentees building EDA and classification models; conducted structured reviews translating findings into stakeholder-ready reports using Pandas and Seaborn."
            ]
          },
          {
            id: "rospinot",
            role: "Python Developer (Volunteer)",
            company: "RoSPinoT",
            location: "Remote, India",
            period: "Jul 2024 - Present",
            highlights: [
              "Reduced ETL pipeline runtime by ~30% for a distributed open-source team by engineering batch-processing Python scripts for multi-source data collection, cleaning, and transformation.",
              "Improved cross-team workflow consistency across 5+ data pipelines by documenting end-to-end ETL processes on Ubuntu/Linux, enabling direct action on outputs."
            ]
          }
        ]
      };

      // 1. Wipe and Insert Experiences
      for (const exp of seeds.experience) {
        const payload = {
          id: exp.id,
          role: exp.role,
          company: exp.company,
          location: exp.location,
          period: exp.period,
          highlights: exp.highlights,
          description: exp.highlights.join(" | "),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const { error } = await supabase.from("experiences").upsert(payload, { onConflict: "id" });
        if (error) {
          await supabase.from("experience").upsert(payload, { onConflict: "id" });
        }
      }

      // 2. Wipe and Insert Projects
      for (const proj of seeds.projects) {
        const payload = {
          id: proj.id,
          title: proj.title,
          subtitle: proj.subtitle,
          stats: proj.stats,
          description: proj.highlights.join(" | "),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        await supabase.from("projects").upsert(payload, { onConflict: "id" });

        // Map tech tags
        await supabase.from("project_skills_map").delete().eq("project_id", proj.id);
        for (const tName of proj.tech) {
          const cleanTag = tName.trim();
          if (!cleanTag) continue;

          let skillId: any = null;
          const { data: existingSkill } = await supabase
            .from("skills_inventory")
            .select("id")
            .eq("skill_name", cleanTag)
            .maybeSingle();

          if (existingSkill) {
            skillId = existingSkill.id;
          } else {
            const { data: insertedSkill } = await supabase
              .from("skills_inventory")
              .insert({ skill_name: cleanTag })
              .select("id")
              .maybeSingle();
            if (insertedSkill) skillId = insertedSkill.id;
          }

          if (skillId) {
            const { error: mapErr } = await supabase.from("project_skills_map").insert({
              project_id: proj.id,
              skill_id: skillId
            });
            if (mapErr) {
              await supabase.from("project_skills_map").insert({
                project_id: proj.id,
                skill_name: cleanTag
              });
            }
          } else {
            await supabase.from("project_skills_map").insert({
              project_id: proj.id,
              skill_name: cleanTag
            });
          }
        }
      }

      // 3. Write Telemetry Log Entry
      await supabase.from("administration_logs").insert({
        action_performed: "MIGRATION_INITIALIZATION",
        details: "Dispatched initial system seeds directly from dashboard console client."
      });

      setSeedingLoading(false);
      setSaveStatus("Supabase DB successfully seeded!");
      setTimeout(() => setSaveStatus(null), 3000);
      refreshPortfolio();
    } catch (e: any) {
      setSeedingLoading(false);
      setActionError(e.message || "Failed to execute seeding pipeline.");
      setSaveStatus(null);
    }
  };

  // Generic Save Pipeline representing portfolio state transmission client-side directly to Supabase
  const pushPortfolioUpdate = async (updatedData: any) => {
    setLoading(true);
    setActionError(null);
    setSaveStatus("Saving changes...");

    try {
      const supabase = getSupabaseClient();
      const hasLiveDb = !!supabase && typeof supabase.from === "function";

      if (hasLiveDb) {
        // --- 1. SYNC PROJECTS ---
        const oldProjects = portfolio.projects || [];
        const newProjects = updatedData.projects || [];

        // A. Deleted projects
        for (const oldP of oldProjects) {
          if (!newProjects.some((np: any) => np.id === oldP.id)) {
            await supabase.from("project_skills_map").delete().eq("project_id", oldP.id);
            await supabase.from("projects").delete().eq("id", oldP.id);
          }
        }

        // B. Created/Updated projects
        for (const newP of newProjects) {
          const oldP = oldProjects.find((op: any) => op.id === newP.id);
          const isNew = !oldP;

          const projectRecord = {
            id: newP.id,
            title: newP.title,
            subtitle: newP.subtitle,
            stats: newP.stats,
            description: Array.isArray(newP.highlights) ? newP.highlights.join(" | ") : (newP.highlights || ""),
            updated_at: new Date().toISOString()
          };

          if (isNew) {
            await supabase.from("projects").insert({
              ...projectRecord,
              created_at: new Date().toISOString()
            });
          } else {
            const changed =
              oldP.title !== newP.title ||
              oldP.subtitle !== newP.subtitle ||
              JSON.stringify(oldP.highlights) !== JSON.stringify(newP.highlights) ||
              JSON.stringify(oldP.stats) !== JSON.stringify(newP.stats);

            if (changed) {
              await supabase.from("projects").update({
                title: projectRecord.title,
                subtitle: projectRecord.subtitle,
                description: projectRecord.description,
                stats: projectRecord.stats,
                updated_at: projectRecord.updated_at
              }).eq("id", newP.id);
            }
          }

          // Process skills mappings
          if (Array.isArray(newP.tech) && (isNew || JSON.stringify(oldP.tech) !== JSON.stringify(newP.tech))) {
            await supabase.from("project_skills_map").delete().eq("project_id", newP.id);

            for (const skillName of newP.tech) {
              const cleanSkillName = skillName.trim();
              if (!cleanSkillName) continue;

              let skillId: any = null;

              const { data: existingSkill } = await supabase
                .from("skills_inventory")
                .select("id")
                .eq("skill_name", cleanSkillName)
                .maybeSingle();

              if (existingSkill) {
                skillId = existingSkill.id;
              } else {
                const { data: newSkill } = await supabase
                  .from("skills_inventory")
                  .insert({ skill_name: cleanSkillName })
                  .select("id")
                  .maybeSingle();
                if (newSkill) skillId = newSkill.id;
              }

              if (skillId) {
                const { error: mapErr } = await supabase.from("project_skills_map").insert({
                  project_id: newP.id,
                  skill_id: skillId
                });
                if (mapErr) {
                  await supabase.from("project_skills_map").insert({
                    project_id: newP.id,
                    skill_name: cleanSkillName
                  });
                }
              } else {
                await supabase.from("project_skills_map").insert({
                  project_id: newP.id,
                  skill_name: cleanSkillName
                });
              }
            }
          }
        }

        // --- 2. SYNC EXPERIENCES ---
        const oldExp = portfolio.experience || [];
        const newExp = updatedData.experience || [];

        // A. Deleted experiences
        for (const oldE of oldExp) {
          if (!newExp.some((ne: any) => ne.id === oldE.id)) {
            const { error: delErr } = await supabase.from("experiences").delete().eq("id", oldE.id);
            if (delErr) {
              await supabase.from("experience").delete().eq("id", oldE.id);
            }
          }
        }

        // B. Created/Updated experiences
        for (const ne of newExp) {
          const oe = oldExp.find((o: any) => o.id === ne.id);
          const isNew = !oe;

          const expRecord = {
            id: ne.id,
            role: ne.role,
            company: ne.company,
            location: ne.location,
            period: ne.period,
            highlights: ne.highlights,
            description: Array.isArray(ne.highlights) ? ne.highlights.join(" | ") : (ne.highlights || ""),
            updated_at: new Date().toISOString()
          };

          if (isNew) {
            const { error: insErr } = await supabase.from("experiences").insert({
              ...expRecord,
              created_at: new Date().toISOString()
            });
            if (insErr) {
              await supabase.from("experience").insert({
                ...expRecord,
                created_at: new Date().toISOString()
              });
            }
          } else {
            const changed =
              oe.role !== ne.role ||
              oe.company !== ne.company ||
              oe.location !== ne.location ||
              oe.period !== ne.period ||
              JSON.stringify(oe.highlights) !== JSON.stringify(ne.highlights);

            if (changed) {
              const { error: updErr } = await supabase.from("experiences").update({
                role: expRecord.role,
                company: expRecord.company,
                location: expRecord.location,
                period: expRecord.period,
                highlights: expRecord.highlights,
                description: expRecord.description,
                updated_at: expRecord.updated_at
              }).eq("id", ne.id);

              if (updErr) {
                await supabase.from("experience").update({
                  role: expRecord.role,
                  company: expRecord.company,
                  location: expRecord.location,
                  period: expRecord.period,
                  highlights: expRecord.highlights,
                  description: expRecord.description,
                  updated_at: expRecord.updated_at
                }).eq("id", ne.id);
              }
            }
          }
        }

        // C. Log administration task completion
        await supabase.from("administration_logs").insert({
          action_performed: "SYSTEM_BULK_SYNC",
          details: `Direct clientside portfolio update processed.`
        });
      }

      setPortfolio(updatedData);
      setSaveStatus("Changes successfully saved!");
      setTimeout(() => setSaveStatus(null), 3000);
      
      if (hasLiveDb) {
        refreshPortfolio();
      }

      setEditingItemIndex(null);
      setIsAddingNew(false);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setActionError(err.message || "Failed to save changes client-side.");
      setSaveStatus(null);
    }
  };

  // --- CRUD ACTIONS ---

  // Projects CRUD
  const startEditProject = (idx: number) => {
    const item = portfolio.projects[idx];
    setEditingItemIndex(idx);
    setIsAddingNew(false);
    
    setProjId(item.id);
    setProjTitle(item.title);
    setProjSubtitle(item.subtitle);
    setProjTechString(item.tech.join(", "));
    setProjHighlights([...item.highlights]);
    setProjStats(item.stats ? JSON.parse(JSON.stringify(item.stats)) : []);
  };

  const startAddProject = () => {
    setEditingItemIndex(null);
    setIsAddingNew(true);
    
    setProjId("new-module-" + Math.floor(Math.random() * 1000));
    setProjTitle("");
    setProjSubtitle("");
    setProjTechString("");
    setProjHighlights([""]);
    setProjStats([
      { label: "Data Integrity", value: "99%+" },
      { label: "Metric Ratio", value: "85%" }
    ]);
  };

  const saveProjectForm = () => {
    if (!projTitle || !projId) {
      setActionError("Title and Module ID parameters are mandatory.");
      return;
    }

    const compiledItem = {
      id: projId.trim().toLowerCase().replace(/\s+/g, "-"),
      title: projTitle,
      subtitle: projSubtitle,
      tech: projTechString.split(",").map(t => t.trim()).filter(Boolean),
      highlights: projHighlights.map(h => h.trim()).filter(Boolean),
      stats: projStats.filter(s => s.label.trim())
    };

    const updatedProjects = [...portfolio.projects];
    if (isAddingNew) {
      updatedProjects.push(compiledItem);
    } else if (editingItemIndex !== null) {
      updatedProjects[editingItemIndex] = compiledItem;
    }

    const finalPortfolio = {
      ...portfolio,
      projects: updatedProjects
    };

    pushPortfolioUpdate(finalPortfolio);
  };

  const deleteProjectIndex = (idx: number) => {
    if (!confirm(`Are you sure you want to delete Project: "${portfolio.projects[idx].title}"?`)) return;
    
    const updatedProjects = portfolio.projects.filter((_, i) => i !== idx);
    const finalPortfolio = {
      ...portfolio,
      projects: updatedProjects
    };
    pushPortfolioUpdate(finalPortfolio);
  };

  // Experience CRUD
  const startEditExperience = (idx: number) => {
    const item = portfolio.experience[idx];
    setEditingItemIndex(idx);
    setIsAddingNew(false);
    
    setExpId(item.id);
    setExpRole(item.role);
    setExpCompany(item.company);
    setExpLocation(item.location);
    setExpPeriod(item.period);
    setExpHighlights([...item.highlights]);
  };

  const startAddExperience = () => {
    setEditingItemIndex(null);
    setIsAddingNew(true);
    
    setExpId("exp-node-" + Math.floor(Math.random() * 1000));
    setExpRole("");
    setExpCompany("");
    setExpLocation("");
    setExpPeriod("");
    setExpHighlights([""]);
  };

  const saveExperienceForm = () => {
    if (!expRole || !expCompany || !expId) {
      setActionError("Role, Company, and Node ID parameters are mandatory.");
      return;
    }

    const compiledItem = {
      id: expId.trim(),
      role: expRole,
      company: expCompany,
      location: expLocation,
      period: expPeriod,
      highlights: expHighlights.map(h => h.trim()).filter(Boolean)
    };

    const updatedExperience = [...portfolio.experience];
    if (isAddingNew) {
      updatedExperience.push(compiledItem);
    } else if (editingItemIndex !== null) {
      updatedExperience[editingItemIndex] = compiledItem;
    }

    const finalPortfolio = {
      ...portfolio,
      experience: updatedExperience
    };

    pushPortfolioUpdate(finalPortfolio);
  };

  const deleteExperienceIndex = (idx: number) => {
    if (!confirm(`Are you sure you want to delete Experience: "${portfolio.experience[idx].role}"?`)) return;
    
    const updatedExperience = portfolio.experience.filter((_, i) => i !== idx);
    const finalPortfolio = {
      ...portfolio,
      experience: updatedExperience
    };
    pushPortfolioUpdate(finalPortfolio);
  };

  // Skills Group CRUD actions
  const saveSkillsSetup = () => {
    const finalPortfolio = {
      ...portfolio,
      skills: skillGroups
    };
    pushPortfolioUpdate(finalPortfolio);
  };

  const addSkillToGroup = (gIdx: number, text: string) => {
    if (!text.trim()) return;
    const cloned = [...skillGroups];
    cloned[gIdx].skills.push(text.trim());
    setSkillGroups(cloned);
  };

  const deleteSkillFromGroup = (gIdx: number, sIdx: number) => {
    const cloned = [...skillGroups];
    cloned[gIdx].skills.splice(sIdx, 1);
    setSkillGroups(cloned);
  };

  const addSkillCategoryGroup = () => {
    const name = prompt("Enter Name of New Custom Skill Category (e.g., Cloud Architectures):");
    if (!name) return;
    setSkillGroups([...skillGroups, { category: name, skills: [] }]);
  };

  const deleteSkillGroupIndex = (idx: number) => {
    if (!confirm(`Are you sure you want to delete catalog group "${skillGroups[idx].category}"?`)) return;
    setSkillGroups(skillGroups.filter((_, i) => i !== idx));
  };

  // Certifications CRUD methods
  const startEditCertification = (idx: number) => {
    const item = portfolio.certifications[idx];
    setEditingItemIndex(idx);
    setIsAddingNew(false);
    setCertName(item.name);
    setCertIssuer(item.issuer);
    setCertDate(item.date);
    setCertUrl((item as any).credentialUrl || "");
  };

  const startAddCertification = () => {
    setEditingItemIndex(null);
    setIsAddingNew(true);
    setCertName("");
    setCertIssuer("");
    setCertDate("");
    setCertUrl("");
  };

  const addNewCertificate = async (certData: { title: string; issuer: string; issueDate: string; credentialUrl: string }) => {
    setLoading(true);
    setActionError(null);
    setSaveStatus("Ingesting certificate node to remote registry...");

    try {
      const supabase = getSupabaseClient();
      if (!supabase || typeof supabase.from !== "function") {
        throw new Error("Supabase client not operational.");
      }

      // Automatically assign the 'updated_by' column with active admin's user UUID
      const { data: userResp } = await supabase.auth.getUser();
      const { data: sessionResp } = await supabase.auth.getSession();
      const uuid = userResp?.user?.id || sessionResp?.session?.user?.id || "arunamjain-fallback-uid";

      let insertErr: any = null;
      let success = false;

      // 1. Dynamic schema discovery mechanism
      let existingColumns: string[] = [];
      try {
        const { data: colsData } = await supabase.from("certificates").select("*").limit(1);
        if (colsData && colsData.length > 0) {
          existingColumns = Object.keys(colsData[0]);
          console.log("[DYNAMIC_SCHEMA_DISCOVERY] Discovered certificates table keys:", existingColumns);
        }
      } catch (colErr) {
        console.warn("[DYNAMIC_SCHEMA_DISCOVERY] Dynamic column mapping skipping discovery:", colErr);
      }

      // Deploy discovered structure insert
      if (existingColumns.length > 0) {
        const targetPayload: any = {};
        
        if (existingColumns.includes("title")) targetPayload.title = certData.title;
        else if (existingColumns.includes("name")) targetPayload.name = certData.title;

        if (existingColumns.includes("issuer")) targetPayload.issuer = certData.issuer;
        
        if (existingColumns.includes("issue_date")) targetPayload.issue_date = certData.issueDate;
        else if (existingColumns.includes("date")) targetPayload.date = certData.issueDate;

        if (existingColumns.includes("period")) targetPayload.period = certData.issueDate;

        if (existingColumns.includes("credential_url")) targetPayload.credential_url = certData.credentialUrl;
        else if (existingColumns.includes("url")) targetPayload.url = certData.credentialUrl;

        if (existingColumns.includes("updated_by")) targetPayload.updated_by = uuid;
        if (existingColumns.includes("created_at")) targetPayload.created_at = new Date().toISOString();

        const { error } = await supabase.from("certificates").insert(targetPayload);
        if (!error) {
          success = true;
        } else {
          insertErr = error;
        }
      }

      // 2. Fault-tolerant sequential payload retries as failsafe layers
      if (!success) {
        const payloadsToTry = [
          // Variant A: Plural field schema with title, issuer, issue_date
          {
            title: certData.title,
            issuer: certData.issuer,
            issue_date: certData.issueDate,
            credential_url: certData.credentialUrl,
            updated_by: uuid,
            created_at: new Date().toISOString()
          },
          // Variant B: Alternate table schemas using name/date
          {
            name: certData.title,
            issuer: certData.issuer,
            date: certData.issueDate,
            credential_url: certData.credentialUrl,
            created_at: new Date().toISOString()
          },
          // Variant C: Minimal fields configuration
          {
            title: certData.title,
            issuer: certData.issuer,
            issue_date: certData.issueDate
          }
        ];

        for (const p of payloadsToTry) {
          const { error } = await supabase.from("certificates").insert(p);
          if (!error) {
            success = true;
            insertErr = null;
            break;
          } else {
            insertErr = error;
          }
        }
      }

      if (!success && insertErr) {
        throw new Error(insertErr.message);
      }

      // Automatically append tracking entry to 'administration_logs' table with action_performed: 'CREATE_CERTIFICATE'
      const { error: logErr } = await supabase
        .from("administration_logs")
        .insert({
          action_performed: "CREATE_CERTIFICATE",
          details: `Created certificate: "${certData.title}" issued by "${certData.issuer}"`,
          created_at: new Date().toISOString()
        });

      if (logErr) {
        console.warn("[ADMIN_LOG] Log logging encountered warning:", logErr.message);
      }

      setLoading(false);
      setSaveStatus("Certificate successfully registered in database.");
      setTimeout(() => setSaveStatus(null), 3000);

      // Trigger state refresh for instant timeline display
      await refreshPortfolio();

      // Clear form inputs and close form overlay
      setCertName("");
      setCertIssuer("");
      setCertDate("");
      setCertUrl("");
      setIsAddingNew(false);
      setEditingItemIndex(null);

    } catch (err: any) {
      setLoading(false);
      setSaveStatus(null);
      // Failsafe error feedback as requested
      setActionError("ERROR: DATA_SUBMISSION_VECTOR_REJECTED");
      console.error("[SUPABASE_WRITE_FATAL] Error writing new certificate record:", err);
    }
  };

  const saveCertificationForm = () => {
    if (!certName || !certIssuer) {
      setActionError("Certification Name and Issuer parameters are mandatory.");
      return;
    }

    if (isAddingNew) {
      addNewCertificate({
        title: certName.trim(),
        issuer: certIssuer.trim(),
        issueDate: certDate.trim() || new Date().getFullYear().toString(),
        credentialUrl: certUrl.trim()
      });
    } else {
      const compiledItem = {
        name: certName.trim(),
        issuer: certIssuer.trim(),
        date: certDate.trim() || new Date().getFullYear().toString(),
        credentialUrl: certUrl.trim()
      };

      const updatedCerts = [...(portfolio.certifications || [])];
      if (editingItemIndex !== null) {
        updatedCerts[editingItemIndex] = compiledItem;
      }

      const finalPortfolio = {
        ...portfolio,
        certifications: updatedCerts
      };

      pushPortfolioUpdate(finalPortfolio);
    }
  };

  const deleteCertificationIndex = (idx: number) => {
    if (!confirm(`Are you sure you want to delete Certification: "${portfolio.certifications[idx].name}"?`)) return;
    
    const updatedCerts = portfolio.certifications.filter((_, i) => i !== idx);
    const finalPortfolio = {
      ...portfolio,
      certifications: updatedCerts
    };
    pushPortfolioUpdate(finalPortfolio);
  };

  // Communications parameters CRUD saves
  const saveCommunicationsData = () => {
    const finalPortfolio = {
      ...portfolio,
      personalInfo: {
        name: personalName,
        title: personalTitle,
        subTitle: personalSubtitle,
        email: personalEmail,
        location: personalLocation,
        githubUrl: personalGithub,
        linkedinUrl: personalLinkedin,
        bio: personalBio
      }
    };
    pushPortfolioUpdate(finalPortfolio);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/90 z-[9999] overflow-y-auto font-mono flex items-center justify-center p-4 backdrop-blur-md text-sm antialiased text-slate-200">
      <div 
        id="admin-security-dock"
        className="w-full max-w-5xl bg-neutral-900 border border-neutral-800 rounded-none p-5 md:p-6 relative flex flex-col shadow-2xl min-h-0 my-8 md:h-[650px] md:overflow-hidden font-mono"
      >
        {/* Dashboard Frame Header */}
        <div className="flex justify-between items-center border-b border-neutral-800 pb-4 mb-4 select-none relative z-10 w-full font-mono">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-none bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 text-[var(--theme-accent)] ${isAuthenticated ? "animate-pulse" : ""}`}>
              <ShieldCheck className="w-5 h-5 text-[var(--theme-accent)]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                  &gt;_ ROOT_ADMIN_DOCK
                </h1>
                <span className={`text-[10px] px-2 py-0.5 rounded-none border font-mono font-bold ${
                  isAuthenticated 
                    ? "bg-cyan-950/40 text-[var(--theme-accent)] border-cyan-800/30" 
                    : "bg-red-955/20 text-red-400 border-red-950/30"
                }`}>
                  {isAuthenticated ? "[ACTIVE_SESSION]" : "[LOCKED]"}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-0.5 font-mono">AUTHORIZED PERSONNEL INTERFACE V2.1</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 relative z-20">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 border border-red-955 bg-red-955/10 hover:bg-rose-955/20 text-red-400 hover:text-rose-300 rounded-none transition duration-200 text-xxs font-mono flex items-center space-x-1.5 cursor-pointer shrink-0 shadow-lg"
                title="Logout Session"
              >
                <span>LOGOUT</span>
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-1.5 border border-neutral-850 text-neutral-400 hover:text-white rounded-none hover:bg-neutral-800 transition duration-200 cursor-pointer shrink-0"
              title="Close Dashboard"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ==================== SCREEN PHASE 1: UN-AUTHENTICATED SYSTEM LOCK ==================== */}
        {!isAuthenticated && (
          <div className="flex-1 flex flex-col justify-center items-center py-10 relative z-10 w-full max-w-sm mx-auto font-mono">
            {handshakePhase === "idle" && (
              <div className="text-center space-y-6 w-full">
                <div className="h-12 w-12 rounded-none bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/25 text-[var(--theme-accent)] flex items-center justify-center mx-auto">
                  <Lock className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-white font-medium text-xs tracking-wider uppercase text-[var(--theme-accent)]">&gt;_ ACCESS_RESTRICTED</h2>
                  <p className="text-neutral-400 text-xxs leading-relaxed">
                    A secure cryptographic handshake is required to unlock the administration layer.
                  </p>
                </div>
                {loginError && (
                  <div className="p-3 border border-red-900/40 bg-red-950/25 text-red-400 text-xxs rounded-none text-center font-bold">
                    {loginError}
                  </div>
                )}
                <button
                  onClick={triggerHandshakeSequence}
                  className="w-full py-2.5 bg-[var(--theme-accent)] hover:bg-cyan-400 text-neutral-955 font-bold rounded-none transition duration-200 cursor-pointer flex items-center justify-center space-x-2 text-xs uppercase"
                >
                  <RefreshCw className="w-4 h-4 text-neutral-955 animate-spin-slow" />
                  <span>INIT_CRYPTOGRAPHIC_HANDSHAKE</span>
                </button>
              </div>
            )}

            {handshakePhase === "handshaking" && (
              <div className="w-full text-center space-y-4">
                <RefreshCw className="w-8 h-8 text-[var(--theme-accent)] animate-spin mx-auto animate-spin-slow" />
                <p className="text-xxs text-neutral-400 font-mono tracking-widest uppercase">
                  ESTABLISHING SECURE GATEWAY CONSOLE LINK...
                </p>
                <div className="h-1 w-full bg-neutral-800 rounded-none overflow-hidden">
                  <div className="h-full bg-[var(--theme-accent)]" style={{ width: "70%" }} />
                </div>
                <div className="text-left font-mono text-[9px] text-neutral-500 bg-black/40 p-2.5 border border-neutral-800 space-y-1 h-24 overflow-y-auto mt-2 select-none">
                  {handshakeLogs.map((log, idx) => (
                    <div key={idx} className="truncate text-[var(--theme-accent)]/80">&gt; {log}</div>
                  ))}
                </div>
              </div>
            )}

            {handshakePhase === "prompt" && (
              <div className="w-full space-y-5">
                <div className="text-center space-y-2">
                  <div className="h-12 w-12 rounded-none bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/25 text-[var(--theme-accent)] flex items-center justify-center mx-auto">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h2 className="text-white text-xs font-semibold uppercase tracking-wider text-[var(--theme-accent)]">&gt;_ PROMPT_PASSWORD</h2>
                  <p className="text-xxs text-neutral-400">PROVIDE DECK AUTHORIZATION CREDENTIALS</p>
                </div>
                
                <form onSubmit={handleLoginSubmit} className="space-y-4 w-full font-mono text-xs">
                  <div className="space-y-1.5 text-left">
                    <label className="text-xxs text-neutral-400 block uppercase tracking-wider">PASSWORD_INPUT</label>
                    <div className="relative">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full py-2.5 pl-10 pr-4 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none placeholder-neutral-800 transition duration-200"
                        disabled={loading}
                      />
                      <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    </div>
                  </div>

                  {loginError && (
                    <div className="p-3 border border-red-900/40 bg-red-950/25 text-red-400 text-xxs rounded-none text-left font-bold">
                      {loginError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[var(--theme-accent)] hover:bg-cyan-400 text-neutral-955 font-bold rounded-none transition duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-40 uppercase"
                    disabled={loading || !password}
                  >
                    {loading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-neutral-955" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-neutral-955" />
                    )}
                    <span>AUTHORIZE_NODE</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ==================== SCREEN PHASE 2: AUTHENTICATED HUDS & CONTROLS ==================== */}
        {isAuthenticated && (
          <div className="flex-1 flex flex-col md:flex-row relative z-10 min-h-0 md:h-full md:overflow-hidden font-mono text-xs w-full max-w-full">
            {/* Mobile Top Bar */}
            <div className="flex lg:hidden md:hidden items-center justify-between p-3.5 bg-neutral-950 border border-neutral-850 mb-4 select-none w-full shadow-lg">
              <button 
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-1.5 border border-neutral-805 hover:bg-neutral-900 text-[var(--theme-accent)] transition duration-150 cursor-pointer flex items-center space-x-1.5"
                title="Toggle Dashboard Sidebar Menu"
              >
                <Menu className="w-4 h-4" />
                <span className="font-mono text-xxs font-bold tracking-wider">MENU</span>
              </button>
              <div className="text-right">
                <span className="text-[10px] text-neutral-400 font-mono tracking-wider uppercase font-bold text-[var(--theme-accent)] block">
                  [{activeTab.toUpperCase()}_CONSOLE]
                </span>
                <span className="text-[8px] text-neutral-500 font-mono block uppercase">SECURE_DOCK_PORT_3K0</span>
              </div>
            </div>

            {/* Mobile Sidebar Overlay Backdrop */}
            {isMobileSidebarOpen && (
              <div 
                className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-[999] md:hidden transition-opacity duration-300 pointer-events-auto"
                onClick={() => setIsMobileSidebarOpen(false)}
              />
            )}

            {/* Sidebar Controls (Responsive Sliding Drawer on Mobile; Fixed Panel on Desktop) */}
            <div 
              className={`fixed md:relative top-0 bottom-0 left-0 w-64 md:w-52 bg-neutral-950 md:bg-transparent border-r border-neutral-850 md:border-r-0 md:border-r-0 pb-6 md:pb-0 pt-6 md:pt-0 px-5 md:px-0 md:pr-4 flex flex-col gap-2 shrink-0 select-none font-mono font-semibold z-[1000] md:z-auto transition-transform duration-300 md:translate-x-0 ${
                isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
              }`}
            >
              <div className="flex md:hidden justify-between items-center mb-6 border-b border-neutral-850 pb-3">
                <span className="text-[10px] text-neutral-400 font-bold tracking-wider uppercase font-mono text-[var(--theme-accent)]">&gt;_ NAVIGATION</span>
                <button 
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1 border border-neutral-850 text-neutral-450 hover:text-white transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="hidden md:block text-[10px] text-neutral-450 font-bold uppercase tracking-wider mb-2 px-1 text-[var(--theme-accent)]">NAVIGATION</span>
              
              <button
                onClick={() => { setActiveTab("credentials"); setEditingItemIndex(null); setIsAddingNew(false); setIsMobileSidebarOpen(false); }}
                className={`p-2.5 md:p-2 rounded-none border text-left cursor-pointer transition flex items-center space-x-2 font-mono ${
                  activeTab === "credentials"
                    ? "border-[var(--theme-accent)]/60 bg-neutral-900 text-white"
                    : "border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800/40"
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0 text-[var(--theme-accent)]" />
                <span className="font-semibold text-xs tracking-wider uppercase">Credentials Settings</span>
              </button>

              <button
                onClick={() => { setActiveTab("projects"); setEditingItemIndex(null); setIsAddingNew(false); setIsMobileSidebarOpen(false); }}
                className={`p-2.5 md:p-2 rounded-none border text-left cursor-pointer transition flex items-center space-x-2 font-mono ${
                  activeTab === "projects"
                    ? "border-[var(--theme-accent)]/60 bg-neutral-900 text-white"
                    : "border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800/40"
                }`}
              >
                <FolderGit2 className="w-4 h-4 shrink-0 text-[var(--theme-accent)]" />
                <span className="font-semibold text-xs tracking-wider uppercase">Projects</span>
              </button>

              <button
                onClick={() => { setActiveTab("certifications"); setEditingItemIndex(null); setIsAddingNew(false); setIsMobileSidebarOpen(false); }}
                className={`p-2.5 md:p-2 rounded-none border text-left cursor-pointer transition flex items-center space-x-2 font-mono ${
                  activeTab === "certifications"
                    ? "border-[var(--theme-accent)]/60 bg-neutral-900 text-white"
                    : "border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800/40"
                }`}
              >
                <Award className="w-4 h-4 shrink-0 text-[var(--theme-accent)]" />
                <span className="font-semibold text-xs tracking-wider uppercase">Certificates</span>
              </button>

              <button
                onClick={() => { setActiveTab("core"); setEditingItemIndex(null); setIsAddingNew(false); setIsMobileSidebarOpen(false); }}
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
                  className="w-full py-2.5 border border-red-950/40 bg-red-955/10 hover:bg-rose-955/20 text-red-400 font-bold rounded-none transition duration-200 text-xxs font-mono cursor-pointer uppercase tracking-wider"
                >
                  LOGOUT_SESSION
                </button>
              </div>
            </div>

            {/* Content Editor Frame Panel */}
            <div className="flex-1 flex flex-col justify-between min-h-0 md:h-full md:overflow-hidden font-mono max-w-full overflow-x-hidden">
              
              {/* Output alerts for states */}
              {(saveStatus || actionError) && (
                <div className="mb-4 space-y-1.5 font-mono">
                  {saveStatus && (
                    <div className="p-3 border border-[var(--theme-accent)]/20 bg-[var(--theme-accent)]/5 text-[var(--theme-accent)] rounded-none flex items-center space-x-2 font-medium text-xxs animate-pulse lowercase font-mono">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{saveStatus}</span>
                    </div>
                  )}
                  {actionError && (
                    <div className="p-3 border border-rose-500/20 bg-rose-500/5 text-rose-450 rounded-none font-medium text-xxs flex items-center space-x-2 lowercase font-mono">
                      <X className="w-4 h-4" />
                      <span>{actionError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Internal Sub-Tab Navigation Bar for Core Settings */}
              {activeTab === "core" && (
                <div id="core-subtab-switch" className="flex border-b border-neutral-800 pb-2 mb-4 space-x-1 select-none font-mono font-semibold text-[10px] overflow-x-auto w-full max-w-full">
                  <button
                    onClick={() => setCoreSubTab("biography")}
                    className={`px-3 py-1.5 border rounded-none transition uppercase tracking-wider font-mono cursor-pointer shrink-0 ${
                      coreSubTab === "biography"
                        ? "border-[var(--theme-accent)]/60 bg-neutral-900 text-white font-bold"
                        : "border-transparent text-neutral-450 hover:text-white"
                    }`}
                  >
                    Biography Narrative
                  </button>
                  <button
                    onClick={() => setCoreSubTab("skills")}
                    className={`px-3 py-1.5 border rounded-none transition uppercase tracking-wider font-mono cursor-pointer shrink-0 ${
                      coreSubTab === "skills"
                        ? "border-[var(--theme-accent)]/60 bg-neutral-900 text-white font-bold"
                        : "border-transparent text-neutral-450 hover:text-white"
                    }`}
                  >
                    Skills Matrix
                  </button>
                  <button
                    onClick={() => setCoreSubTab("experience")}
                    className={`px-3 py-1.5 border rounded-none transition uppercase tracking-wider font-mono cursor-pointer shrink-0 ${
                      coreSubTab === "experience"
                        ? "border-[var(--theme-accent)]/60 bg-neutral-900 text-white font-bold"
                        : "border-transparent text-neutral-450 hover:text-white"
                    }`}
                  >
                    Professional Experience
                  </button>
                </div>
              )}

              {/* ==================================================== */}
              {/* TAB MODULE: CREDENTIALS SETTINGS */}
              {/* ==================================================== */}
              {activeTab === "credentials" && (
                <div id="credentials-panel" className="flex-grow flex flex-col overflow-y-auto space-y-6">
                  <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-4 rounded-none select-none">
                    <div>
                      <h2 className="text-white font-mono font-semibold text-xs tracking-wider uppercase text-[var(--theme-accent)]">
                        &gt;_ CREDENTIALS_CONFIGURATION
                      </h2>
                      <p className="text-[11px] text-neutral-400 font-mono">
                        ADMINISTRATIVE IDENTITY KEYS & DATABASE INGESTION CORPS
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                    {/* Active Session Info Card */}
                    <div className="bg-neutral-950 p-5 border border-neutral-850 rounded-none space-y-4">
                      <h3 className="text-white uppercase tracking-wider font-bold text-xxs border-b border-neutral-800 pb-2">
                        // SECURE_IDENTITY_SESSION
                      </h3>
                      <div className="space-y-3 font-mono">
                        <div className="flex justify-between border-b border-neutral-900 pb-1.5">
                          <span className="text-neutral-450 uppercase text-[10px] tracking-wider">ADMINISTRATOR</span>
                          <span className="text-white text-[11px] font-semibold">{personalEmail || "arunamjaindps7@gmail.com"}</span>
                        </div>
                        <div className="flex justify-between border-b border-neutral-900 pb-1.5">
                          <span className="text-neutral-450 uppercase text-[10px] tracking-wider">ROLES</span>
                          <span className="text-[var(--theme-accent)] font-semibold uppercase text-[10px] tracking-wider">&gt;_ ROOT_SUPER_USER</span>
                        </div>
                        <div className="flex justify-between border-b border-neutral-900 pb-1.5">
                          <span className="text-neutral-450 uppercase text-[10px] tracking-wider">SECURE_GATEWAY</span>
                          <span className="text-emerald-400 font-semibold uppercase text-[10px] tracking-wider">● AUTHENTICATED</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-450 uppercase text-[10px] tracking-wider">AUTHENTICATOR_TYPE</span>
                          <span className="text-neutral-350 text-[10px] uppercase font-mono tracking-wider">CLIENT_SUPABASE_GATEWAY</span>
                        </div>
                      </div>
                    </div>

                    {/* Database Ingestion Seeds Control */}
                    <div className="bg-neutral-950 p-5 border border-neutral-850 rounded-none space-y-4 flex flex-col justify-between">
                      <div>
                        <h3 className="text-white uppercase tracking-wider font-bold text-xxs border-b border-neutral-800 pb-2">
                          // DATABASE_REGISTRY_SEEDS
                        </h3>
                        <p className="text-neutral-400 text-[11px] leading-relaxed mt-2.5 font-mono">
                          Re-seed the live relational database tables with initial dynamic projects, core experiences, and skills mappings. Note: This will overwrite or upsert base elements.
                        </p>
                      </div>
                      <div className="pt-4">
                        <button
                          onClick={handleSupabaseSeeding}
                          disabled={seedingLoading}
                          className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-[var(--theme-accent)]/30 text-[var(--theme-accent)] hover:text-cyan-400 font-bold rounded-none transition duration-200 text-xxs font-mono cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider shadow-lg"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${seedingLoading ? "animate-spin" : ""}`} />
                          <span>{seedingLoading ? "INITIALIZING_SEED_MIGRATION..." : "RUN_IDEMPOTENT_SEEDS"}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* System Telemetry Administration Logs */}
                  <div className="bg-neutral-950 p-5 border border-neutral-850 rounded-none space-y-3 font-mono">
                    <h3 className="text-white uppercase tracking-wider font-bold text-xxs border-b border-neutral-800 pb-2">
                      // CRYPTOGRAPHIC_SECURITY_TELEMETRY_LOGS
                    </h3>
                    <div className="bg-neutral-905 p-3.5 rounded-none border border-neutral-900 font-mono text-xxs text-neutral-400 space-y-1.5 max-h-48 overflow-y-auto">
                      <div className="flex space-x-2 text-emerald-400">
                        <span>[SESSION_INIT]</span>
                        <span>ADMINISTRATOR IDENTITY AUTHENTICATED SUCCESSFULLY VIA REMOTE_CLIENT_GATEWAY</span>
                      </div>
                      <div className="flex space-x-2 text-neutral-400">
                        <span>[TOKEN_SYNC]</span>
                        <span>CSRF CHANNELS OPENED; ESTABLISHED STABLE DIRECT RPC CONNECT TO SUPABASE REPOS</span>
                      </div>
                      <div className="flex space-x-2 text-neutral-500">
                        <span>[GATEWAY_OK]</span>
                        <span>MATRIX HUDS ACCURATELY DESERIALIZED FROM BOTH FALLBACK ENGINE AND LIVE REPOS</span>
                      </div>
                      <div className="flex space-x-2 text-emerald-400">
                        <span>[CONNECTION_OK]</span>
                        <span>SECURE HYDRATED SESSION ENGINE VERIFIED</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================================================== */}
              {/* TAB MODULE: PROJECTS */}
              {/* ==================================================== */}
              {activeTab === "projects" && (
                <div className="flex-grow flex flex-col overflow-y-auto">
                  {editingItemIndex === null && !isAddingNew ? (
                    // Display Projects listing view
                    <div className="space-y-4 font-mono">
                      <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-4 rounded-none">
                        <div>
                          <h2 className="text-white font-bold text-xs uppercase tracking-wider text-[var(--theme-accent)]">&gt;_ Projects Inventory</h2>
                          <p className="text-xxs text-neutral-400 select-none">RECORDED DEV NODES AND REPOSITORIES</p>
                        </div>
                        <button
                          onClick={startAddProject}
                          className="px-3.5 py-2 bg-[var(--theme-accent)] hover:bg-cyan-400 text-neutral-955 font-bold rounded-none transition duration-200 text-xxs flex items-center space-x-1.5 cursor-pointer uppercase tracking-wider"
                        >
                          <Plus className="w-4 h-4 text-neutral-955 shrink-0" />
                          <span>NEW_NODE</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
                        {portfolio.projects.map((proj, idx) => (
                          <div 
                            key={proj.id} 
                            className="bg-neutral-950 p-4 border border-neutral-800 rounded-none hover:border-[var(--theme-accent)]/40 transition duration-200 relative flex flex-col justify-between min-h-[160px]"
                          >
                            <div>
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="font-bold text-xs text-white uppercase tracking-wider">{proj.title}</span>
                                <span className="text-[9px] px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded-none text-neutral-400 font-mono">[ID: {proj.id}]</span>
                              </div>
                              <p className="text-xxs text-[var(--theme-accent)] font-semibold tracking-widest uppercase mb-3">{proj.subtitle}</p>
                              
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {proj.tech.map((t) => (
                                  <span key={t} className="text-[10px] bg-neutral-900 text-neutral-300 px-2 py-0.5 rounded-none border border-neutral-800/60 font-mono">{t}</span>
                                ))}
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 border-t border-neutral-850 pt-3 mt-3 select-none">
                              <button
                                onClick={() => startEditProject(idx)}
                                className="px-3 py-1.5 border border-neutral-800 bg-neutral-900 text-neutral-300 rounded-none hover:text-[var(--theme-accent)] hover:border-[var(--theme-accent)] transition duration-150 flex items-center space-x-1.5 cursor-pointer font-bold text-xxs uppercase tracking-wider"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
                                <span>EDIT</span>
                              </button>
                              <button
                                onClick={() => deleteProjectIndex(idx)}
                                className="px-3 py-1.5 border border-red-950 bg-red-950/10 hover:bg-rose-950/30 text-red-450 rounded-none hover:border-red-900 hover:text-rose-305 transition duration-150 flex items-center space-x-1.5 cursor-pointer font-bold text-xxs uppercase tracking-wider"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                <span>DELETE</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // Display Projects Form Editor
                    <div className="space-y-4 pb-6 font-mono">
                      <div className="flex justify-between items-center pb-3 border-b border-neutral-800 font-mono">
                        <span className="text-white font-bold text-xs flex items-center space-x-2 uppercase tracking-wider">
                          <Edit3 className="w-4 h-4 text-[var(--theme-accent)]" />
                          <span>{isAddingNew ? "INIT_NEW_PROJECT_NODE" : `EDIT_PROJECT_NODE: ${projId}`}</span>
                        </span>
                        <button
                          onClick={() => { setEditingItemIndex(null); setIsAddingNew(false); }}
                          className="px-2.5 py-1 text-xxs border border-neutral-850 rounded-none text-neutral-400 hover:text-white cursor-pointer hover:bg-neutral-800 transition uppercase tracking-wider"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">PROJECT_ID / SLUG_IDENTIFIER</label>
                          <input
                            type="text"
                            value={projId}
                            onChange={(e) => setProjId(e.target.value)}
                            className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono"
                            placeholder="e.g., bonito"
                            disabled={!isAddingNew}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">TITLE_LABEL</label>
                          <input
                            type="text"
                            value={projTitle}
                            onChange={(e) => setProjTitle(e.target.value)}
                            className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs"
                            placeholder="e.g., Bonito"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">SUBTITLE_LABEL</label>
                          <input
                            type="text"
                            value={projSubtitle}
                            onChange={(e) => setProjSubtitle(e.target.value)}
                            className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs"
                            placeholder="e.g., Sports Analytics Backend"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">TECH_STACK_CSV_ARRAY</label>
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
                          <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">KEY_HIGHLIGHTS_BULLETS</label>
                          <button
                            onClick={() => setProjHighlights([...projHighlights, ""])}
                            className="px-2.5 py-1 text-xxs border border-neutral-800 text-[var(--theme-accent)] hover:text-cyan-300 hover:bg-neutral-850 rounded-none transition uppercase tracking-wider font-bold"
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
                              onClick={() => {
                                const arr = projHighlights.filter((_, i) => i !== hlIdx);
                                setProjHighlights(arr.length ? arr : [""]);
                              }}
                              className="px-2.5 border border-red-950 bg-red-950/20 text-red-400 rounded-none hover:bg-rose-900 hover:text-white transition flex items-center justify-center p-2.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Stats metric dashboard */}
                      <div className="space-y-3 font-mono">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">QUANTITATIVE_METRICS_STAT (MAX 3)</label>
                          <button
                            onClick={() => {
                              if (projStats.length >= 3) return;
                              setProjStats([...projStats, { label: "", value: "" }]);
                            }}
                            className="px-2.5 py-1 text-xxs border border-neutral-800 text-[var(--theme-accent)] hover:text-cyan-300 hover:bg-neutral-850 rounded-none transition disabled:opacity-40 uppercase tracking-wider font-bold"
                            disabled={projStats.length >= 3}
                          >
                            + ADD_METRIC
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {projStats.map((st, sIdx) => (
                            <div key={sIdx} className="p-3 border border-neutral-800 rounded-none bg-neutral-950 space-y-2 relative">
                              <button
                                onClick={() => {
                                  setProjStats(projStats.filter((_, i) => i !== sIdx));
                                }}
                                className="absolute top-1.5 right-1.5 text-neutral-400 hover:text-white"
                              >
                                <X className="w-3" />
                              </button>
                              
                              <input
                                type="text"
                                value={st.label}
                                onChange={(e) => {
                                  const arr = [...projStats];
                                  arr[sIdx].label = e.target.value;
                                  setProjStats(arr);
                                }}
                                className="p-1.5 text-xxs bg-neutral-900 border border-neutral-850 outline-none text-white rounded-none w-full font-mono"
                                placeholder="Label (e.g., Accuracy)"
                              />
                              <input
                                type="text"
                                value={st.value}
                                onChange={(e) => {
                                  const arr = [...projStats];
                                  arr[sIdx].value = e.target.value;
                                  setProjStats(arr);
                                }}
                                className="p-1.5 text-xxs bg-neutral-900 border border-neutral-850 outline-none text-white rounded-none w-full font-bold font-mono text-[var(--theme-accent)]"
                                placeholder="Value (e.g., 99.4%)"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-neutral-800 flex justify-end gap-2 text-right">
                        <button
                          onClick={() => { setEditingItemIndex(null); setIsAddingNew(false); }}
                          className="px-4 py-2 bg-transparent text-neutral-400 hover:text-white rounded-none transition text-xxs font-bold uppercase tracking-wider"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveProjectForm}
                          disabled={loading}
                          className="px-5 py-2 bg-[var(--theme-accent)] hover:bg-cyan-400 text-neutral-955 font-bold rounded-none transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-40 text-xxs uppercase tracking-wider"
                        >
                          <Save className="w-4 h-4 text-neutral-955 shrink-0" />
                          <span>SAVE_CHANGES_NODE</span>
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
                <div className="flex-grow flex flex-col overflow-y-auto font-mono">
                  <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-4 rounded-none mb-4 select-none">
                    <div>
                      <h2 className="text-white font-bold text-xs uppercase tracking-wider text-[var(--theme-accent)]">&gt;_ Skills Inventory</h2>
                      <p className="text-xxs text-neutral-400 select-none">CONFIGURE SKILL TAGS AND RELATED CLUSTERS</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={addSkillCategoryGroup}
                        className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-850 border border-neutral-850 text-neutral-300 hover:text-white rounded-none transition duration-200 text-xxs flex items-center space-x-1 cursor-pointer uppercase tracking-wider font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>NEW_CATEGORY</span>
                      </button>
                      <button
                        onClick={saveSkillsSetup}
                        disabled={loading}
                        className="px-3 py-1.5 bg-[var(--theme-accent)] hover:bg-cyan-400 text-neutral-955 font-bold rounded-none transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-40 text-xxs uppercase tracking-wider"
                      >
                        <Save className="w-4 h-4 text-neutral-955 shrink-0" />
                        <span>SAVE_INVENTORY</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 pb-6">
                    {skillGroups.map((group, groupIdx) => {
                      return (
                        <div key={groupIdx} className="bg-neutral-950 p-4 border border-neutral-800 rounded-none space-y-3 relative">
                          <button
                            onClick={() => deleteSkillGroupIndex(groupIdx)}
                            className="absolute top-2.5 right-2 text-rose-400 hover:text-rose-350 p-1.5 border border-red-950 bg-rose-955/10 rounded-none cursor-pointer text-xxs font-bold"
                            title="Delete Whole Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <div className="space-y-1">
                            <span className="text-[10px] text-neutral-400 block font-bold uppercase tracking-wider">CATEGORY_HEADER_TAG</span>
                            <input
                              type="text"
                              value={group.category}
                              onChange={(e) => {
                                const cloned = [...skillGroups];
                                cloned[groupIdx].category = e.target.value;
                                setSkillGroups(cloned);
                              }}
                              className="text-white font-bold bg-transparent border-b border-dashed border-neutral-700 focus:border-[var(--theme-accent)] outline-none text-xs tracking-wider uppercase pb-0.5"
                            />
                          </div>

                          <div className="space-y-2">
                            <span className="text-[10px] text-neutral-400 block font-bold uppercase tracking-wider">ACTIVE_CHIPS_TAGS</span>
                            <div className="flex flex-wrap gap-1.5 p-2 bg-neutral-900 rounded-none min-h-12 border border-neutral-850">
                              {group.skills.length === 0 ? (
                                <span className="text-neutral-500 select-none p-1 text-xxs">NO CHIPS INITIALIZED. APPEND RECORD BELOW.</span>
                              ) : (
                                group.skills.map((skill: string, sIdx: number) => (
                                  <span 
                                    key={sIdx} 
                                    className="text-[10px] bg-cyan-950/35 text-[var(--theme-accent)] px-2.5 py-0.5 rounded-none border border-cyan-900/40 flex items-center space-x-1 select-none font-bold uppercase tracking-wide"
                                  >
                                    <span>{skill}</span>
                                    <button 
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

                          {/* Quick Add Form nested */}
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
                                className="px-3 py-1.5 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-xxs font-bold rounded-none uppercase tracking-wider"
                              >
                                + CHIP
                              </button>
                            </form>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ==================================================== */}
              {/* TAB MODULE: EXPERIENCE */}
              {/* ==================================================== */}
              {activeTab === "core" && coreSubTab === "experience" && (
                <div className="flex-grow flex flex-col overflow-y-auto font-mono">
                  {editingItemIndex === null && !isAddingNew ? (
                    // Display Experiences listing
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-4 rounded-none">
                        <div>
                          <h2 className="text-white font-bold text-xs uppercase tracking-wider text-[var(--theme-accent)]">&gt;_ Professional Experience</h2>
                          <p className="text-xxs text-neutral-400 select-none">RECORD OF PROFESSIONAL ROLES AND ENGAGEMENTS</p>
                        </div>
                        <button
                          onClick={startAddExperience}
                          className="px-3.5 py-2 bg-[var(--theme-accent)] hover:bg-cyan-400 text-neutral-955 font-bold rounded-none transition duration-200 text-xxs flex items-center space-x-1.5 cursor-pointer uppercase tracking-wider"
                        >
                          <Plus className="w-4 h-4 text-neutral-955 shrink-0" />
                          <span>NEW_ROLE</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 pb-6">
                        {portfolio.experience.map((exp, idx) => (
                          <div 
                            key={exp.id} 
                            className="bg-neutral-950 p-4 border border-neutral-800 rounded-none hover:border-[var(--theme-accent)]/40 transition duration-200 relative flex flex-col md:flex-row justify-between items-start gap-4 font-mono"
                          >
                            <div className="flex-grow space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-xs text-white uppercase tracking-wider">{exp.role}</span>
                                <span className="text-[var(--theme-accent)] font-bold text-xxs">@ {exp.company}</span>
                              </div>
                              <p className="text-xxs text-neutral-400">{exp.period} · {exp.location}</p>
                              
                              <p className="text-xxs text-neutral-300 max-w-2xl leading-relaxed pt-1.5 font-mono">
                                {exp.highlights[0] || "No achievements logged."}
                              </p>
                            </div>

                            <div className="flex self-end md:self-center gap-2 select-none shrink-0">
                              <button
                                onClick={() => startEditExperience(idx)}
                                className="px-3 py-1.5 border border-neutral-800 bg-neutral-900 text-neutral-300 rounded-none hover:text-[var(--theme-accent)] hover:border-[var(--theme-accent)] transition duration-155 flex items-center space-x-1.5 cursor-pointer text-xxs font-bold uppercase tracking-wider"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
                                <span>EDIT</span>
                              </button>
                              <button
                                onClick={() => deleteExperienceIndex(idx)}
                                className="px-3 py-1.5 border border-red-955 bg-red-955/10 hover:bg-rose-955/35 text-red-400 rounded-none hover:border-red-900 hover:text-rose-300 transition duration-155 flex items-center space-x-1.5 cursor-pointer text-xxs font-bold uppercase tracking-wider"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                <span>DELETE</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // Display Experience Editor form
                    <div className="space-y-4 pb-6 font-mono text-xs">
                      <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
                        <span className="text-white font-bold text-xs flex items-center space-x-2 uppercase tracking-wider text-[var(--theme-accent)]">
                          <Edit3 className="w-4 h-4 text-[var(--theme-accent)]" />
                          <span>{isAddingNew ? "INGEST_NEW_POSITION" : `EDIT_POSITION_NODE: ${expId}`}</span>
                        </span>
                        <button
                          onClick={() => { setEditingItemIndex(null); setIsAddingNew(false); }}
                          className="px-2.5 py-1 text-xxs border border-neutral-850 rounded-none text-neutral-400 hover:text-white cursor-pointer hover:bg-neutral-800 transition uppercase tracking-wider"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">TOKEN_NODE_ID</label>
                          <input
                            type="text"
                            value={expId}
                            onChange={(e) => setExpId(e.target.value)}
                            className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono"
                            placeholder="e.g., lead-engineer"
                            disabled={!isAddingNew}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">ROLE_TITLE</label>
                          <input
                            type="text"
                            value={expRole}
                            onChange={(e) => setExpRole(e.target.value)}
                            className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono"
                            placeholder="e.g., Senior Data Engineer"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">ORGANIZATION_NAME</label>
                          <input
                            type="text"
                            value={expCompany}
                            onChange={(e) => setExpCompany(e.target.value)}
                            className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono"
                            placeholder="e.g., Code Conquerors"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">DURATION_PERIOD</label>
                          <input
                            type="text"
                            value={expPeriod}
                            onChange={(e) => setExpPeriod(e.target.value)}
                            className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono"
                            placeholder="e.g., Jun 2025 - Present"
                          />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">LOCATION_GEOLOCATION</label>
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
                          <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">ACHIEVEMENTS_BULLETS</label>
                          <button
                            onClick={() => setExpHighlights([...expHighlights, ""])}
                            className="px-2.5 py-1 text-xxs border border-neutral-800 text-[var(--theme-accent)] hover:text-cyan-300 hover:bg-neutral-850 rounded-none transition uppercase tracking-wider font-bold"
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
                              placeholder="Describe quantitative metrics (e.g., Improved performance of 150+ students by 40%)..."
                            />
                            <button
                              onClick={() => {
                                const arr = expHighlights.filter((_, i) => i !== hlIdx);
                                setExpHighlights(arr.length ? arr : [""]);
                              }}
                              className="px-2.5 border border-red-950 bg-red-955/20 text-red-400 rounded-none hover:bg-rose-900 hover:text-white transition flex items-center justify-center p-2.5 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-neutral-850 flex justify-end gap-2 text-right">
                        <button
                          onClick={() => { setEditingItemIndex(null); setIsAddingNew(false); }}
                          className="px-4 py-2 bg-transparent text-neutral-400 hover:text-white rounded-none transition text-xxs font-bold uppercase tracking-wider"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveExperienceForm}
                          disabled={loading}
                          className="px-5 py-2 bg-[var(--theme-accent)] hover:bg-cyan-400 text-neutral-955 font-bold rounded-none transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-40 text-xxs uppercase tracking-wider"
                        >
                          <Save className="w-4 h-4 text-neutral-955 shrink-0" />
                          <span>COMMIT_ROLE</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ==================================================== */}
              {/* TAB MODULE: COMMUNICATIONS */}
              {/* ==================================================== */}
              {activeTab === "core" && coreSubTab === "biography" && (
                <div className="flex-grow flex flex-col overflow-y-auto font-mono">
                  <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-4 rounded-none mb-4 select-none">
                    <div>
                      <h2 className="text-white font-bold text-xs uppercase tracking-wider text-[var(--theme-accent)]">&gt;_ Bio Narrative & Links</h2>
                      <p className="text-xxs text-neutral-400 select-none">CONFIGURE BIOGRAPHY DETAILS AND SOCIAL PLATFORMS</p>
                    </div>
                    <button
                      onClick={saveCommunicationsData}
                      disabled={loading}
                      className="px-3.5 py-2 bg-[var(--theme-accent)] hover:bg-cyan-400 text-neutral-955 font-bold rounded-none transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-40 text-xxs uppercase tracking-wider"
                    >
                      <Save className="w-4 h-4 text-neutral-955 shrink-0" />
                      <span>COMMIT_DETAILS</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 font-mono text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">FULL_NAME_LABEL</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <input
                          type="text"
                          value={personalName}
                          onChange={(e) => setPersonalName(e.target.value)}
                          className="p-2.5 pl-10 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono"
                          placeholder="Arunam Jain"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 pt-2 border-b border-neutral-850 pb-1">
                      <span className="text-[10px] text-[var(--theme-accent)] font-bold uppercase tracking-wider block">Headline Details</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">PRIMARY_TITLE</label>
                      <input
                        type="text"
                        value={personalTitle}
                        onChange={(e) => setPersonalTitle(e.target.value)}
                        className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono"
                        placeholder="Data Science Coordinator & Technical Lead"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">SUBTITLE / KEYWORDS</label>
                      <input
                        type="text"
                        value={personalSubtitle}
                        onChange={(e) => setPersonalSubtitle(e.target.value)}
                        className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono"
                        placeholder="Python Developer & Full-Stack Analyst"
                      />
                    </div>

                    <div className="md:col-span-2 pt-2 border-b border-neutral-850 pb-1">
                      <span className="text-[10px] text-[var(--theme-accent)] font-bold uppercase tracking-wider block">CONTACT & LINKS</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">EMAIL_ADDRESS_MX</label>
                      <input
                        type="email"
                        value={personalEmail}
                        onChange={(e) => setPersonalEmail(e.target.value)}
                        className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono"
                        placeholder="arunamjaindps7@gmail.com"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">LOCATION_GEOLOCATION</label>
                      <input
                        type="text"
                        value={personalLocation}
                        onChange={(e) => setPersonalLocation(e.target.value)}
                        className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono"
                        placeholder="Guna, MP, India"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">GITHUB_PROFILE_URI</label>
                      <input
                        type="text"
                        value={personalGithub}
                        onChange={(e) => setPersonalGithub(e.target.value)}
                        className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono"
                        placeholder="https://github.com/ArunamJain"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">LINKEDIN_PROFILE_URI</label>
                      <input
                        type="text"
                        value={personalLinkedin}
                        onChange={(e) => setPersonalLinkedin(e.target.value)}
                        className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono"
                        placeholder="https://linkedin.com/in/arunam-jain"
                      />
                    </div>

                    <div className="md:col-span-2 pt-2 border-b border-neutral-850 pb-1">
                      <span className="text-[10px] text-[var(--theme-accent)] font-bold uppercase tracking-wider block">BIO_NARRATIVE_LOG</span>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">BIOGRAPHY_SUMMARY</label>
                      <textarea
                        value={personalBio}
                        onChange={(e) => setPersonalBio(e.target.value)}
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
                <div className="flex-grow flex flex-col overflow-y-auto">
                  {editingItemIndex === null && !isAddingNew ? (
                    // Display certifications directory
                    <div className="space-y-4 flex-grow flex flex-col">
                      <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-4 rounded-none select-none">
                        <div>
                          <h2 className="text-white font-mono font-semibold text-xs tracking-wider uppercase text-[var(--theme-accent)]">&gt;_ CERTIFICATION_REGISTRY</h2>
                          <p className="text-[11px] text-neutral-400 font-mono">Manage validated certifications and credentials</p>
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
                        {portfolio.certifications && portfolio.certifications.length > 0 ? (
                          portfolio.certifications.map((cert, idx) => (
                            <div 
                              key={idx} 
                              className="bg-neutral-950 p-4 border border-neutral-850 rounded-none hover:border-[var(--theme-accent)]/40 transition duration-200 relative flex flex-col md:flex-row justify-between items-start gap-4 font-mono"
                            >
                              <div className="flex-grow space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold text-xs text-white uppercase tracking-wide">&gt; {cert.name}</span>
                                  <span className="text-[var(--theme-accent)] font-semibold text-xxs">[{cert.issuer}]</span>
                                </div>
                                <p className="text-[10px] text-neutral-400">ISSUED: {cert.date}</p>
                              </div>

                              <div className="flex self-end md:self-center gap-2 select-none shrink-0">
                                <button
                                  onClick={() => startEditCertification(idx)}
                                  className="px-3 py-1.5 border border-neutral-800 bg-neutral-900 text-neutral-300 rounded-none hover:text-white hover:border-[var(--theme-accent)] transition duration-150 flex items-center space-x-1.5 cursor-pointer text-xs font-semibold"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>EDIT</span>
                                </button>
                                <button
                                  onClick={() => deleteCertificationIndex(idx)}
                                  className="px-3 py-1.5 border border-red-955 bg-red-955/10 hover:bg-rose-955/30 text-red-400 rounded-none hover:border-red-900 hover:text-rose-300 transition duration-150 flex items-center space-x-1.5 cursor-pointer text-xs font-semibold"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>DELETE</span>
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12 border border-dashed border-neutral-800 font-mono text-neutral-500 text-xs rounded-none">
                            NO CERTIFICATIONS INDEXED. CLICK 'ADD_CREDENTIAL' TO INGEST DATA.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Display Certification Editor form
                    <div className="space-y-4 pb-6 font-mono text-xs">
                      <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
                        <span className="text-white font-semibold text-xs flex items-center space-x-2 text-[var(--theme-accent)] uppercase">
                          {isAddingNew ? (
                            <Award className="w-4 h-4 text-[var(--theme-accent)]" />
                          ) : (
                            <Edit3 className="w-4 h-4 text-[var(--theme-accent)]" />
                          )}
                          <span>{isAddingNew ? "Add New Certificate" : "UPDATE_CREDENTIAL_NODE"}</span>
                        </span>
                        <button
                          onClick={() => { setEditingItemIndex(null); setIsAddingNew(false); }}
                          className="px-2.5 py-1 text-xs border border-neutral-800 rounded-none text-neutral-400 hover:text-white cursor-pointer hover:bg-neutral-800/40 transition"
                        >
                          CANCEL
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 col-span-2">
                          <label className="text-[10px] text-neutral-400 font-medium block uppercase tracking-wider text-[var(--theme-accent)]">
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
                          <label className="text-[10px] text-neutral-400 font-medium block uppercase tracking-wider text-[var(--theme-accent)]">
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
                          <label className="text-[10px] text-neutral-400 font-medium block uppercase tracking-wider text-[var(--theme-accent)]">
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

                        {/* Extra input field for Credential URL */}
                        <div className="space-y-1.5 col-span-2">
                          <label className="text-[10px] text-neutral-400 font-medium block uppercase tracking-wider text-[var(--theme-accent)]">Credential URL</label>
                          <input
                            type="text"
                            value={certUrl}
                            onChange={(e) => setCertUrl(e.target.value)}
                            className="p-2.5 bg-neutral-950 border border-neutral-800 focus:border-[var(--theme-accent)] outline-none text-white rounded-none w-full text-xs font-mono"
                            placeholder="e.g., https://proof.freecodecamp.org/..."
                          />
                          <p className="text-[9px] text-neutral-500 font-mono tracking-tight leading-normal">
                            A text field to paste the direct URL link to the certificate proof or uploaded PDF file
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-neutral-850 flex justify-end gap-2 text-right">
                        <button
                          onClick={() => { setEditingItemIndex(null); setIsAddingNew(false); }}
                          className="px-4 py-2 bg-transparent text-neutral-400 hover:text-white rounded-none transition text-xs font-semibold font-mono"
                        >
                          CANCEL
                        </button>
                        <button
                          onClick={saveCertificationForm}
                          disabled={loading}
                          className="px-5 py-2 bg-[var(--theme-accent)] hover:bg-cyan-400 text-neutral-950 font-semibold rounded-none transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-40 text-xs font-mono"
                        >
                          <Save className="w-4 h-4 text-neutral-950 shrink-0" />
                          <span>{isAddingNew ? "Save Certificate" : "COMMIT_CREDENTIAL"}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
