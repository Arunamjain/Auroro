import { useEffect, useRef, useMemo } from "react";

interface Point3D {
  x: number;
  y: number;
  z: number;
  isLand: boolean;
  lat: number;
  lon: number;
}

export default function DigitalGlobe({ isDarkMode = true, scrollProgress = 0 }: { isDarkMode?: boolean; scrollProgress?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pre-generate globe wireframe coordinates for high performance
  const globePoints = useMemo(() => {
    const points: Point3D[] = [];
    const latSteps = 36; // Number of horizontal rings
    const lonSteps = 72; // Points per ring
    const radius = 1;

    // Continental ranges with jagged noise limits
    const checkLand = (lat: number, lon: number): boolean => {
      const ranges = [
        // Africa
        { latMin: -35, latMax: 35, lonMin: -18, lonMax: 50 },
        // Eurasia
        { latMin: 10, latMax: 78, lonMin: -10, lonMax: 145 },
        // North America
        { latMin: 15, latMax: 72, lonMin: -168, lonMax: -52 },
        // South America
        { latMin: -55, latMax: 12, lonMin: -82, lonMax: -34 },
        // Australia
        { latMin: -44, latMax: -10, lonMin: 112, lonMax: 154 }
      ];

      // Add coherent noise to shape boundaries
      const noise = Math.sin(lat * 0.15) * Math.cos(lon * 0.15) * 6;
      const shLat = lat + noise;
      const shLon = lon + noise;

      return ranges.some(
        (r) => shLat >= r.latMin && shLat <= r.latMax && shLon >= r.lonMin && shLon <= r.lonMax
      );
    };

    // Calculate 3D points
    for (let i = 0; i <= latSteps; i++) {
      const latAngle = (i * Math.PI) / latSteps - Math.PI / 2; // -pi/2 to pi/2
      const y = Math.sin(latAngle) * radius;
      const ringRadius = Math.cos(latAngle) * radius;

      // Approximate latitude in degrees
      const latDeg = (latAngle * 180) / Math.PI;

      for (let j = 0; j < lonSteps; j++) {
        const lonAngle = (j * 2 * Math.PI) / lonSteps - Math.PI; // -pi to pi
        const x = Math.cos(lonAngle) * ringRadius;
        const z = Math.sin(lonAngle) * ringRadius;

        // Approximate longitude in degrees
        const lonDeg = (lonAngle * 180) / Math.PI;

        const isLandPoint = checkLand(latDeg, lonDeg);

        points.push({
          x,
          y,
          z,
          isLand: isLandPoint,
          lat: latDeg,
          lon: lonDeg
        });
      }
    }

    return points;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = 440);
    let height = (canvas.height = 440);

    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      width = canvas.width = rect.width * (window.devicePixelRatio || 1);
      height = canvas.height = rect.height * (window.devicePixelRatio || 1);
    };

    window.addEventListener("resize", handleResize, { passive: true });
    // Trigger initial resizing
    handleResize();

    let baseRotation = 0;
    let rotationX = 0.25; // Tilt the globe slightly forwards

    const render = () => {
      if (!ctx || !canvas) return;

      // Light-mode or Dark-mode background
      ctx.clearRect(0, 0, width, height);

      // Sphere viewport boundaries centering
      const minDimension = Math.min(width, height);
      const center = { x: width / 2, y: height / 2 };
      const scale = minDimension * 0.42;

      // Draw subtle background globe grid circle outline
      ctx.beginPath();
      ctx.arc(center.x, center.y, scale, 0, Math.PI * 2);
      ctx.fillStyle = isDarkMode ? "rgba(4, 15, 10, 0.5)" : "rgba(220, 235, 226, 0.4)";
      ctx.fill();
      ctx.strokeStyle = isDarkMode ? "rgba(52, 211, 153, 0.15)" : "rgba(4, 120, 87, 0.18)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Accumulate 3D coordinates system rotation
      baseRotation += 0.003; // Gentle idle progress spin

      const activeRotationY = baseRotation + scrollProgress * Math.PI * 4.5;

      // Group segments of consecutive land points to draw line segments
      // We process points of the same latitude ring together
      const sinY = Math.sin(activeRotationY);
      const cosY = Math.cos(activeRotationY);
      const sinX = Math.sin(rotationX);
      const cosX = Math.cos(rotationX);

      // Projected visible points bucketed by latitude ring to draw lines
      const projectedRings: Record<number, { px: number; py: number; isLand: boolean }[]> = {};

      globePoints.forEach((point) => {
        // Apply Y-rotation (horizontal rotation)
        let x1 = point.x * cosY - point.z * sinY;
        let z1 = point.x * sinY + point.z * cosY;

        // Apply X-rotation (vertical tilt)
        let y2 = point.y * cosX - z1 * sinX;
        let z2 = point.y * sinX + z1 * cosX;

        // Only render coordinates facing the camera (z2 > 0)
        if (z2 > 0) {
          // Perspective scale factor
          const perspective = (1 + z2 * 0.12);
          const px = center.x + x1 * scale * perspective;
          const py = center.y + y2 * scale * perspective;

          const latKey = Math.round(point.lat);
          if (!projectedRings[latKey]) {
            projectedRings[latKey] = [];
          }
          projectedRings[latKey].push({ px, py, isLand: point.isLand });
        }
      });

      // Style setups
      const primaryColor = isDarkMode ? "#06B6D4" : "#0E7490";
      const cyanGlow = isDarkMode ? "rgba(6, 182, 212, 0.4)" : "rgba(14, 116, 144, 0.15)";
      const secondaryColor = isDarkMode ? "rgba(6, 182, 212, 0.15)" : "rgba(14, 116, 144, 0.12)";

      // Draw horizontal bands and landmass segments (Horizontal lines in image)
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = primaryColor;

      Object.keys(projectedRings).forEach((latStr) => {
        const ring = projectedRings[Number(latStr)];
        // Sort points from left to right along x coordinate
        ring.sort((a, b) => a.px - b.px);

        // Draw segments of adjacent land points
        let inSegment = false;
        let segmentStart = { x: 0, y: 0 };

        for (let idx = 0; idx < ring.length; idx++) {
          const pt = ring[idx];
          if (pt.isLand) {
            if (!inSegment) {
              inSegment = true;
              segmentStart = { x: pt.px, y: pt.py };
            } else if (idx === ring.length - 1 || Math.abs(pt.px - ring[idx - 1].px) > 12) {
              // End segment and draw
              ctx.beginPath();
              ctx.moveTo(segmentStart.x, segmentStart.y);
              ctx.lineTo(pt.px, pt.py);
              ctx.stroke();
              inSegment = false;
            }
          } else {
            if (inSegment) {
              ctx.beginPath();
              ctx.moveTo(segmentStart.x, segmentStart.y);
              ctx.lineTo(ring[idx - 1].px, ring[idx - 1].py);
              ctx.stroke();
              inSegment = false;
            }

            // Draw a subtle background dotted network node
            if (idx % 3 === 0) {
              ctx.fillStyle = secondaryColor;
              ctx.beginPath();
              ctx.arc(pt.px, pt.py, 1, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      });

      // Draw custom ASCII plus symbols on top of the globe's main landmasses
      ctx.font = "8px 'Fira Code', 'Courier New', monospace";
      ctx.fillStyle = primaryColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      Object.keys(projectedRings).forEach((latStr) => {
        const ring = projectedRings[Number(latStr)];
        ring.forEach((pt, idx) => {
          if (pt.isLand && idx % 4 === 0) {
            ctx.shadowBlur = isDarkMode ? 4 : 0;
            ctx.shadowColor = cyanGlow;
            ctx.fillText("+", pt.px, pt.py);
            ctx.shadowBlur = 0;
          }
        });
      });

      // Draw glowing pulse ring around the entire globe to make it look 3D and holographic
      ctx.beginPath();
      ctx.arc(center.x, center.y, scale * 1.05, 0, Math.PI * 2);
      ctx.strokeStyle = isDarkMode ? "rgba(6, 182, 212, 0.08)" : "rgba(14, 116, 144, 0.05)";
      ctx.lineWidth = 4;
      ctx.stroke();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [globePoints, isDarkMode, scrollProgress]);

  return (
    <div className="relative w-full max-w-[440px] aspect-square mx-auto flex items-center justify-center select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full max-w-full drop-shadow-[0_0_20px_rgba(52,211,153,0.1)] transition-transform duration-500 ease-out hover:scale-105"
        style={{ imageRendering: "auto" }}
      />
    </div>
  );
}
