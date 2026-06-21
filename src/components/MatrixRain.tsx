import { useState, useEffect, useRef } from "react";

interface MatrixRainProps {
  onExit: () => void;
}

const MATRIX_CHARS = "ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ*+-<>[]_";

export default function MatrixRain({ onExit }: MatrixRainProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [inputBuffer, setInputBuffer] = useState("");
  const animationFrameRef = useRef<number | null>(null);

  // Keyboard handle event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape or Ctrl+C
      if (e.key === "Escape" || (e.key === "c" && e.ctrlKey)) {
        e.preventDefault();
        onExit();
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const command = inputBuffer.trim().toLowerCase();
        if (command === "clear" || command === "exit" || command === "matrix") {
          onExit();
        } else {
          setInputBuffer("");
        }
        return;
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        setInputBuffer((prev) => prev.slice(0, -1));
        return;
      }

      // Add alphanumeric / basic symbol chars
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setInputBuffer((prev) => (prev + e.key).slice(0, 30)); // limit length
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [inputBuffer, onExit]);

  // Main Canvas Cascade Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || 455;
    };

    window.addEventListener("resize", handleResize);

    const fontSize = 14;
    const columns = Math.ceil(width / fontSize);
    const drops: number[] = Array(columns).fill(0).map(() => Math.floor(Math.random() * -100));

    // Colors list for varying shades of neon matrix-green
    const greenShades = ["#00FF41", "#008F11", "#39FF14", "#19E619", "#02E602"];

    const draw = () => {
      // Draw dynamic semi-transparent black background to simulate classic cascade trail
      ctx.fillStyle = "rgba(5, 7, 10, 0.08)";
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Random character choice
        const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
        
        // Pick dynamic shade for variance
        const color = greenShades[Math.floor(Math.random() * greenShades.length)];
        ctx.fillStyle = color;

        // Brighten the leading falling character
        if (drops[i] * fontSize < fontSize * 2) {
          ctx.fillStyle = "#FFFFFF";
        }

        // Draw character
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);

        // Reset drop index or fall further
        if (drops[i] * fontSize > height && Math.random() > 0.98) {
          drops[i] = 0;
        } else {
          drops[i]++;
        }
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-50 bg-[#05070a] flex flex-col justify-end p-4 border border-cyan-500/30 overflow-hidden font-mono"
    >
      {/* Background HTML5 Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full pointer-events-none" />

      {/* Floating Tactical Prompt Panel */}
      <div className="relative z-10 bg-black/85 border border-green-500/30 p-2 text-[10px] sm:text-xs text-green-400 select-none max-w-sm mb-2 backdrop-blur-md">
        <div className="flex items-center space-x-1.5 font-bold mb-1 border-b border-green-500/15 pb-1">
          <span className="h-1.5 w-1.5 bg-green-500 animate-ping rounded-none" />
          <span className="uppercase tracking-widest text-[#00FF41]">MATRIX_RAIN_EMERGED.EXE</span>
        </div>
        <p className="text-white/60 mb-2 leading-relaxed text-[9px] sm:text-[10px]">
          Press <span className="text-[#00FF41] font-bold">ESC</span> / <span className="text-[#00FF41] font-bold">Ctrl+C</span> or type <span className="text-[#00FF41] font-bold">clear</span> / <span className="text-[#00FF41] font-bold">exit</span> to restore terminal.
        </p>
        <div className="flex items-center space-x-1 font-bold">
          <span className="text-green-500">&gt;</span>
          <span className="text-white bg-green-950/40 px-1 border border-green-500/20">{inputBuffer || " "}</span>
          <span className="animate-pulse bg-green-400 h-3 w-1.5 inline-block" />
        </div>
      </div>
    </div>
  );
}
