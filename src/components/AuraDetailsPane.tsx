import { usePortfolio } from "../context/PortfolioContext";
import { motion } from "motion/react";
import { Award, GraduationCap, Calendar, MapPin, BadgeCheck, Network, ExternalLink } from "lucide-react";

export default function AuraDetailsPane() {
  const { portfolio: portfolioData } = usePortfolio();
  return (
    <div className="space-y-4 font-mono select-none">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Education Log Segment */}
        <div className="space-y-3">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-[10px] text-white/40 uppercase tracking-widest block font-bold font-mono">
              EDUCATION_REGISTRY
            </span>
            <span className="text-[10px] text-[var(--theme-accent)] font-mono tracking-tight font-bold">ACADEMICS</span>
          </div>

          {portfolioData.education.map((edu, idx) => (
            <motion.div
              key={edu.institution}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
              className="p-3 border border-white/5 bg-white/[0.015] rounded-none flex flex-col justify-between space-y-2 border-l-2 border-l-[var(--theme-accent)]"
            >
              <div className="flex items-start space-x-2">
                <GraduationCap className="w-5 h-5 text-white/70 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-white leading-tight">
                    {edu.institution.toUpperCase()}
                  </h3>
                  <p className="text-[10px] text-[var(--theme-accent)] mt-1 uppercase font-bold font-mono">
                    {edu.degree}
                  </p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-2 flex justify-between text-[9px] text-white/40 leading-none font-mono">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-white/50" />
                  <span>{edu.period}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-[var(--theme-accent)]" />
                  <span>{edu.location}</span>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Academic Stats Telemetry decorative panel */}
          <div className="p-3 border border-white/5 bg-white/[0.01] rounded-none flex flex-col justify-between space-y-1">
            <div className="flex items-center space-x-1 font-bold text-[9px] text-[var(--theme-accent)] uppercase tracking-wider font-mono">
              <Network className="w-3 h-3 text-[var(--theme-accent)]" />
              <span>COGNITIVE_VECTOR_FIELD</span>
            </div>
            <div className="text-[10px] leading-relaxed text-white/70 font-mono">
              Engaged in advanced algorithms research, deep structured database analytics, discrete structures models, and mathematical statistics.
            </div>
          </div>
        </div>

        {/* Certifications Segment */}
        <div className="space-y-3">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-[10px] text-white/40 uppercase tracking-widest block font-bold font-mono">
              CREDENTIALS_STORAGE
            </span>
            <span className="text-[10px] text-[var(--theme-accent)] font-mono tracking-tight font-bold">VERIFIED KEYS</span>
          </div>

          <div className="space-y-2">
            {portfolioData.certifications.map((cert, idx) => (
              <motion.div
                key={cert.name}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                className="p-2.5 border border-white/5 bg-white/[0.01] hover:border-[var(--theme-border-hover)] rounded-none transition-all duration-200 flex justify-between items-center text-[10px] border-r-2 border-r-[var(--theme-accent)]"
              >
                <div className="flex items-center space-x-2 truncate pr-2">
                  <Award className="w-3.5 h-3.5 text-white/70 shrink-0 select-all" />
                  <div className="truncate font-mono">
                    <div className="text-white/90 font-bold truncate tracking-wide flex items-center pr-1.5" title={cert.name}>
                      {(cert as any).credentialUrl ? (
                        <a href={(cert as any).credentialUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--theme-accent)] transition flex items-center gap-1">
                          <span>{cert.name.toUpperCase()}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-[var(--theme-accent)] shrink-0 inline-block" />
                        </a>
                      ) : (
                        cert.name.toUpperCase()
                      )}
                    </div>
                    <p className="text-[8px] text-white/40 truncate">
                      Issuer: {cert.issuer}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 text-right shrink-0 font-mono">
                  <BadgeCheck className="w-3.5 h-3.5 text-[var(--theme-accent)] font-bold" />
                  <span className="text-[9px] text-[var(--theme-accent)] font-bold">
                    {cert.date}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
