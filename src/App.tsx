import { useState, useEffect, useRef } from "react";
import { portfolioData as basePortfolioData } from "./data/portfolioData";
import { PortfolioProvider, usePortfolio } from "./context/PortfolioContext";
import AdminDashboard from "./components/AdminDashboard";

// Import Custom Modular Components
import BackgroundAnimation from "./components/BackgroundAnimation";
import TelemetryGauges from "./components/TelemetryGauges";
import TerminalPane from "./components/TerminalPane";
import SkillsPane from "./components/SkillsPane";
import ExperiencePane from "./components/ExperiencePane";
import ProjectsPane from "./components/ProjectsPane";
import AuraDetailsPane from "./components/AuraDetailsPane";
import DigitalGlobe from "./components/DigitalGlobe";
import GlitchHeading from "./components/GlitchHeading";
import TerminalLoader from "./components/TerminalLoader";

// Icons
import {
  Mail,
  MapPin,
  Github,
  Linkedin,
  Terminal,
  Cpu,
  Layers,
  Briefcase,
  GraduationCap,
  ExternalLink,
  Copy,
  ChevronRight,
  Server,
  Workflow,
  Sun,
  Moon,
  ArrowDownCircle,
  Network
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

function PortfolioAppContent() {
  const [siteLoading, setSiteLoading] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Admin and session control parameters
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [systemAlert, setSystemAlert] = useState<{ show: boolean; title: string; message: string }>({ show: false, title: "", message: "" });
  const { portfolio: portfolioData } = usePortfolio();

  useEffect(() => {
    // Dynamic route monitoring and warning redirection matching
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "telemetry_flagged" || window.location.pathname === "/admin") {
      window.history.replaceState({}, "", "/");
      setSystemAlert({
        show: true,
        title: "ACCESS DENIED: TELEMETRY FLAGGED",
        message: "An unauthorized direct routing event was blocked. Gateway security handshake bypassed. Telemetry vectors logged."
      });
    }
  }, []);
  
  const [time, setTime] = useState("");
  const [utcTime, setUtcTime] = useState("");

  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile viewport
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    // Track smooth dynamic scroll fraction (0.0 to 1.0)
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress(window.scrollY / totalHeight);
      }
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Immediate runs
    handleResize();
    handleScroll();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    // Standard system clock updates
    const updateTime = () => {
      const d = new Date();
      setTime(d.toLocaleTimeString("en-US", { hour12: false }));
      setUtcTime(d.toUTCString().slice(17, 25) + " UTC");
    };

    updateTime();
    const clockTimer = setInterval(updateTime, 1000);

    return () => {
      clearInterval(clockTimer);
    };
  }, []);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Complex but buttery-smooth spatial coordinate mapping
  const getGlobeStyle = () => {
    if (isMobile) {
      // Mobile Device Optimizations: Sits centrally with safe scale and low scroll opacity
      if (scrollProgress < 0.25) {
        const rat = scrollProgress / 0.25;
        const y = 140 + rat * -40; // translate vertically
        const scale = 0.8 + rat * -0.15;
        const opacity = 0.8 + rat * -0.6; // dims so user can read text
        return {
          transform: `translate3d(0px, ${y}px, 0) scale(${scale})`,
          opacity,
        };
      } else if (scrollProgress < 0.75) {
        return {
          transform: "translate3d(0px, 100px, 0) scale(0.65)",
          opacity: 0.16,
        };
      } else {
        const rat = (scrollProgress - 0.75) / 0.25;
        const y = 100 + rat * -100; // Centers perfectly
        const scale = 0.65 + rat * 0.45; // scales up majestically
        const opacity = 0.16 + rat * 0.74; // lights up dynamically
        return {
          transform: `translate3d(0px, ${y}px, 0) scale(${scale})`,
          opacity,
        };
      }
    } else {
      // Premium Desktop Interactive Drift Experience
      if (scrollProgress < 0.22) {
        // Stage 0: Hero layout (Centered in right half of viewport)
        const rat = scrollProgress / 0.22;
        const x = 20 + rat * 15;      // Slides smooth from 20vw to 35vw (cut-off at right screen margin)
        const y = 8 + rat * -8;       // Shift slightly upwards
        const scale = 0.98 + rat * -0.08;
        return {
          transform: `translate3d(${x}vw, ${y}vh, 0) scale(${scale})`,
          opacity: 0.95,
        };
      } else if (scrollProgress < 0.52) {
        // Stage 1: Sliding transition to left side as user scrolls past terminal
        const rat = (scrollProgress - 0.22) / 0.3;
        const x = 35 + rat * -75;     // Swiftly glides from far right (35vw) to far left edge (-40vw)
        const y = 0 + rat * 12;
        const scale = 0.9 + rat * 0.08;
        return {
          transform: `translate3d(${x}vw, ${y}vh, 0) scale(${scale})`,
          opacity: 0.85,
        };
      } else if (scrollProgress < 0.8) {
        // Stage 2: Sliding transition back to right side as user scrolls past projects
        const rat = (scrollProgress - 0.52) / 0.28;
        const x = -40 + rat * 75;     // Glides back to the right margin
        const y = 12 + rat * -14;
        const scale = 0.98 + rat * 0.08;
        return {
          transform: `translate3d(${x}vw, ${y}vh, 0) scale(${scale})`,
          opacity: 0.85,
        };
      } else {
        // Stage 3: Centered perfectly at the absolute end (Academic / Footer area)
        const rat = (scrollProgress - 0.8) / 0.2;
        const x = 35 + rat * -35;     // Centers back to middle (0vw)
        const y = -2 + rat * 2;       // Centers vertically (0vh)
        const scale = 1.06 + rat * 0.19; // majestic final size
        const opacity = 0.85 + rat * 0.15;  // Full intensity
        return {
          transform: `translate3d(${x}vw, ${y}vh, 0) scale(${scale})`,
          opacity,
        };
      }
    }
  };

  // Helper smooth scroll handler
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 80; // Offset for sticky header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className={`min-h-screen relative overflow-x-hidden flex flex-col font-mono transition-colors duration-500 selection:bg-[#06B6D4]/20 selection:text-[#06B6D4] ${
      isDarkMode ? "bg-[#080B10] text-[#E2E8F0]" : "bg-[#F1F5F9] text-[#0F172A] light-theme"
    }`}>
      
      
      {/* 0. Initial Terminal Downloading Console Preloader */}
      <AnimatePresence mode="wait">
        {siteLoading && (
          <motion.div
            key="site-loader-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999]"
          >
            <TerminalLoader onComplete={() => setSiteLoading(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Futuristic Background Animations (Particles & Grid Lines) */}
      <BackgroundAnimation />

      {/* Global Scrolling Floating Digital Globe container with GPU translate acceleration */}
      <div 
        className="fixed inset-0 pointer-events-none z-[1] overflow-hidden flex items-center justify-center transition-transform duration-[60ms] ease-out will-change-transform"
        style={getGlobeStyle()}
      >
        <DigitalGlobe isDarkMode={isDarkMode} scrollProgress={scrollProgress} />
      </div>

      {/* Subtle Cyan/Green Scanline CRT bar */}
      <div className="cyber-scan-bar" />

      {/* 2. Top Navigation Status Header (STICKY HUD HEADER) */}
      <header className={`fixed top-0 left-0 w-full border-b transition-colors duration-500 backdrop-blur-md px-4 py-3 z-[1000] flex flex-col lg:flex-row justify-between items-center gap-3 ${
        isDarkMode ? "border-[#06B6D4]/15 bg-[#080B10]/95" : "border-[#0E7490]/15 bg-[#F1F5F9]/90"
      }`}>
        
        {/* Left corner identity & system clock */}
        <div className="flex flex-wrap items-center gap-4 select-none w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => scrollToSection("hero")}>
            <div className="relative flex items-center justify-center">
              <div className="absolute w-4 h-4 bg-[#06B6D4] rounded-none animate-ping opacity-35" />
              <div className={`w-3.5 h-3.5 rounded-none border shadow-[0_0_8px_rgba(6,182,212,0.7)] ${
                isDarkMode ? "bg-[#06B6D4] border-[#06B6D4]" : "bg-[#0E7490] border-[#0E7490]"
              }`} />
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-extrabold tracking-widest uppercase">
                {portfolioData.personalInfo.name} // <span className={isDarkMode ? "text-[#06B6D4] font-bold" : "text-[#0E7490] font-bold"}>CYBER_FLOW</span>
              </h1>
              <p className={`text-[8px] sm:text-[9px] font-mono font-bold tracking-widest leading-none mt-1 uppercase ${
                isDarkMode ? "text-[#06B6D4]" : "text-[#0E7490]"
              }`}>
                {portfolioData.personalInfo.title}
              </p>
            </div>
          </div>

          <div className={`h-8 w-[1px] hidden md:block ${isDarkMode ? "bg-white/10" : "bg-black/10"}`} />

          {/* System Clock Section */}
          <div className="flex items-center space-x-3 font-mono">
            <div className="flex flex-col">
              <span className={`text-[8px] tracking-widest uppercase font-bold ${isDarkMode ? "text-white/40" : "text-[#13221C]/40"}`}>SYSTEM_CLOCK</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-xs sm:text-sm font-extrabold tracking-widest">{time || "00:00:00"}</span>
                <span className={`text-[8px] font-bold ${isDarkMode ? "text-[#06B6D4]" : "text-[#0E7490]"}`}>{utcTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Jumplinks Anchor Menu */}
        <nav className="flex flex-wrap items-center justify-center gap-1 font-mono">
          {[
            { id: "hero", label: "Intro", icon: <ArrowDownCircle className="w-3 h-3" /> },
            { id: "conceptuality", label: "~/concept", icon: <Network className="w-3 h-3" /> },
            { id: "terminal", label: "~/terminal", icon: <Terminal className="w-3 h-3" /> },
            { id: "skills", label: "~/skills", icon: <Layers className="w-3 h-3" /> },
            { id: "projects", label: "~/projects", icon: <Cpu className="w-3 h-3" /> },
            { id: "experience", label: "~/experience", icon: <Briefcase className="w-3 h-3" /> },
            { id: "credentials", label: "~/credentials", icon: <GraduationCap className="w-3 h-3" /> }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`px-2 sm:px-2.5 py-1.5 text-[9px] font-mono font-bold rounded-none uppercase tracking-wider transition-all flex items-center space-x-1 border hover:scale-105 active:scale-95 ${
                isDarkMode
                  ? "border-[#06B6D4]/20 bg-white/[0.01] hover:border-[#06B6D4] hover:bg-[#06B6D4]/5 text-white/60 hover:text-[#06B6D4]"
                  : "border-[#0E7490]/20 bg-black/[0.01] hover:border-[#0E7490] hover:bg-[#0E7490]/5 text-[#13221C]/70 hover:text-[#0E7490]"
              }`}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Telemetry HUD & Controls */}
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3.5 text-[9px] text-white/40 font-mono select-none w-full lg:w-auto">
          
          {/* Location & Stack text Info */}
          <div className="hidden xl:flex flex-col text-right">
            <span className={`text-[8px] tracking-wider font-bold ${isDarkMode ? "text-white/30" : "text-black/30"}`}>LOCATION</span>
            <span className={`font-bold uppercase ${isDarkMode ? "text-white/80" : "text-[#13221C]/80"}`}>{portfolioData.personalInfo.location}</span>
          </div>

          <div className={`w-[1px] h-6 hidden xl:block ${isDarkMode ? "bg-white/10" : "bg-black/10"}`} />

          <div className="hidden sm:flex flex-col text-left lg:text-right">
            <span className={`text-[8px] tracking-wider font-bold ${isDarkMode ? "text-white/30" : "text-black/30"}`}>OFFENSIVE SECURITY HUD</span>
            <span className={`font-bold ${isDarkMode ? "text-[#06B6D4]" : "text-[#0E7490]"}`}>FASTAPI // POSTGRESQL // AURORA</span>
          </div>

          <div className={`w-[1px] h-6 hidden sm:block ${isDarkMode ? "bg-white/10" : "bg-black/10"}`} />

          {/* Theme Dynamic Controller sun/moon toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-1.5 border rounded-none transition-all scale-100 hover:scale-110 active:scale-90 cursor-pointer ${
              isDarkMode
                ? "border-[#06B6D4]/30 bg-white/[0.02] hover:bg-[#06B6D4]/10 text-[#06B6D4]"
                : "border-[#0E7490]/30 bg-[#0E7490]/5 hover:bg-[#0E7490]/10 text-[#0E7490]"
            }`}
            title="Toggle Light / Dark Interface State"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          
          <div className={`w-[1px] h-6 ${isDarkMode ? "bg-white/10" : "bg-black/10"}`} />
          
          {/* External Social Profiles Link Trigger */}
          <div className="flex space-x-1.5">
            <a
              href={portfolioData.personalInfo.githubUrl}
              target="_blank"
              rel="noreferrer"
              className={`p-1.5 border rounded-none transition-all ${
                isDarkMode
                  ? "border-white/5 bg-white/[0.01] hover:border-[#06B6D4]/40 hover:text-[#06B6D4]"
                  : "border-black/5 bg-black/[0.01] hover:border-[#0E7490]/40 hover:text-[#0E7490]"
              }`}
            >
              <Github className="w-3.5 h-3.5" />
            </a>
            <a
              href={portfolioData.personalInfo.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className={`p-1.5 border rounded-none transition-all ${
                isDarkMode
                  ? "border-white/5 bg-white/[0.01] hover:border-[#06B6D4]/40 hover:text-[#06B6D4]"
                  : "border-black/5 bg-black/[0.01] hover:border-[#0E7490]/40 hover:text-[#0E7490]"
              }`}
            >
              <Linkedin className="w-3.5 h-3.5" />
            </a>
            <a
              href={`mailto:${portfolioData.personalInfo.email}`}
              className={`p-1.5 border rounded-none transition-all ${
                isDarkMode
                  ? "border-white/5 bg-white/[0.01] hover:border-[#06B6D4]/40 hover:text-[#06B6D4]"
                  : "border-black/5 bg-black/[0.01] hover:border-[#0E7490]/40 hover:text-[#0E7490]"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Cyber Grid Pattern Background Overlay */}
      <div className="absolute inset-0 cyber-grid-overlay pointer-events-none z-0" />

      {/* 3. Main Dashboard Body (Scrolling Bento Sections) */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 pt-32 sm:pt-28 pb-16 relative z-10 space-y-24">
        
        {/* ====================================
            SECTION 1: HERO VIEW (Tagline + 3D Globe)
            ==================================== */}
        <section id="hero" className="min-h-[75vh] flex items-center py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
            
            {/* Tagline & Core Bio */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2 select-none">
                <span className={`font-mono text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-none border ${
                  isDarkMode 
                    ? "text-[#06B6D4] border-[#06B6D4]/30 bg-[#06B6D4]/10" 
                    : "text-[#0E7490] border-[#0E7490]/30 bg-[#0E7490]/5"
                }`}>
                  AURORA_SYSTEM: SIGNAL LOCK ACTIVE
                </span>
                <p className={`text-[11px] font-mono tracking-wider font-bold uppercase ${isDarkMode ? "text-[#06B6D4]/60" : "text-[#0E7490]/70"}`}>
                  LOG_SECTOR_OFFSSEC: GATEWAY_ONLINE
                </p>
              </div>

              {/* Tagline Heading */}
              <GlitchHeading isDarkMode={isDarkMode} />

              {/* Subtitle bio paragraph */}
              <p className={`text-sm sm:text-base leading-relaxed font-sans max-w-xl ${isDarkMode ? "text-white/70" : "text-[#13221C]/80"}`}>
                I am <span className="font-extrabold">{portfolioData.personalInfo.name}</span>, a B.Tech Computer Science scholar specializing in predictive data science pipelines, database structures, and high-performance engineering stacks. Currently optimizing models to transform complex telemetry matrices into real-time analytical reports.
              </p>

              {/* Hero Call To Actions buttons */}
              <div className="flex flex-wrap gap-3 font-mono pt-2">
                <button
                  onClick={() => scrollToSection("terminal")}
                  className={`px-5 py-3 text-xs font-black rounded-none uppercase tracking-wider flex items-center space-x-2 transition-all hover:scale-105 active:scale-95 border cursor-pointer ${
                    isDarkMode
                      ? "bg-[#06B6D4] text-black border-[#06B6D4] hover:bg-[#00e5ff] shadow-lg shadow-[#06B6D4]/15"
                      : "bg-[#0E7490] text-white border-[#0E7490] hover:bg-[#0891B2] shadow-lg shadow-[#0E7490]/15"
                  }`}
                >
                  <Terminal className="w-4 h-4" />
                  <span>Boot Aurora shell</span>
                </button>
                <button
                  onClick={() => scrollToSection("projects")}
                  className={`px-5 py-3 text-xs font-bold rounded-none uppercase tracking-wider border transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                    isDarkMode
                      ? "border-[#06B6D4]/30 bg-cyan-950/10 hover:bg-[#06B6D4]/10 text-white hover:border-[#06B6D4]"
                      : "border-[#0E7490]/30 bg-slate-550/10 hover:bg-[#0E7490]/10 text-[#0F172A] hover:border-[#0E7490]"
                  }`}
                >
                  <span>Analyze Projects</span>
                </button>
              </div>
            </div>

            {/* Holographic Alignment Frame (Digital Globe docks here) */}
            <div className="lg:col-span-5 flex justify-center items-center select-none">
              <div className="relative w-full max-w-[420px] aspect-square flex flex-col items-center justify-center">
                
                {/* Visual alignment brackets */}
                <div className="absolute inset-0 border border-dashed rounded-none animate-[spin_120s_linear_infinite] opacity-10 border-white/40" />
                <div className={`absolute inset-3 border border-dashed opacity-10 animate-[spin_80s_linear_infinite_reverse] ${
                  isDarkMode ? "border-[#06B6D4]" : "border-[#0E7490]"
                }`} />

                {/* Tracking reticle dots and crosshairs */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-3 bg-white/30" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-3 bg-white/30" />
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-[1px] bg-white/30" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-[1px] bg-white/30" />

                {/* Subtly animated sonar scan ring */}
                <div className={`absolute w-12 h-12 rounded-none border opacity-20 animate-ping ${
                  isDarkMode ? "border-[#06B6D4]/40" : "border-[#0E7490]/40"
                }`} />

                {/* Tracking status watermark below docking ring */}
                <div className="absolute -bottom-2 text-center pointer-events-none w-full">
                  <div className={`text-[8px] font-mono tracking-[0.25em] uppercase font-extrabold ${isDarkMode ? "text-[#06B6D4]" : "text-[#0E7490]"}`}>
                    GLOBAL_NODAL_MATRIX_ROT
                  </div>
                  <div className={`text-[7px] font-mono mt-0.5 ${isDarkMode ? "text-white/20" : "text-black/20"}`}>
                    SYS_W_PERSPECTIVE_PROJECTION_v2.0
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ====================================
            SECTION 2: TELEMETRY & CONCEPTUALITY
            ==================================== */}
        <section id="conceptuality" className="scroll-mt-12">
          <div className="border-b border-white/5 pb-2.5 mb-6">
            <span className={`font-mono text-[9px] font-extrabold tracking-widest ${isDarkMode ? "text-[#06B6D4]" : "text-[#0E7490]"}`}>PORTFOLIO_NODE_01 //</span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-wider uppercase mt-1">OFFENSIVE_INTEL_CORE</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Renamed Biological Overview styled around Conceptuality */}
            <div className="lg:col-span-8 p-6 rounded-none cyber-panel cyber-panel-glow flex flex-col justify-between border-l-4 border-l-[#06B6D4]">
              <div className="absolute top-2.5 right-3 flex items-center space-x-1 select-none text-[8px] font-mono font-bold uppercase tracking-wider">
                <span className={`w-1.5 h-1.5 rounded-none animate-pulse ${isDarkMode ? "bg-[#06B6D4]" : "bg-[#0E7490]"}`} />
                <span>SPEC_CONCEPT_01</span>
              </div>

              <div className="space-y-4">
                <div className="border-b border-white/5 pb-2">
                  <span className={`text-[8px] uppercase tracking-widest block font-bold ${isDarkMode ? "text-white/40" : "text-[#13221C]/40"}`}>SEC_HANDSHAKE_PROFILE</span>
                  <h3 className="text-lg font-black tracking-wide mt-1 uppercase">ARCHITECTURAL SCHEMATIC</h3>
                </div>
                
                <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? "text-[#94A3B8]" : "text-[#0F172A]"}`}>
                  My technical philosophy is built upon the synthesis of performance engineering and analytical pipeline rigor:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className={`p-3 rounded-none border bg-white/[0.01] ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
                    <span className={`text-[8px] font-mono font-extrabold block mb-1 uppercase ${isDarkMode ? "text-[#06B6D4]" : "text-[#0E7490]"}`}>01 // PIPELINE INTELLIGENCE</span>
                    <p className={`text-[10px] leading-relaxed ${isDarkMode ? "text-white/60" : "text-black/60"}`}>
                      Optimizing core data ETL streams. Reducing latency in database transaction nodes and constructing elegant schemas.
                    </p>
                  </div>
                  <div className={`p-3 rounded-none border bg-white/[0.01] ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
                    <span className={`text-[8px] font-mono font-extrabold block mb-1 uppercase ${isDarkMode ? "text-[#06B6D4]" : "text-[#0E7490]"}`}>02 // ANALYTIC COHORT</span>
                    <p className={`text-[10px] leading-relaxed ${isDarkMode ? "text-white/60" : "text-black/60"}`}>
                      Leading technical workshops and analytics teams, converting complex statistical models into actionable KPI targets.
                    </p>
                  </div>
                </div>
              </div>

              {/* Secure Credentials Clip Copy */}
              <div className="mt-6 pt-4 border-t border-white/5 space-y-1.5 text-[10px]">
                <div className="flex justify-between items-center bg-white/[0.015] px-3 py-2 border border-white/5 rounded-none">
                  <span className={`font-extrabold select-none ${isDarkMode ? "text-white/40" : "text-[#13221C]/50"}`}>PRIMARY SEC_MAIL_BUFFER:</span>
                  <div className="flex items-center space-x-1.5">
                    <span className={`font-mono ${isDarkMode ? "text-white/80" : "text-[#13221C]/80"}`}>{portfolioData.personalInfo.email}</span>
                    <button
                      onClick={() => copyToClipboard(portfolioData.personalInfo.email, "email")}
                      className={`p-1 select-none cursor-pointer transition-colors ${
                        isDarkMode ? "hover:text-[#06B6D4] text-white/40" : "hover:text-[#047857] text-[#13221C]/40"
                      }`}
                      title="Copy Address to Secure Clip Clipboard Buffer"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {copiedText && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className={`text-[9px] text-center font-bold select-none animate-pulse ${
                        isDarkMode ? "text-[#06B6D4]" : "text-[#0E7490]"
                      }`}
                    >
                      {copiedText.toUpperCase()} SECURITY DATA CACHED TO HOST RAM BUFFER
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Live gauges card (Networking wave) */}
            <div className="lg:col-span-4 p-6 rounded-none cyber-panel cyber-panel-glow flex flex-col justify-center border-t-4 border-t-[#06B6D4]">
              <TelemetryGauges />
            </div>

          </div>
        </section>

        {/* ====================================
            SECTION 3: COMMAND TERMINAL SHELL
            ==================================== */}
        <section id="terminal" className="scroll-mt-12">
          <div className="border-b border-white/5 pb-2.5 mb-6">
            <span className={`font-mono text-[9px] font-extrabold tracking-widest ${isDarkMode ? "text-[#06B6D4]" : "text-[#0E7490]"}`}>PORTFOLIO_NODE_02 //</span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-wider uppercase mt-1">AURORA_OFFENSIVE_SHELL</h2>
          </div>

          <div className="p-4 rounded-none cyber-panel cyber-panel-glow w-full flex flex-col justify-between min-h-[500px] border-l-4 border-l-[#ef4444]">
            {/* Top Frame Title indicators - Hackish Linux styled */}
            <div className="relative flex justify-between items-center border-b border-white/5 pb-2.5 mb-4 select-none font-mono">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-red-600 rounded-none transform rotate-45" />
                <span className="w-2.5 h-2.5 bg-cyan-500 rounded-none transform rotate-45" />
                <span className="w-2.5 h-2.5 bg-neutral-600 rounded-none transform rotate-45" />
                <span className={`text-[9px] font-black tracking-wider pl-1.5 uppercase ${isDarkMode ? "text-white/60" : "text-[#0F172A]/60"}`}>
                  INTERACTIVE_MAIN_PORT: guest@aurora:~#
                </span>
              </div>
              <div className="text-[8px] text-white/30 flex items-center space-x-1">
                <span className={`w-1.5 h-1.5 rounded-none animate-ping ${isDarkMode ? "bg-[#06B6D4]" : "bg-[#0E7490]"}`} />
                <span>ROOT_LEVEL_SANDBOX</span>
              </div>
            </div>

            <div className="flex-1 w-full relative z-10">
              <TerminalPane onAdminTrigger={() => setIsAdminOpen(true)} />
            </div>

            <div className="border-t border-white/5 pt-3 mt-4 flex flex-col sm:flex-row sm:items-center justify-between text-[8px] font-mono text-white/30 select-none">
              <div className="flex items-center space-x-1.5">
                <Workflow className={`w-3 h-3 ${isDarkMode ? "text-[#06B6D4]" : "text-[#0E7490]"}`} />
                <span className="uppercase">SOCKET STABLE // guest EXPLOITATION PORT CLOSED</span>
              </div>
              <div>
                [ROOT] TYPE "help" TO DUMP CAPABILITIES COMMAND MATRIX
              </div>
            </div>
          </div>
        </section>

        {/* ====================================
            SECTION 4: TECHNICAL STACK (SKILLS)
            ==================================== */}
        <section id="skills" className="scroll-mt-12">
          <div className="border-b border-white/5 pb-2.5 mb-6">
            <span className={`font-mono text-[9px] font-extrabold tracking-widest ${isDarkMode ? "text-[#06B6D4]" : "text-[#0E7490]"}`}>PORTFOLIO_NODE_03 //</span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-wider uppercase mt-1">OFFENSIVE SKILLS ENGINE</h2>
          </div>

          <SkillsPane />
        </section>

        {/* ====================================
            SECTION 5: ANALYTICAL MODELS (PROJECTS)
            ==================================== */}
        <section id="projects" className="scroll-mt-12">
          <div className="border-b border-white/5 pb-2.5 mb-6">
            <span className={`font-mono text-[9px] font-extrabold tracking-widest ${isDarkMode ? "text-[#06B6D4]" : "text-[#0E7490]"}`}>PORTFOLIO_NODE_04 //</span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-wider uppercase mt-1">AUDITED SECURE PROJECTS</h2>
          </div>

          <ProjectsPane />
        </section>

        {/* ====================================
            SECTION 6: CAREER LOG CHECKPOINTS (EXPERIENCE)
            ==================================== */}
        <section id="experience" className="scroll-mt-12">
          <div className="border-b border-white/5 pb-2.5 mb-6">
            <span className={`font-mono text-[9px] font-extrabold tracking-widest ${isDarkMode ? "text-[#06B6D4]" : "text-[#0E7490]"}`}>PORTFOLIO_NODE_05 //</span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-wider uppercase mt-1">TACTICAL OPERATION LOGS</h2>
          </div>

          <ExperiencePane />
        </section>

        {/* ====================================
            SECTION 7: ACADEMIC CREDENTIALS Matrix (EDUCATION / CERTIFICATIONS)
            ==================================== */}
        <section id="credentials" className="scroll-mt-12">
          <div className="border-b border-white/5 pb-2.5 mb-6">
            <span className={`font-mono text-[9px] font-extrabold tracking-widest ${isDarkMode ? "text-[#06B6D4]" : "text-[#0E7490]"}`}>PORTFOLIO_NODE_06 //</span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-wider uppercase mt-1">ACADEMIC MATRIX & VERIFICATION</h2>
          </div>

          <AuraDetailsPane />
        </section>

      </main>

      {/* 4. Footer Telemetry Log Line */}
      <footer className={`w-full border-t py-4 px-4 flex flex-col sm:flex-row justify-between items-center text-[8px] font-mono select-none relative z-10 tracking-widest ${
        isDarkMode ? "border-white/5 bg-[#050608]/95 text-white/30" : "border-black/5 bg-[#E6ECF0]/95 text-black/40"
      }`}>
        <div className={`flex items-center space-x-1.5 font-bold uppercase ${isDarkMode ? "text-[#06B6D4]" : "text-[#0E7490]"}`}>
          <Server className="w-3 h-3 text-[#06B6D4]" />
          <span>CYBERNETIC DATA_SCIENCE FRAMEWORK // ARUNAM_JAIN // SHARP TACTICAL AURORA ENGINE</span>
        </div>
        <div className="mt-2 sm:mt-0 font-extrabold">
          LATENCY: <span className={isDarkMode ? "text-[#06B6D4]" : "text-[#0E7490]"}>4 ms</span> || SYSTEMSTATUS: <span className={isDarkMode ? "text-[#06B6D4]" : "text-[#0E7490]"}>SECURE</span>
        </div>
      </footer>

      {/* Embedded administrative control HUD panel overlay */}
      <AdminDashboard isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />

      {/* Cyberdeck Red Notification Warning Overlay */}
      <AnimatePresence>
        {systemAlert.show && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-mono select-none"
          >
            <div className="w-full max-w-sm bg-neutral-950 border border-rose-500/25 rounded-none p-5 relative overflow-hidden shadow-[0_0_20px_rgba(239,68,68,0.25)]">
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-rose-500 shadow-[0_0_8px_#EF4444]" />
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-2.5 bg-rose-950/20 border border-rose-500/20 text-rose-400 rounded-none animate-pulse">
                  <Server className="w-6 h-6 text-rose-500" />
                </div>
                <h2 className="text-rose-500 text-[10px] font-black tracking-widest uppercase">{systemAlert.title}</h2>
                <p className="text-white/60 text-[10px] leading-relaxed">
                  {systemAlert.message}
                </p>
                <button
                  onClick={() => setSystemAlert({ show: false, title: "", message: "" })}
                  className="px-4 py-2 bg-rose-500 text-black font-black uppercase tracking-wider text-[9px] rounded-none cursor-pointer hover:bg-rose-400 transition"
                >
                  CLOSE CORE PORTAL
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function App() {
  return (
    <PortfolioProvider>
      <PortfolioAppContent />
    </PortfolioProvider>
  );
}
