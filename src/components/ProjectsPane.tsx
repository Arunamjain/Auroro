import { useState, useEffect, useRef } from "react";
import { ProjectItem } from "../data/portfolioData";
import { usePortfolio } from "../context/PortfolioContext";
import { motion, AnimatePresence } from "motion/react";
import { FolderGit2, Cpu, HardDrive, CheckCircle2, RefreshCw } from "lucide-react";

export default function ProjectsPane() {
  const { portfolio: portfolioData } = usePortfolio();
  const [activeProject, setActiveProject] = useState<string>(portfolioData.projects[0]?.id || "");
  const [runningSim, setRunningSim] = useState<string | null>(null);
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const timeoutsRef = useRef<any[]>([]);

  useEffect(() => {
    return () => {
      // Clear all active timers on tab toggle or unmount
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  const startSimulation = (projId: string) => {
    // Clear any active simulations running previously
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    setRunningSim(projId);
    setSimLogs(["INITIALIZING VIRTUAL CONTAINER ENGINE...", "LOCATING COMPILING TARGETS..."]);

    const steps = [
      "DOWNLOADING DATA STREAMS...",
      "EXECUTING ETL DATA CLEANING WORKER...",
      "OPTIMIZING VECTOR MATRICES...",
      "CALCULATING STATISTICAL GRADIENTS...",
      "VALIDATING NEURAL ACCURACY INDEX...",
      "PROCESS ENDS: MODEL STABILIZED."
    ];

    steps.forEach((step, idx) => {
      const t1 = setTimeout(() => {
        setSimLogs((prev) => [...prev, `[+] ${step}`]);
        if (idx === steps.length - 1) {
          const t2 = setTimeout(() => setRunningSim(null), 1000);
          timeoutsRef.current.push(t2);
        }
      }, (idx + 1) * 350);
      timeoutsRef.current.push(t1);
    });
  };

  const getMetricIcon = (label: string) => {
    if (label.toLowerCase().includes("accuracy")) return <Cpu className="w-3.5 h-3.5 text-white/80" />;
    if (label.toLowerCase().includes("integrity") || label.toLowerCase().includes("limit")) return <CheckCircle2 className="w-3.5 h-3.5 text-[var(--theme-accent)]" />;
    return <HardDrive className="w-3.5 h-3.5 text-white/50" />;
  };

  return (
    <div className="space-y-4 font-mono select-none">
      <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2">
        <span className="text-[10px] text-white/40 uppercase tracking-widest block font-bold">
          ANALYTIC_ENGINES_PROJECTS
        </span>
        <span className="text-[10px] text-[var(--theme-accent)] font-mono tracking-tight font-black">DATA SYSTEMS</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Project Selector Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-2">
          {portfolioData.projects.map((proj: ProjectItem) => {
            const isActive = activeProject === proj.id;
            return (
              <button
                key={proj.id}
                onClick={() => setActiveProject(proj.id)}
                className={`p-3 text-left border rounded-none transition-all duration-300 text-xs flex flex-col justify-between align-top cursor-pointer relative h-20 ${
                  isActive
                    ? "border-white/35 bg-white/[0.04] shadow-[0_0_12px_rgba(255,255,255,0.03)]"
                    : "border-white/5 bg-white/[0.01] hover:border-white/15 text-white/60"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-cyan-400 to-[var(--theme-accent)]" />
                )}
                
                <div className="flex items-center space-x-1.5 mb-1 text-[11px]">
                  <FolderGit2 className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-white/40"}`} />
                  <span className={`font-bold truncate ${isActive ? "text-white" : "text-white/50"}`}>
                    {proj.title}
                  </span>
                </div>
                
                <span className="text-[8px] text-white/40 truncate uppercase">{proj.subtitle}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Project Dynamic Frame */}
        <div className="lg:col-span-8 flex flex-col bg-white/[0.015] border border-white/5 rounded-none overflow-hidden relative min-h-[300px]">
          {/* Active Overlay Simulator (Triggered via BOOT) */}
          <AnimatePresence>
            {runningSim && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[var(--theme-bg)] z-20 p-4 border border-white/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] pb-1.5 border-b border-white/10 mb-3">
                    <span className="text-white font-bold flex items-center space-x-1">
                      <RefreshCw className="w-3 h-3 text-white animate-spin" />
                      <span>STREAM_SIMULATOR://{runningSim.toUpperCase()}</span>
                    </span>
                    <span className="text-[var(--theme-accent)] text-[9px] font-bold">ENGINE COMPILING...</span>
                  </div>
                  
                  <div className="space-y-1.5 text-[10px] text-[var(--theme-accent)] leading-relaxed font-mono">
                    {simLogs.map((log, idx) => (
                      <div key={idx}>{log}</div>
                    ))}
                  </div>
                </div>

                <div className="text-[8px] text-white/30 text-right mt-1.5">
                  CONTAINER_ID: VM-SPATIAL-{runningSim.toUpperCase()}-X02
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Project Details Content Renderer */}
          <div className="p-4 flex-1 flex flex-col justify-between h-full">
            {portfolioData.projects.map(
              (proj: ProjectItem) =>
                activeProject === proj.id && (
                  <motion.div
                    key={proj.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 flex flex-col justify-between h-full flex-1"
                  >
                    <div>
                      {/* Stats Metric Panel Grid */}
                      {proj.stats && (
                        <div className="grid grid-cols-3 gap-2 mb-4 select-none">
                          {proj.stats.map((stat) => (
                            <div key={stat.label} className="p-2 border border-white/5 bg-[var(--theme-bg)] rounded-none flex flex-col items-start gap-1 justify-between h-14">
                              <span className="text-[8px] text-white/40 font-bold uppercase tracking-wide">{stat.label}</span>
                              <div className="flex items-center gap-1">
                                {getMetricIcon(stat.label)}
                                <span className="text-[11px] text-white font-bold font-mono">{stat.value}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Content Chronicles */}
                      <div className="space-y-2 mb-4">
                        <h3 className="text-sm font-bold text-white uppercase select-all tracking-wider">
                          {proj.title} // <span className="text-[10px] text-[var(--theme-accent)] font-semibold">{proj.subtitle}</span>
                        </h3>
                        
                        <div className="space-y-2 pt-2 border-t border-white/5">
                          {proj.highlights.map((hl, i) => (
                            <p key={i} className="text-[11px] leading-relaxed text-white/80 flex items-start space-x-1.5">
                              <span className="text-[var(--theme-accent)] font-extrabold text-[12px] shrink-0 mt-0.5">▪</span>
                              <span>{hl}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom control row */}
                    <div className="space-y-3 mt-auto pt-3 border-t border-white/5">
                      {/* Technologies Chips */}
                      <div className="flex flex-wrap gap-1">
                        {proj.tech.map((t) => (
                          <span
                            key={t}
                            className="text-[9px] px-1.5 py-0.5 border border-white/5 bg-[var(--theme-bg)] text-white/60 rounded-none uppercase font-medium"
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Compilation Triggers */}
                      <div className="flex justify-between items-center select-none pt-1">
                        <span className="text-[8px] text-white/30 font-mono">REPOSITORY://LOCAL_BRANCH</span>
                        <button
                          onClick={() => startSimulation(proj.id)}
                          className="px-3 py-1.5 bg-[var(--theme-accent)] text-white hover:bg-[var(--theme-border-hover)] text-[10px] font-bold rounded-none cursor-pointer transition-all uppercase tracking-wider flex items-center space-x-1 shadow-lg border border-[var(--theme-accent)]"
                        >
                          <Cpu className="w-3 h-3 text-white shrink-0" />
                          <span>BOOT PIPELINE</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
