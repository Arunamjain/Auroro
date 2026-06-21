import { useState, useEffect } from "react";

// Cybernetic glitch chars for tactical aesthetics
const GLITCH_CHARS = "01_X$#@&%?{}[]<>-+=!^~/\\";

interface GlitchHeadingProps {
  isDarkMode: boolean;
}

export default function GlitchHeading({ isDarkMode }: GlitchHeadingProps) {
  const line1Base = "WHERE EXPLOITS RESOLVE";
  const line2Base = "ENGINEERING THROTTLES";
  
  const [text1, setText1] = useState(line1Base);
  const [text2, setText2] = useState(line2Base);
  const [glitchActive, setGlitchActive] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const triggerGlitch = () => {
    setGlitchActive(true);
    
    // Quick bursts of scrambled characters
    let frames = 0;
    const maxFrames = 6;
    const scrambleInterval = setInterval(() => {
      setText1(
        line1Base
          .split("")
          .map((char) => {
            if (char === " ") return " ";
            return Math.random() > 0.4 ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)] : char;
          })
          .join("")
      );

      setText2(
        line2Base
          .split("")
          .map((char) => {
            if (char === " ") return " ";
            return Math.random() > 0.4 ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)] : char;
          })
          .join("")
      );

      frames++;
      if (frames >= maxFrames) {
        clearInterval(scrambleInterval);
        setText1(line1Base);
        setText2(line2Base);
        setGlitchActive(false);
      }
    }, 60);
  };

  // Trigger occasional random glitches
  useEffect(() => {
    const randomTimer = setInterval(() => {
      if (!isHovered && Math.random() > 0.45) {
        triggerGlitch();
      }
    }, 4000);

    return () => clearInterval(randomTimer);
  }, [isHovered]);

  return (
    <div
      className="relative cursor-default select-none group py-2"
      onMouseEnter={() => {
        setIsHovered(true);
        triggerGlitch();
      }}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
    >
      {/* Glitch red-shifted clone layer */}
      {glitchActive && (
        <div 
          className="absolute inset-x-0 top-2 text-rose-500 opacity-80 select-none pointer-events-none font-black leading-none uppercase font-mono tracking-tight text-4xl sm:text-5xl lg:text-6xl -translate-x-1 translate-y-[2px] skew-x-3 text-shadow-[1px_0_#ff003c]"
          style={{
            clipPath: "polygon(0 0, 100% 0, 100% 33%, 0 33%)"
          }}
        >
          <div>{text1}</div>
          <div className={`text-3xl sm:text-4xl lg:text-5xl tracking-widest font-black mt-2 text-rose-500`}>
            {text2}
          </div>
        </div>
      )}

      {/* Glitch cyan-shifted clone layer */}
      {glitchActive && (
        <div 
          className="absolute inset-x-0 top-2 text-cyan-400 opacity-80 select-none pointer-events-none font-black leading-none uppercase font-mono tracking-tight text-4xl sm:text-5xl lg:text-6xl translate-x-1 translate-y-[-2px] skew-x-[-3deg] text-shadow-[-1px_0_#00f0ff]"
          style={{
            clipPath: "polygon(0 40%, 100% 40%, 100% 100%, 0 100%)"
          }}
        >
          <div>{text1}</div>
          <div className="text-3xl sm:text-4xl lg:text-5xl tracking-widest font-black mt-2 text-cyan-400">
            {text2}
          </div>
        </div>
      )}

      {/* Main Base Text */}
      <h1 className={`font-mono text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none uppercase select-none relative ${
        glitchActive ? "animate-[pulse_0.08s_infinite]" : ""
      }`}>
        <div className={`${isDarkMode ? "text-white" : "text-neutral-900"}`}>{text1}</div>
        <div 
          className={`text-3xl sm:text-4xl lg:text-5xl tracking-widest font-black mt-2 transition-colors duration-300 ${
            glitchActive
              ? "text-cyan-400" 
              : isDarkMode 
                ? "text-[var(--theme-accent)]" 
                : "text-[var(--theme-accent)]"
          }`}
        >
          {text2}
        </div>
      </h1>

      {/* Tactical auxiliary border visual marker */}
      <div className="flex items-center space-x-2 mt-4 font-mono select-none text-[9px] text-neutral-500">
        <span className={`h-1.5 w-1.5 rounded-none ${glitchActive ? "bg-rose-500 animate-ping" : "bg-[var(--theme-accent)]"}`} />
        <span className="tracking-widest uppercase">
          {glitchActive ? "GLITCH_INTERCEPT_CAPTURED // STACK_SPIKE" : "STABLE_SYSTEM_AURA_MONITOR"}
        </span>
      </div>
    </div>
  );
}
