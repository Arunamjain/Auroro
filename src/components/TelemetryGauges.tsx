import { useEffect, useState } from "react";

export default function TelemetryGauges() {
  const [networkWave, setNetworkWave] = useState<number[]>([12, 18, 15, 23, 10, 16, 29, 32, 28, 25, 41, 30, 24]);

  useEffect(() => {
    const metricTimer = setInterval(() => {
      setNetworkWave((prev) => {
        const nextVal = Math.max(5, Math.min(50, prev[prev.length - 1] + (Math.floor(Math.random() * 15) - 7)));
        const sliced = prev.slice(1);
        return [...sliced, nextVal];
      });
    }, 1200);

    return () => {
      clearInterval(metricTimer);
    };
  }, []);

  const svgWidth = 240;
  const svgHeight = 40;
  const chartPoints = networkWave
    .map((val, idx) => {
      const x = (idx / (networkWave.length - 1)) * svgWidth;
      const y = svgHeight - (val / 55) * svgHeight;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="relative flex flex-col justify-between font-mono p-1">
      {/* Corner Bracket Elements */}
      <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[var(--theme-accent)]/60" />
      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[var(--theme-accent)]/60" />
      <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[var(--theme-accent)]/60" />
      <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[var(--theme-accent)]/60" />

      {/* Network Traffic Live Waveform Graph */}
      <div>
        <div className="flex justify-between text-[9px] text-[var(--theme-text-dim)] mb-1.5 select-none">
          <span className="font-bold">NET_TRAFFIC_WAVE</span>
          <span className="text-[var(--theme-accent)] uppercase font-bold">AURORA_SUITE_GATEWAY</span>
        </div>

        {/* Render animated SVG Wave */}
        <div className="relative h-12 w-full bg-[var(--theme-surface-subtle)] border border-[var(--theme-divider)] rounded-none p-1 flex items-end">
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
            <defs>
              <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--theme-accent)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--theme-bg)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={`M 0,${svgHeight} L ${chartPoints} L ${svgWidth},${svgHeight} Z`}
              fill="url(#areaGrad)"
            />
            <polyline
              fill="none"
              stroke="var(--theme-accent)"
              strokeWidth="1.4"
              points={chartPoints}
              className="drop-shadow-[0_0_4px_rgba(6,182,212,0.5)]"
              style={{ transition: "all 0.5s ease" }}
            />
          </svg>
        </div>

        <div className="flex justify-between text-[8px] text-[var(--theme-text-faint)] mt-1 select-none">
          <span>T-24S</span>
          <span>CURR_TX: 84.2 kb/s</span>
          <span>T-0S</span>
        </div>
      </div>
    </div>
  );
}
