import type { ReactNode } from "react";
import type { ProjectMotif } from "@/content/types";

const LINE = "rgb(255 255 255 / 0.2)";
const FAINT = "rgb(255 255 255 / 0.07)";
const SIGNAL = "#7fd3e8";
const range = (length: number) => Array.from({ length }, (_, index) => index);

/** Learning: a device with layered content planes. */
function Learning() {
  return (
    <g fill="none">
      {range(5).map((i) => (
        <rect key={i} x={250 + i * 44} y={92 - i * 12} width="176" height="356" rx="22" stroke={i === 0 ? SIGNAL : LINE} strokeOpacity={1 - i * 0.17} fill="#0f1115" />
      )).reverse()}
      <rect x="268" y="124" width="140" height="82" fill="rgb(127 211 232 / 0.14)" stroke={SIGNAL} strokeWidth="0.8" />
      <path d="M329 151 l24 14 -24 14z" fill={SIGNAL} />
      {range(6).map((i) => <rect key={i} x="268" y={226 + i * 30} width={i % 2 ? 96 : 140} height="8" fill={i === 1 ? SIGNAL : LINE} />)}
    </g>
  );
}

/** Agents: an orchestrator coordinating specialised nodes. */
function Agents() {
  const nodes = range(7).map((i) => {
    const angle = (i / 7) * Math.PI * 2 - Math.PI / 2;
    return { x: 400 + Math.cos(angle) * 250, y: 270 + Math.sin(angle) * 178 };
  });
  return (
    <g fill="none">
      <ellipse cx="400" cy="270" rx="250" ry="178" stroke={FAINT} />
      <ellipse cx="400" cy="270" rx="130" ry="92" stroke={FAINT} strokeDasharray="3 7" />
      {nodes.map((node, i) => <line key={i} x1="400" y1="270" x2={node.x} y2={node.y} stroke={i === 2 ? SIGNAL : LINE} strokeWidth={i === 2 ? 1.2 : 0.7} />)}
      {nodes.map((node, i) => <circle key={i} cx={node.x} cy={node.y} r={i === 2 ? 15 : 10} fill="#0f1115" stroke={i === 2 ? SIGNAL : LINE} />)}
      <circle cx="400" cy="270" r="46" fill="#0f1115" stroke={SIGNAL} />
      <circle cx="400" cy="270" r="13" fill={SIGNAL} />
    </g>
  );
}

/** Pipeline: source streams divided into segmented renditions. */
function Pipeline() {
  return (
    <g fill="none">
      {range(4).map((i) => <path key={i} d={`M60 ${270 + (i - 1.5) * 26} C190 ${270 + (i - 1.5) * 26} 190 270 300 270`} stroke={LINE} />)}
      <rect x="300" y="214" width="112" height="112" fill="#0f1115" stroke={SIGNAL} />
      <path d="M340 245 l40 25 -40 25z" fill={SIGNAL} />
      {range(5).map((row) => {
        const y = 110 + row * 80;
        return (
          <g key={row}>
            <path d={`M412 270 C470 270 450 ${y} 510 ${y}`} stroke={row === 1 ? SIGNAL : LINE} />
            {range(7 - row).map((c) => {
              const width = 240 / (7 - row);
              return <rect key={c} x={514 + c * width} y={y - 11} width={width - 4} height="22" fill={row === 1 ? "rgb(127 211 232 / 0.3)" : "rgb(255 255 255 / 0.06)"} stroke={row === 1 ? SIGNAL : LINE} strokeWidth="0.6" />;
            })}
          </g>
        );
      })}
    </g>
  );
}

/** Ledger: a structured planning grid. Bars are decorative and represent no data. */
function Ledger() {
  const heights = [3, 5, 2, 6, 4, 7, 3, 5];
  return (
    <g fill="none">
      {range(9).map((i) => <line key={`v${i}`} x1={120 + i * 70} y1="80" x2={120 + i * 70} y2="460" stroke={FAINT} />)}
      {range(7).map((i) => <line key={`h${i}`} x1="120" y1={80 + i * 63.3} x2="680" y2={80 + i * 63.3} stroke={FAINT} />)}
      {heights.map((height, i) => (
        <rect key={i} x={132 + i * 70} y={460 - height * 48} width="46" height={height * 48} fill={i === 5 ? "rgb(127 211 232 / 0.26)" : "rgb(255 255 255 / 0.05)"} stroke={i === 5 ? SIGNAL : LINE} strokeWidth="0.8" />
      ))}
      <path d="M155 340 L225 268 L295 372 L365 220 L435 300 L505 124 L575 320 L645 228" stroke={SIGNAL} strokeWidth="1" />
    </g>
  );
}

/** Commerce: a parcel on a delivery route. */
function Commerce() {
  return (
    <g fill="none">
      <ellipse cx="400" cy="290" rx="290" ry="120" stroke={LINE} />
      <path d="M400 150 L520 210 L400 270 L280 210Z" fill="rgb(127 211 232 / 0.14)" stroke={SIGNAL} />
      <path d="M280 210 V340 L400 400 V270 M520 210 V340 L400 400" fill="#0f1115" stroke={SIGNAL} />
      <path d="M340 180 L460 240 V275" stroke={SIGNAL} strokeWidth="2" />
      {range(8).map((i) => {
        const angle = (i / 8) * Math.PI * 2;
        return <rect key={i} x={392 + Math.cos(angle) * 290} y={282 + Math.sin(angle) * 120} width="16" height="16" fill="#0f1115" stroke={i === 1 ? SIGNAL : LINE} />;
      })}
    </g>
  );
}

const motifs: Record<ProjectMotif, () => ReactNode> = {
  commerce: Commerce,
  learning: Learning,
  agents: Agents,
  pipeline: Pipeline,
  ledger: Ledger,
};

export function ProjectVisual({ motif }: { motif: ProjectMotif }) {
  const Motif = motifs[motif];
  return (
    <svg aria-hidden viewBox="0 0 800 540" preserveAspectRatio="xMidYMid meet" className="h-full w-full bg-[radial-gradient(ellipse_at_50%_45%,#1a1f27_0%,#0d0f13_72%)]">
      <Motif />
    </svg>
  );
}
