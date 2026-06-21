import { useState } from "react";
import { ExperienceItem } from "../data/portfolioData";
import { usePortfolio } from "../context/PortfolioContext";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Briefcase, ChevronRight, Terminal, Globe } from "lucide-react";

export default function ExperiencePane() {
  const { portfolio: portfolioData } = usePortfolio();
  const [activeId, setActiveId] = useState<string | null>(portfolioData.experience[0]?.id || null);

  return (
    <div className="space-y-4 font-mono select-none">
      <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2">
        <span className="text-[10px] text-white/40 uppercase tracking-widest block font-bold">
          CHRONOLOGY_LOGS_METRIC
        </span>
        <span className="text-[10px] text-[var(--theme-accent)] font-mono tracking-tight font-black">ACTIVE_OPERATIONS_LOGS</span>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Experience Selector Tabs (Vertical on Tablet/Desktop) */}
        <div className="w-full md:w-1/3 flex md:flex-col gap-2">
          {portfolioData.experience.map((exp: ExperienceItem) => {
            const isActive = activeId === exp.id;
            return (
              <button
                key={exp.id}
                onClick={() => setActiveId(exp.id)}
                className={`p-3 text-left border rounded-none transition-all duration-300 text-xs flex flex-col justify-between align-top h-auto cursor-pointer flex-1 md:flex-initial relative ${
                  isActive
                    ? "border-white/35 bg-white/[0.04] shadow-[0_0_12px_rgba(255,255,255,0.03)]"
                    : "border-white/5 bg-white/[0.01] hover:border-white/15 text-white/60"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--theme-accent)]" />
                )}
                
                <div className="flex items-center space-x-1 mb-1">
                  <Briefcase className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-white/40"}`} />
                  <span className={`font-bold text-[10px] uppercase truncate ${isActive ? "text-white" : "text-white/50"}`}>
                    {exp.company}
                  </span>
                </div>
                
                <span className="text-[9px] text-white/40 truncate">{exp.role}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Experience Logging Block */}
        <div className="flex-grow w-full bg-white/[0.015] border border-white/5 rounded-none p-4 relative min-h-[220px] border-r-4 border-r-[var(--theme-accent)]">
          <AnimatePresence mode="wait">
            {portfolioData.experience.map(
              (exp: ExperienceItem) =>
                activeId === exp.id && (
                  <motion.div
                    key={exp.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Log Title Details */}
                    <div className="border-b border-white/5 pb-2 flex flex-col md:flex-row md:items-center justify-between gap-1.5">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center space-x-1">
                          <span>{exp.role.toUpperCase()}</span>
                          <span className="text-[10px] text-[var(--theme-accent)] font-semibold">@{exp.company.toUpperCase()}</span>
                        </h3>
                        <div className="flex flex-wrap gap-x-3 text-[9px] text-white/40 mt-1 select-none">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-2.5 h-2.5 text-white/45" />
                            <span>{exp.period}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Globe className="w-2.5 h-2.5 text-[var(--theme-accent)]" />
                            <span>{exp.location}</span>
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-1.5 self-start md:self-auto select-none">
                        <span className="px-1.5 py-0.5 bg-white/5 text-white/80 border border-white/10 rounded-none text-[8px] font-mono font-bold uppercase">
                          ACTIVE_PIPE
                        </span>
                        <span className="px-1.5 py-0.5 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 rounded-none text-[8px] font-mono font-bold uppercase">
                          SECTOR_01
                        </span>
                      </div>
                    </div>

                    {/* Chronicles Bullet Log streams */}
                    <div className="space-y-3">
                      {exp.highlights.map((bullet, idx) => (
                        <div key={idx} className="flex items-start space-x-2 text-[11px] leading-relaxed text-white/80">
                          <ChevronRight className="w-4 h-4 text-[var(--theme-accent)] shrink-0 mt-0.5" />
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>

                    {/* Floating decoration/Telemetry parameters */}
                    <div className="border-t border-white/5 pt-3 mt-4 flex items-center justify-between text-[8px] text-white/30 select-none font-mono">
                      <div className="flex items-center space-x-1">
                        <Terminal className="w-2.5 h-2.5 text-white/40" />
                        <span>PIPELINE_INIT_SUCCESSFUL</span>
                      </div>
                      <span>ENCRYPT_STAMP: CF-{exp.id.slice(0, 4).toUpperCase()}-92A</span>
                    </div>
                  </motion.div>
                )
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
