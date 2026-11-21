import { BrainCircuit, CodeXml, Globe, RadioTower, ShieldCheck, Sigma } from "lucide-react";
import type { ComponentType } from "react";
import type { CourseShape } from "@/content/coursework";

interface SymbolProps {
  className?: string;
  strokeWidth?: number;
  "aria-hidden"?: boolean;
}

/** Lucide has no integral sign, so this one is drawn to match its stroke style. */
function Integral({ className, strokeWidth = 2, ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M17 4.6c-1-1.7-4.3-1.9-4.9 1.4l-2.2 12c-.6 3.3-3.9 3.1-4.9 1.4" />
    </svg>
  );
}

const symbols: Record<CourseShape, ComponentType<SymbolProps>> = {
  brain: BrainCircuit,
  shield: ShieldCheck,
  globe: Globe,
  code: CodeXml,
  bell: Sigma,
  surface: Integral,
  tower: RadioTower,
};

export function CourseSymbol({ shape, className }: { shape: CourseShape; className?: string }) {
  const Symbol = symbols[shape];
  return <Symbol aria-hidden className={className} strokeWidth={1.6} />;
}
