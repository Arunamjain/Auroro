import React, { useState, useRef, useEffect } from "react";
import { usePortfolio } from "../context/PortfolioContext";
import { getSupabaseClient } from "../lib/supabaseClient";
import MatrixRain from "./MatrixRain";

interface ConsoleLine {
  text: string;
  type: "input" | "output" | "error" | "system" | "heading";
}

interface TerminalPaneProps {
  onAdminTrigger?: () => void;
}

export default function TerminalPane({ onAdminTrigger }: TerminalPaneProps) {
  const { portfolio: portfolioData } = usePortfolio();
  const [showMatrix, setShowMatrix] = useState(false);
  const [history, setHistory] = useState<ConsoleLine[]>([
    { text: "CORE SHELL BOOTLOAD SYSTEM_INIT [v1.0.4] ... OK", type: "system" },
    { text: "LOGGED IN SECURELY AS GUEST@ARUNAMJAIN.SYS", type: "system" },
    { text: "TYPE 'help' FOR A LIST OF ACTIVE TELEMETRY COMMANDS.", type: "heading" },
    { text: "", type: "output" },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [passwordMode, setPasswordMode] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll console to bottom on stream updates
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history]);

  // Query Supabase backend status on load to report connection diagnostics
  useEffect(() => {
    const fetchSupabaseStatus = async () => {
      try {
        const res = await fetch("/api/supabase/status");
        if (res.ok) {
          const status = await res.json();
          if (status.connected) {
            setHistory((prev) => [
              ...prev,
              { text: `[SUPABASE_OK] Live relational DB connected successfully! (Bridge: ${status.dbUrl})`, type: "heading" },
              { text: "Dynamic reading/writing vectors active for 'projects' and 'experiences' catalogues.", type: "system" },
              { text: "", type: "output" }
            ]);
          } else if (status.configured) {
            setHistory((prev) => [
              ...prev,
              { text: "[SUPABASE_ERR] Credentials detected but diagnostic handshaking failed!", type: "error" },
              { text: `Details: ${status.error}`, type: "error" },
              { text: "Ensure your tables are created in Supabase. You can run 'Seed Supabase DB' in your admin panel once logged in to synchronize them.", type: "system" },
              { text: "", type: "output" }
            ]);
          } else {
            setHistory((prev) => [
              ...prev,
              { text: "[SUPABASE_STANDBY] Static JSON fallback active. Relational database offline.", type: "system" },
              { text: "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your env configurations via the Settings menu to activate real-time Supabase sync.", type: "system" },
              { text: "", type: "output" }
            ]);
          }
        }
      } catch (e: any) {
        console.warn("Could not retrieve Supabase connection diagnostics status on boot:", e);
      }
    };
    fetchSupabaseStatus();
  }, []);

  // Clean terminal history upon admin logout to prevent history leak
  useEffect(() => {
    const handleLogoutEvent = () => {
      setHistory([
        { text: "CORE SHELL BOOTLOAD SYSTEM_INIT [v1.0.4] ... OK", type: "system" },
        { text: "LOGGED IN SECURELY AS GUEST@ARUNAMJAIN.SYS", type: "system" },
        { text: "TYPE 'help' FOR A LIST OF ACTIVE TELEMETRY COMMANDS.", type: "heading" },
        { text: "", type: "output" },
      ]);
      setInputVal("");
      setCmdHistory([]);
      setHistoryIndex(-1);
      setPasswordMode(false);
      setIsAuthenticating(false);
    };

    window.addEventListener("admin-logout", handleLogoutEvent);
    return () => {
      window.removeEventListener("admin-logout", handleLogoutEvent);
    };
  }, []);

  // Focus the cursor input automatically on clicking container
  const focusTerminal = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (passwordMode) return; // Prevent history traversal while typing passwords

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIdx = historyIndex === -1 ? cmdHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInputVal(cmdHistory[nextIdx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (cmdHistory.length === 0 || historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= cmdHistory.length) {
        setHistoryIndex(-1);
        setInputVal("");
      } else {
        setHistoryIndex(nextIdx);
        setInputVal(cmdHistory[nextIdx]);
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setHistory([]);
      setInputVal("");
    }
  };

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    if (passwordMode) {
      setInputVal("");
      if (isAuthenticating) return;

      setIsAuthenticating(true);

      // Log stylized handshaking line (password is securely hidden)
      setHistory((prev) => [
        ...prev,
        { text: "ENTER ADMIN ACCESS CODE: ••••••••", type: "input" },
        { text: "[SECURE_CONNECT] Initiating cryptographic database signature verification...", type: "system" }
      ]);

      try {
        const supabase = getSupabaseClient();

        // 1. Execute the login request using the Supabase client SDK:
        const { data, error } = await supabase.auth.signInWithPassword({
          email: "arunamjaindps7@gmail.com",
          password: cmd
        });

        if (error) {
          setHistory((prev) => [
            ...prev,
            { text: `ERR: Supabase auth handshaking rejected: ${error.message}`, type: "error" },
            { text: "Access coordinate signatures invalidated.", type: "error" },
            { text: "", type: "output" }
          ]);
          setPasswordMode(false);
          setIsAuthenticating(false);
          return;
        }

        setHistory((prev) => [
          ...prev,
          { text: "[SUPABASE_OK] Credentials authenticated successfully via client SDK gateway.", type: "heading" },
          { text: "[SESSION_STABLE] Syncing secure authorization cookie tokens on Port 3000...", type: "system" }
        ]);

        // 2. Synchronize server session by performing local loop login endpoint request (secures HttpOnly cookie)
        const csrfRes = await fetch("/api/verify-admin", { method: "POST" });
        if (!csrfRes.ok) {
          throw new Error("Port 3000 authentication pipeline bypassed or closed.");
        }
        const csrfData = await csrfRes.json();

        const loginRes = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: cmd, csrfToken: csrfData.csrfToken })
        });

        const loginData = await loginRes.json();

        if (loginRes.ok) {
          setHistory((prev) => [
            ...prev,
            { text: `[SYSTEM_DECK_UNLOCKED] ${loginData.message || "Authorized to access Central Matrix Deck."}`, type: "heading" },
            { text: "Bootloader completed. Opening secure console window...", type: "system" },
            { text: "", type: "output" }
          ]);

          // Open Central Dashboard in Authenticated mode immediately
          if (onAdminTrigger) {
            setTimeout(() => {
              onAdminTrigger();
            }, 600);
          }
        } else {
          setHistory((prev) => [
            ...prev,
            { text: `ERR: Platform system login failed: ${loginData.error}`, type: "error" },
            { text: "", type: "output" }
          ]);
        }
      } catch (err: any) {
        setHistory((prev) => [
          ...prev,
          { text: `ERR: Verification route failed: ${err.message || err}`, type: "error" },
          { text: "", type: "output" }
        ]);
      } finally {
        setPasswordMode(false);
        setIsAuthenticating(false);
      }
      return;
    }

    // Normal command trajectory
    // Save to execution history, provided password is not captured
    setCmdHistory((prev) => {
      if (prev.length > 0 && prev[prev.length - 1] === cmd) return prev;
      return [...prev, cmd];
    });
    setHistoryIndex(-1);

    const lowerCmd = cmd.toLowerCase();
    const parts = lowerCmd.split(" ");
    const primaryCmd = parts[0];
    const argument = parts.length > 1 ? parts.slice(1).join(" ") : null;

    // Append standard prompt line
    const updatedHistory: ConsoleLine[] = [
      ...history,
      { text: `guest@arunam_jain.sys:~$ ${cmd}`, type: "input" },
    ];

    const cleanCmd = cmd.trim().toLowerCase().replace(/\s+/g, " ");

    // Easter Egg Command 1: Sandwich
    if (cleanCmd === "make me a sandwich") {
      updatedHistory.push({ text: "bash: What? Make it yourself.", type: "error" });
      setHistory(updatedHistory);
      setInputVal("");
      return;
    }

    if (cleanCmd === "sudo make me a sandwich") {
      updatedHistory.push({ text: "Okay. 🥪", type: "heading" });
      setHistory(updatedHistory);
      setInputVal("");
      return;
    }

    // Easter Egg Command 2: Matrix Rain
    if (cleanCmd === "matrix") {
      setHistory([]);
      setInputVal("");
      setShowMatrix(true);
      return;
    }

    // Easter Egg Command 3: Rickroll Redirect
    if (
      cleanCmd === "rickroll" || 
      cleanCmd === "curl -l rickyroll" || 
      cleanCmd === "curl -l rickyroll" || 
      cleanCmd === "curl -L rickroll" || 
      cleanCmd === "curl -l rickroll" || 
      cleanCmd === "curl rickroll"
    ) {
      updatedHistory.push({ 
        text: "[SECURE_LINK] Redirecting to critical subsystem data stream...", 
        type: "system" 
      });
      setHistory(updatedHistory);
      setInputVal("");

      setTimeout(() => {
        window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "_blank");
      }, 500);
      return;
    }

    switch (primaryCmd) {
      case "help":
        updatedHistory.push(
          { text: "AVAILABLE UTILITIES & INTEGRATIONS:", type: "heading" },
          { text: "  whoami          Display background profile of Arunam Jain.", type: "output" },
          { text: "  ls              List active directory files and catalogs.", type: "output" },
          { text: "  cat <file>      Display contents of custom file paths e.g. 'cat contact.dat'.", type: "output" },
          { text: "  skills          Output entire tech stacks matrix.", type: "output" },
          { text: "  projects        Show detailed specs list of analytical models.", type: "output" },
          { text: "  msg <text>      Send an automated email message to Arunam.", type: "output" },
          { text: "  neofetch        Display retro ascii logo and telemetry stats.", type: "output" },
          { text: "  clear           Purge console screen buffers.", type: "output" }
        );
        break;

      case "clear":
        setHistory([]);
        setInputVal("");
        return;

      case "whoami":
        updatedHistory.push(
          { text: `PROFILE IDENTIFIER: ${portfolioData.personalInfo.name.toUpperCase()}`, type: "heading" },
          { text: portfolioData.personalInfo.bio, type: "output" },
          { text: `Current Focus: B.Tech Computer Science @ JUET (Jul 2024 - May 2028)`, type: "output" },
          { text: `Glow Nodes: ${portfolioData.personalInfo.location}`, type: "output" }
        );
        break;

      case "ls":
        updatedHistory.push(
          { text: "Listing core modules catalogs in ~/guest:", type: "heading" },
          { text: " d--  bio.md           [Markdown Article]", type: "output" },
          { text: " d--  contact.dat      [Encrypted Registry]", type: "output" },
          { text: " d--  curriculum.txt   [Education Logs]", type: "output" },
          { text: " d--  credentials.db   [Certifications Core]", type: "output" }
        );
        break;

      case "cat":
        if (!argument) {
          updatedHistory.push({ text: "ERR: Specify source file path. Usage: cat <filename>", type: "error" });
        } else if (argument === "bio.md") {
          updatedHistory.push(
            { text: `--- BIO.MD ---`, type: "heading" },
            { text: portfolioData.personalInfo.bio, type: "output" },
            { text: `Fields: Data Analysis, ML Pipelines, ETL Architecture, Statistical Regression.`, type: "output" }
          );
        } else if (argument === "contact.dat") {
          updatedHistory.push(
            { text: `--- REGISTRY: CONTACT.DAT ---`, type: "heading" },
            { text: `  EMAIL:     ${portfolioData.personalInfo.email}`, type: "output" },
            { text: `  LINKEDIN:  ${portfolioData.personalInfo.linkedinUrl}`, type: "output" },
            { text: `  GITHUB:    ${portfolioData.personalInfo.githubUrl}`, type: "output" }
          );
        } else if (argument === "curriculum.txt") {
          updatedHistory.push(
            { text: `--- CURRICULUM.TXT ---`, type: "heading" },
            ...portfolioData.education.map(edu => ({
              text: `  [+] ${edu.institution} - ${edu.degree} | ${edu.period} (${edu.location})`,
              type: "output" as const
            }))
          );
        } else if (argument === "credentials.db") {
          updatedHistory.push(
            { text: `--- CREDENTIALS.DB ---`, type: "heading" },
            ...portfolioData.certifications.map(cert => ({
              text: `  [*] ${cert.name} [Issuer: ${cert.issuer}] (${cert.date})`,
              type: "output" as const
            }))
          );
        } else {
          updatedHistory.push({ text: `ERR: File path '${argument}' not found in ~/guest. Try 'ls' for file directory.`, type: "error" });
        }
        break;

      case "skills":
        updatedHistory.push(
          { text: "TECHNICAL SKILLS ANALYSIS MATRIX:", type: "heading" },
          ...portfolioData.skills.map(grp => ({
            text: `  [${grp.category.toUpperCase()}]:  ${grp.skills.join(", ")}`,
            type: "output" as const
          }))
        );
        break;

      case "projects":
        updatedHistory.push(
          { text: "COMPUTATIONAL MODELS & ANALYSIS DIRECTORIES:", type: "heading" },
          ...portfolioData.projects.flatMap(proj => [
            { text: `  Module [${proj.title.toUpperCase()}] - ${proj.subtitle}`, type: "heading" as const },
            { text: `    Tech Stack:  ${proj.tech.join(" | ")}`, type: "output" as const },
            ...proj.highlights.map(hl => ({ text: `    - ${hl}`, type: "output" as const }))
          ])
        );
        break;

      case "msg":
        if (!argument) {
          updatedHistory.push({ text: "ERR: Specify message payload. Usage: msg <your message text here>", type: "error" });
        } else {
          updatedHistory.push(
            { text: "[CONNECTING_PROXY] Initializing secure telemetry channel...", type: "system" },
            { text: `[DATA_PACKET] Envelope: "${argument}"`, type: "system" },
            { text: `[TRANSMITTING] Relaying to mail client destination...`, type: "system" },
            { text: `[SUCCESS] Secure email client command dispatched!`, type: "heading" },
            { text: `Please click send on your mail application to finish transmitting to ${portfolioData.personalInfo.email}`, type: "output" }
          );

          const subject = encodeURIComponent("Portfolio Message from Terminal Guest");
          const body = encodeURIComponent(argument);
          window.location.href = `mailto:${portfolioData.personalInfo.email}?subject=${subject}&body=${body}`;
        }
        break;

      case "neofetch":
        updatedHistory.push(
          {
            text: `   _        _       OS: auroro
  / \\      | |      Host: Arunam Jain
 / _ \\  _  | |      Focus: Data Science & Analytics
/ ___ \\| | | |      Environment: Terminal + Browser
/_/   \\_\\_\\_/_|     Shell: zsh / bash
                    
 DATA SCIENCE SHELL `,
            type: "output",
          },
          { text: `ENGINE CORE INTEGRATION:`, type: "heading" },
          { text: `  Main Target Portfolio: Arunam Jain`, type: "output" },
          { text: `  Role Descriptor:       Data Science Coordinator & Technical Lead`, type: "output" },
          { text: `  Location Nodes:        Guna, MP, India`, type: "output" },
          { text: `  Core Stack:            Python, C++, SQL, FastAPI, Supabase`, type: "output" }
        );
        break;

      case "sudo":
        if (argument === "access --admin" || argument === "access" || argument === "access -a" || argument === "access -admin") {
          updatedHistory.push(
            { text: "[HANDSHAKE_INIT] Directing access command to security shield on standard ports...", type: "system" },
            { text: "ENTER ADMIN ACCESS CODE:", type: "heading" }
          );
          setPasswordMode(true);
        } else {
          updatedHistory.push({ text: "ERR: Sudo privilege level invalid. System usage: 'sudo access --admin'.", type: "error" });
        }
        break;

      case "init_auth_session":
        updatedHistory.push(
          { text: "[SESSION_INIT] Pre-firing auth state handshaking packets...", type: "system" },
          { text: "ENTER ADMIN ACCESS CODE:", type: "heading" }
        );
        setPasswordMode(true);
        break;

      default:
        updatedHistory.push({
          text: `ERR: Command '${primaryCmd}' unrecognized. Type 'help' to review cataloged commands.`,
          type: "error",
        });
    }

    setHistory(updatedHistory);
    setInputVal("");
  };

  return (
    <div
      onClick={focusTerminal}
      className="w-full h-full min-h-[180px] bg-white/[0.01] rounded-none border border-white/5 hover:border-[var(--theme-border-hover)] transition-all font-mono p-4 overflow-hidden flex flex-col justify-between text-xs cursor-text shadow-2xl relative border-l-2 border-l-[var(--theme-accent)]"
    >
      {/* Matrix rain overlay */}
      {showMatrix && (
        <MatrixRain onExit={() => setShowMatrix(false)} />
      )}

      {/* Console Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2 select-none">
        <div className="flex items-center space-x-1.5 text-[10px] text-white/65 font-mono">
          <span className="w-2 h-2 rounded-none bg-white/10 border border-white/20" />
          <span className="w-2 h-2 rounded-none bg-white/20 border border-white/40" />
          <span className="w-2 h-2 rounded-none bg-[var(--theme-accent)]/30 border border-[var(--theme-accent)]/60" />
          <span className="pl-1 text-white font-bold uppercase tracking-wider">HOST_TERMINAL://bash</span>
        </div>
        <span className="text-[10px] text-[var(--theme-accent)] tracking-wider font-bold select-none font-mono">SECURE ACCESS</span>
      </div>

      {/* Terminal Rows Area */}
      <div
        ref={containerRef}
        className="flex-1 w-full overflow-y-auto mb-2 space-y-2 pr-1 scrollbar-thin select-text font-mono"
        style={{ maxHeight: "calc(100% - 30px)" }}
      >
        {history.map((line, idx) => {
          let lineClass = "text-white/80";
          if (line.type === "input") lineClass = "text-[var(--theme-accent)] font-bold";
          if (line.type === "error") lineClass = "text-rose-400 font-medium tracking-wide";
          if (line.type === "system") lineClass = "text-white/40 select-none";
          if (line.type === "heading") lineClass = "text-[var(--theme-accent)] font-extrabold tracking-wider uppercase";

          return (
            <div key={idx} className={`${lineClass} whitespace-pre-wrap leading-relaxed`}>
              {line.text}
            </div>
          );
        })}
      </div>

      {/* Input Core Form */}
      <form onSubmit={handleCommandSubmit} className="flex items-center w-full pl-0 border-t border-white/5 pt-2">
        <span className="text-[var(--theme-accent)] font-bold mr-1.5 select-none font-mono text-[11px] shrink-0">
          {passwordMode ? "ENTER ADMIN ACCESS CODE:" : "guest@arunam_jain.sys:~$"}
        </span>
        <input
          ref={inputRef}
          type={passwordMode ? "password" : "text"}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-white outline-none border-none caret-white select-all font-mono text-xs"
          maxLength={80}
          autoComplete="off"
          spellCheck="false"
          disabled={isAuthenticating}
          placeholder={passwordMode ? "Decrypting code key..." : ""}
        />

        {/* SECURITY OVERRIDE & EXECUTOR BYPASS CONTROLS (INSPECT ELEMENT TRACE) */}
        <div 
          style={{ display: "none" }} 
          id="security-override-key" 
          data-inspect-passcode="admin123" 
          data-administrative-email="arunamjaindps7@gmail.com" 
        />
      </form>
    </div>
  );
}
