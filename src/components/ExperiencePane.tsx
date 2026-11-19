import { useState, useEffect } from "react";
import { ExperienceItem } from "../data/portfolioData";
import { usePortfolio } from "../context/PortfolioContext";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Briefcase, ChevronRight, Terminal, Globe } from "lucide-react";

export default function ExperiencePane() {
  const { portfolio: portfolioData } = usePortfolio();
  const [activeId, setActiveId] = useState<string | null>(portfolioData.experience[0]?.id || null);

  useEffect(() => {
    if (portfolioData.experience.length === 0) {
      setActiveId(null);
    } else if (!portfolioData.experience.some((exp) => exp.id === activeId)) {
      setActiveId(portfolioData.experience[0].id);
    }
  }, [portfolioData.experience, activeId]);

  return (
    <div className="space-y-4 font-mono select-none">
      <div className="flex justify-between items-center border-b border-[var(--theme-divider)] pb-2 mb-2">
        <span className="text-[10px] text-[var(--theme-text-dim)] uppercase tracking-widest block font-bold">
          CHRONOLOGY_LOGS_METRIC
        </span>
        <span className="text-[10px] text-[var(--theme-accent)] font-mono tracking-tight font-black">ACTIVE_OPERATIONS_LOGS</span>
      </div>

      {portfolioData.experience.length === 0 ? (
        <div className="p-8 border border-dashed border-[var(--theme-divider)] bg-[var(--theme-surface)] rounded-none text-center text-xs text-[var(--theme-text-dim)] font-mono uppercase tracking-wider">
          NO_EXPERIENCE_LOGS_INDEXED // RUN &apos;sudo access --admin&apos; TO PUBLISH DATA.JSON
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-4">
          {/* Experience Selector Tabs */}
          <div className="w-full md:w-1/3 flex md:flex-col gap-2">
            {portfolioData.experience.map((exp: ExperienceItem) => {
              const isActive = activeId === exp.id;
              return (
                <button
                  key={exp.id}
                  onClick={() => setActiveId(exp.id)}
                  className={`p-3 text-left border rounded-none transition-all duration-300 text-xs flex flex-col justify-between align-top h-auto cursor-pointer flex-1 md:flex-initial relative ${
                    isActive
                      ? "border-[var(--theme-divider-strong)] bg-[var(--theme-surface-hover)] shadow-[0_0_12px_rgba(6,182,212,0.06)]"
                      : "border-[var(--theme-divider)] bg-[var(--theme-surface-subtle)] hover:border-[var(--theme-border-hover)] text-[var(--theme-text-secondary)]"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--theme-accent)]" />
                  )}

                  <div className="flex items-center space-x-1 mb-1">
                    <Briefcase className={`w-3.5 h-3.5 ${isActive ? "text-[var(--theme-accent)]" : "text-[var(--theme-text-dim)]"}`} />
                    <span className={`font-bold text-[10px] uppercase truncate ${isActive ? "text-[var(--theme-text-strong)]" : "text-[var(--theme-text-secondary)]"}`}>
                      {exp.company}
                    </span>
                  </div>

                  <span className="text-[9px] text-[var(--theme-text-dim)] truncate">{exp.role}</span>
                </button>
              );
            })}
          </div>

          {/* Selected Experience Logging Block */}
          <div className="flex-grow w-full bg-[var(--theme-surface)] border border-[var(--theme-divider)] rounded-none p-4 relative min-h-[220px] border-r-4 border-r-[var(--theme-accent)]">
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
                      <div className="border-b border-[var(--theme-divider)] pb-2 flex flex-col md:flex-row md:items-center justify-between gap-1.5">
                        <div>
                          <h3 className="text-sm font-bold text-[var(--theme-text-strong)] flex flex-wrap items-center gap-x-1.5">
                            <span>{exp.role.toUpperCase()}</span>
                            <span className="text-[10px] text-[var(--theme-accent)] font-semibold">@{exp.company.toUpperCase()}</span>
                          </h3>
                          <div className="flex flex-wrap gap-x-3 text-[9px] text-[var(--theme-text-dim)] mt-1 select-none">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-2.5 h-2.5 text-[var(--theme-text-dim)]" />
                              <span>{exp.period}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Globe className="w-2.5 h-2.5 text-[var(--theme-accent)]" />
                              <span>{exp.location}</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex space-x-1.5 self-start md:self-auto select-none">
                          <span className="px-1.5 py-0.5 bg-[var(--theme-surface-subtle)] text-[var(--theme-text-body)] border border-[var(--theme-divider)] rounded-none text-[8px] font-mono font-bold uppercase">
                            ACTIVE_PIPE
                          </span>
                          <span className="px-1.5 py-0.5 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/25 rounded-none text-[8px] font-mono font-bold uppercase">
                            SECTOR_01
                          </span>
                        </div>
                      </div>

                      {/* Chronicles Bullet Log streams */}
                      <div className="space-y-3">
                        {exp.highlights.map((bullet, idx) => (
                          <div key={idx} className="flex items-start space-x-2 text-[11px] leading-relaxed text-[var(--theme-text-body)]">
                            <ChevronRight className="w-4 h-4 text-[var(--theme-accent)] shrink-0 mt-0.5" />
                            <span>{bullet}</span>
                          </div>
                        ))}
                      </div>

                      {/* Telemetry footer */}
                      <div className="border-t border-[var(--theme-divider)] pt-3 mt-4 flex items-center justify-between text-[8px] text-[var(--theme-text-faint)] select-none font-mono">
                        <div className="flex items-center space-x-1">
                          <Terminal className="w-2.5 h-2.5 text-[var(--theme-text-dim)]" />
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
      )}
    </div>
  );
}
