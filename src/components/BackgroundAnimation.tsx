import { useEffect, useRef, useState } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

export default function BackgroundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Generate telemetry coordinates / floating background node stars - optimized density for clarity and performance
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

    // Particle rendering loop
    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, width, height);

      // Render subtle glowing digital grid intersection nodes
      const gridSize = 120;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.012)";
      ctx.lineWidth = 1;

      // Draw horizontal lines
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw vertical lines
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Draw particles (floating network nodes representing telemetry streams)
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        
        // Update positions
        node.x += node.vx;
        node.y += node.vy;

        // Wrap around screen boundaries
        if (node.x < 0) node.x = width;
        if (node.x > width) node.x = 0;
        if (node.y < 0) node.y = height;
        if (node.y > height) node.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${node.alpha * 0.7})`;
        ctx.fill();

        // Connect particles within proximity threshold (creates a neuronal/sensor mesh) using squared distance to avoid Math.sqrt where possible
        const maxDist = 150;
        const maxDistSq = maxDist * maxDist;
        for (let j = i + 1; j < nodes.length; j++) {
          const otherNode = nodes[j];
          const dx = node.x - otherNode.x;
          const dy = node.y - otherNode.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistSq) {
            const dist = Math.sqrt(distSq);
            const lineAlpha = (1 - dist / maxDist) * 0.08 * Math.min(node.alpha, otherNode.alpha);
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(otherNode.x, otherNode.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${lineAlpha})`;
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
  }, []);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {/* 
        DEVELOPER / MODIFICATION FRIENDLY INSTRUCTIONS:
        This BackgroundAnimation is modularly scoped. To transition to a 
        full 3D background using React Three Fiber or Three.js in the future:
        
        1. Run: npx install_applet_package @react-three/fiber @react-three/drei three @types/three
        2. Replace this Canvas with your 3D Scene e.g.:
           <Canvas camera={{ position: [0, 0, 5] }}>
             <color attach="background" args={["#0A0A0A"]} />
             <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
             <Animated3DModels />
           </Canvas>
      */}
      <canvas
        ref={canvasRef}
        id="bg-matrix-canvas"
        className="w-full h-full block opacity-70"
      />
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_30%,#0A0A0A_90%)]" />
    </div>
  );
}
