import { useState, useEffect, useRef } from "react";
import { Download, Server, Wifi, Cpu, ShieldCheck } from "lucide-react";
import { usePortfolio } from "../context/PortfolioContext";

interface TerminalLoaderProps {
  onComplete: () => void;
}

export default function TerminalLoader({ onComplete }: TerminalLoaderProps) {
  const { isLoading, loadingProgress: progress, loadingLogs: logs } = usePortfolio();
  const [downloadRate, setDownloadRate] = useState("724.8 KB/s");
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  // Download rate jitter update for retro tactile sensory feedback
  useEffect(() => {
    const rateInterval = setInterval(() => {
      const rate = (Math.random() * 300 + 600).toFixed(1);
      setDownloadRate(`${rate} KB/s`);
    }, 250);
    return () => clearInterval(rateInterval);
  }, []);

  // Auto-scroll loading logs logbook container to follow progressive streams
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs.length]);

  // Hook completed loading event back to App's layout switcher
  useEffect(() => {
    if (progress >= 100 && !isLoading) {
      const dismissTimeout = setTimeout(() => {
        onComplete();
      }, 450); // Small aesthetic window to let users see the final complete status
      return () => clearTimeout(dismissTimeout);
    }
  }, [progress, isLoading, onComplete]);

  // Deduce real-time context action indicators based on incremental milestones
  let currentFile = "core_bundle.bin";
  if (progress < 25) {
    currentFile = "core_bundle.bin";
  } else if (progress < 45) {
    currentFile = "projects.db_schema";
  } else if (progress < 70) {
    currentFile = "experiences.json_structure";
  } else if (progress < 90) {
    currentFile = "certifications.credentials_matrix";
  } else {
    currentFile = "secure_gateway_online";
  }

  // Builds standard tactical loading progress indicator block
  const buildProgressBar = () => {
    const totalBars = 24;
    const filledBars = Math.floor((progress / 100) * totalBars);
    const emptyBars = totalBars - filledBars;
    return "[" + "█".repeat(filledBars) + "░".repeat(emptyBars) + "]";
  };

  const isFinishing = progress >= 100;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#05070a] text-cyan-400 font-mono flex flex-col items-center justify-center p-4 selection:bg-cyan-500/20 selection:text-cyan-400">
      
      {/* Immersive Scanline layer */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90.5deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
      <div className="cyber-scan-bar pointer-events-none" />

      {/* Main retro terminal window */}
      <div className="w-full max-w-xl bg-[#090d14] border border-cyan-500/30 p-4 sm:p-5 relative shadow-[0_0_40px_rgba(6,182,212,0.15)] select-none">
        
        {/* Terminal Title Header Bar */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-neutral-900/90 border-b border-cyan-500/20 px-3 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="h-2 w-2 bg-rose-500 animate-pulse" />
            <span className="h-2 w-2 bg-amber-500" />
            <span className="h-2 w-2 bg-emerald-500" />
            <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest pl-1">
              AURORA_DOWNLOADING_CONSOLES_NODE_SECURE
            </span>
          </div>
          <div className="flex items-center space-x-1.5 text-[8px] text-neutral-500 font-bold">
            <span className="animate-pulse text-cyan-400">•</span>
            <span>PORT_3000 // CRYPT_SSL</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="mt-6 pt-1 space-y-4">
          
          {/* Download Speed HUD Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border border-cyan-500/10 bg-black/50 p-3 rounded-none text-xs">
            <div className="space-y-0.5">
              <div className="text-[8px] text-neutral-500 font-semibold uppercase tracking-wider flex items-center space-x-1">
                <Wifi className="w-2.5 h-2.5 text-cyan-400/80" />
                <span>RECEIVE_RATE</span>
              </div>
              <p className="font-bold text-white tracking-wide">{downloadRate}</p>
            </div>
            
            <div className="space-y-0.5 border-t sm:border-t-0 sm:border-l border-cyan-500/10 pt-1.5 sm:pt-0 sm:pl-3">
              <div className="text-[8px] text-neutral-500 font-semibold uppercase tracking-wider flex items-center space-x-1">
                <Download className="w-2.5 h-2.5 text-cyan-400/80" />
                <span>ACTIVE_FILE</span>
              </div>
              <p className="font-bold text-white truncate text-xs">{currentFile}</p>
            </div>

            <div className="space-y-0.5 border-t sm:border-t-0 sm:border-l border-cyan-500/10 pt-1.5 sm:pt-0 sm:pl-3">
              <div className="text-[8px] text-neutral-500 font-semibold uppercase tracking-wider flex items-center space-x-1">
                <Server className="w-2.5 h-2.5 text-cyan-400/80" />
                <span>NODE_SOURCE</span>
              </div>
              <p className="font-bold text-emerald-400 uppercase tracking-widest text-[11px] flex items-center gap-1">
                <span className="h-1.5 w-1.5 bg-emerald-500 inline-block animate-ping" />
                AURORA_NODE_GUNA
              </p>
            </div>
          </div>

          {/* Interactive Log Box */}
          <div 
            ref={logContainerRef}
            className="h-36 bg-black/90 border border-cyan-500/15 p-2.5 text-[10px] sm:text-xs overflow-y-auto space-y-1 font-mono leading-relaxed shadow-inner scroll-smooth"
          >
            {logs.map((log, idx) => (
              <div key={idx} className="flex space-x-1 text-neutral-350">
                <span className="text-cyan-500 select-none">&gt;</span>
                <span className="truncate whitespace-pre-wrap">{log}</span>
              </div>
            ))}
            
            {!isFinishing ? (
              <div className="flex items-center space-x-1 text-cyan-400 animate-pulse font-bold">
                <span className="text-cyan-500 select-none">&gt;</span>
                <span>RETRIEVING STRUCTURED DATABASE RECORDS...</span>
                <span className="inline-block bg-cyan-400 h-2 w-1.5 ml-0.5" />
              </div>
            ) : (
              <div className="text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>INTEGRITY VERIFIED. COMPILING AURORA CYBERDECK VIEWPORT...</span>
              </div>
            )}
          </div>

          {/* Progress Bar & Loader Indicator */}
          <div className="space-y-1.5 select-none">
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest flex items-center gap-1">
                <Cpu className="w-3 h-3 text-cyan-400 animate-spin" />
                SYNCHRONIZING_DATABASE_PIPELINE
              </span>
              <span className="font-bold text-white px-1 ml-2 bg-cyan-950/20 border border-cyan-500 text-[10px]">
                {progress}%
              </span>
            </div>
            
            <div className="text-xs text-cyan-400/90 tracking-widest flex justify-center bg-cyan-950/15 border border-cyan-500/20 p-2 text-center font-bold">
              {buildProgressBar()}
            </div>
          </div>

        </div>

        {/* Tactical minimal Footer */}
        <div className="flex justify-between items-center text-[7px] text-neutral-500 font-bold tracking-widest uppercase mt-3 select-none pt-1.5 border-t border-cyan-500/10">
          <div>SHA-256 PIPELINE VALIDATED</div>
          <div className="text-cyan-400/40">SYSTEM STATUS: FULL COMPILATION SPEED</div>
        </div>

      </div>
    </div>
  );
}
