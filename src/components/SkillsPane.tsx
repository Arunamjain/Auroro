import { useState } from "react";
import { SkillGroup } from "../data/portfolioData";
import { usePortfolio } from "../context/PortfolioContext";
import { motion } from "motion/react";
import { Hexagon, Laptop, Layers, ShieldCheck, Database, LayoutGrid } from "lucide-react";

export default function SkillsPane() {
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  const { portfolio: portfolioData } = usePortfolio();

  // Simple icon selector based on category type
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "languages":
        return <Laptop className="w-4 h-4 text-white/70" />;
      case "libraries & frameworks":
        return <Layers className="w-4 h-4 text-white/50" />;
      case "bi & visualization tools":
        return <LayoutGrid className="w-4 h-4 text-white/60" />;
      case "databases & tools":
        return <Database className="w-4 h-4 text-[var(--theme-accent)]" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-white/45" />;
    }
  };

  // Helper rating simulator to draw cyber progress lines (visuals only for futuristic layout)
  const getSimulatedRating = (skill: string) => {
    const caps = skill.toLowerCase();
    if (caps.includes("python") || caps.includes("pandas") || caps.includes("data analysis") || caps.includes("visualization")) return 95;
    if (caps.includes("sql") || caps.includes("numpy") || caps.includes("scikit") || caps.includes("fastapi")) return 90;
    if (caps.includes("c++") || caps.includes("postgresql") || caps.includes("etl")) return 85;
    if (caps.includes("java") || caps.includes("tableau") || caps.includes("power bi")) return 80;
    return 85;
  };

  return (
    <div className="space-y-4 font-mono select-none">
      <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2">
        <span className="text-[10px] text-white/40 uppercase tracking-widest block font-bold">
          SKILLS_MATRIX_INDEX
        </span>
        <span className="text-[10px] text-[var(--theme-accent)] font-mono tracking-tight font-black">TACTICAL SKILLS DECK</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {portfolioData.skills.map((group: SkillGroup, groupIdx: number) => (
          <motion.div
            key={group.category}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: groupIdx * 0.08 }}
            className="p-3 border border-white/5 bg-white/[0.015] rounded-none flex flex-col justify-between"
          >
            {/* Category Header */}
            <div className="flex items-center space-x-2 border-b border-white/5 pb-1.5 mb-2.5">
              {getCategoryIcon(group.category)}
              <span className="text-[10px] text-white font-bold uppercase tracking-wide">
                {group.category}
              </span>
            </div>

            {/* Subgrid of individual tiles */}
            <div className="grid grid-cols-2 gap-2">
              {group.skills.map((skill) => {
                const rating = getSimulatedRating(skill);
                const isHovered = hoveredSkill === skill;

                return (
                  <div
                    key={skill}
                    onMouseEnter={() => setHoveredSkill(skill)}
                    onMouseLeave={() => setHoveredSkill(null)}
                    className="p-2 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-[var(--theme-border-hover)] rounded-none transition-all duration-200 relative group cursor-pointer overflow-hidden flex flex-col justify-between h-14"
                  >
                    {/* Background glow strip on hover */}
                    <div
                      className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-cyan-400 to-[var(--theme-accent)] transition-all duration-300"
                      style={{ width: isHovered ? "100%" : "15%" }}
                    />

                    {/* Skill Title info */}
                    <div className="flex justify-between items-start text-[10px]">
                      <span className="text-white/80 font-bold group-hover:text-white transition-colors">
                        {skill}
                      </span>
                      <span className="text-[8px] text-white/40 group-hover:text-white/70">
                        {rating}%
                      </span>
                    </div>

                    {/* Miniature cyber line meter */}
                    <div className="h-1 w-full bg-white/5 rounded-none overflow-hidden mt-1">
                      <div
                        className="h-full bg-white group-hover:bg-[var(--theme-accent)] transition-all duration-300 rounded-none shadow-[0_0_6px_rgba(255,255,255,0.2)]"
                        style={{ width: `${rating}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}

        {/* Dynamic telemetry stats drawer */}
        <div className="md:col-span-2 p-3 border border-white/5 bg-white/[0.015] rounded-none text-[10px] space-y-2 relative overflow-hidden">
          <div className="absolute right-2 bottom-1 text-[28px] text-white/[0.02] select-none font-bold italic tracking-wide">
            STATISTIC
          </div>
          <div className="flex items-center space-x-1.5 text-[9px] text-[var(--theme-accent)] font-bold uppercase tracking-wider">
            <Hexagon className="w-3 h-3 text-[var(--theme-accent)] animate-spin" />
            <span>CORE_KINETIC_EVALUATION</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 relative z-10">
            <div className="bg-[var(--theme-bg)] p-2 rounded-none border border-white/5">
              <span className="text-white/40 block text-[8px] font-bold uppercase">PRIMARY LOCK</span>
              <span className="text-white font-bold font-mono text-xs">PYTHON_CORE</span>
            </div>
            <div className="bg-[var(--theme-bg)] p-2 rounded-none border border-white/5">
              <span className="text-white/40 block text-[8px] font-bold uppercase">ANALYSIS FOCUS</span>
              <span className="text-white font-bold font-mono text-xs">PANDAS / NUMPY</span>
            </div>
            <div className="bg-[var(--theme-bg)] p-2 rounded-none border border-white/5">
              <span className="text-white/40 block text-[8px] font-bold uppercase">ETL EFFICIENCY</span>
              <span className="text-[var(--theme-accent)] font-bold font-mono text-xs">+30% PIPELINES</span>
            </div>
            <div className="bg-[var(--theme-bg)] p-2 rounded-none border border-white/5">
              <span className="text-white/40 block text-[8px] font-bold uppercase">AI BENCHMARK</span>
              <span className="text-white font-bold font-mono text-xs">97% CLASSIFIERS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
