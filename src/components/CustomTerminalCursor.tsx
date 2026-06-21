import { useEffect, useRef, useState } from "react";

export default function CustomTerminalCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Use refs to avoid stale closures in the high-frequency animation loop
  const isHoveredRef = useRef(false);
  const isVisibleRef = useRef(false);

  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  useEffect(() => {
    isVisibleRef.current = isVisible;
  }, [isVisible]);

  useEffect(() => {
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isVisibleRef.current) {
        setIsVisible(true);
      }
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    const onMouseEnter = () => {
      setIsVisible(true);
    };

    // Advanced dynamic trigger to track elements that warrant custom cursor scale/glow changes
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isActionable =
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.tagName === "INPUT" ||
        target.tagName === "SELECT" ||
        target.tagName === "TEXTAREA" ||
        target.closest("a") ||
        target.closest("button") ||
        target.closest("input") ||
        target.closest(".cursor-pointer") ||
        target.classList.contains("cursor-pointer") ||
        target.closest(".cyber-btn") ||
        target.closest(".interactive-node") ||
        window.getComputedStyle(target).cursor === "pointer";

      setIsHovered(!!isActionable);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    // Optimized linear interpolation coordinate updates (GPU Hardware accelerated translate3d)
    let animFrameId: number;
    const updatePosition = () => {
      const ease = 0.22; // Highly polished trailing motion interpolation
      currentX += (mouseX - currentX) * ease;
      currentY += (mouseY - currentY) * ease;

      const cursor = cursorRef.current;
      if (cursor) {
        cursor.style.transform = `translate3d(${currentX - 5}px, ${currentY - 3.5}px, 0)`;
      }
      animFrameId = requestAnimationFrame(updatePosition);
    };

    animFrameId = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      cancelAnimationFrame(animFrameId);
    };
  }, []); // Run exactly once on mount, no re-registers needed

  return (
    <div
      ref={cursorRef}
      className={`fixed top-0 left-0 pointer-events-none z-[999999] select-none transition-all duration-150 ease-out origin-top-left ${
        isVisible ? "opacity-100" : "opacity-0"
      } ${isHovered ? "scale-115" : "scale-100"}`}
      style={{
        width: "28px",
        height: "28px",
        willChange: "transform",
      }}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)]"
      >
        {/* Outer Kali Style sharp contour frame */}
        <path
          d="M4.5 3v16.5l4.5-4.5 4.2 7.8 2.5-1.3-4.2-7.8h5.5L4.5 3z"
          fill={isHovered ? "rgba(0, 240, 255, 0.25)" : "#0c0f16"}
          stroke={isHovered ? "#00f0ff" : "#5a657a"}
          strokeWidth="1.5"
          strokeLinejoin="miter"
          className="transition-colors duration-200"
        />
        {/* Active glowing core focal dot to guide targeting */}
        {isHovered && (
          <circle
            cx="4.5"
            cy="3"
            r="1.5"
            fill="#00f0ff"
            className="animate-ping"
          />
        )}
      </svg>
    </div>
  );
}
