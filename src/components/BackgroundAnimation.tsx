import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

export default function BackgroundAnimation({ isDarkMode = true }: { isDarkMode?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const nodes: Node[] = [];
    const maxNodes = Math.min(42, Math.floor((width * height) / 48000));

    for (let i = 0; i < maxNodes; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.6 + 0.1,
      });
    }

    let resizeTimeout: any;
    const handleResize = () => {
      if (!canvas) return;
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }, 150);
    };

    window.addEventListener("resize", handleResize, { passive: true });

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, width, height);

      const gridSize = 120;
      ctx.strokeStyle = isDarkMode ? "rgba(255, 255, 255, 0.012)" : "rgba(14, 116, 144, 0.055)";
      ctx.lineWidth = 1;

      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0) node.x = width;
        if (node.x > width) node.x = 0;
        if (node.y < 0) node.y = height;
        if (node.y > height) node.y = 0;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDarkMode
          ? `rgba(255, 255, 255, ${node.alpha * 0.7})`
          : `rgba(14, 116, 144, ${node.alpha * 0.45})`;
        ctx.fill();

        const maxDist = 150;
        const maxDistSq = maxDist * maxDist;
        for (let j = i + 1; j < nodes.length; j++) {
          const otherNode = nodes[j];
          const dx = node.x - otherNode.x;
          const dy = node.y - otherNode.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistSq) {
            const dist = Math.sqrt(distSq);
            const lineAlpha = (1 - dist / maxDist) * (isDarkMode ? 0.08 : 0.14) * Math.min(node.alpha, otherNode.alpha);
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(otherNode.x, otherNode.y);
            ctx.strokeStyle = isDarkMode
              ? `rgba(255, 255, 255, ${lineAlpha})`
              : `rgba(14, 116, 144, ${lineAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
      cancelAnimationFrame(animationId);
    };
  }, [isDarkMode]);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <canvas
        ref={canvasRef}
        id="bg-matrix-canvas"
        className="w-full h-full block opacity-70"
      />
      <div
        className={`absolute inset-0 bg-radial-vignette pointer-events-none transition-colors duration-500 ${
          isDarkMode
            ? "bg-[radial-gradient(ellipse_at_center,transparent_30%,#0A0A0A_90%)]"
            : "bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(226,232,240,0.8)_95%)]"
        }`}
      />
    </div>
  );
}
