import type { CourseShape } from "@/content/coursework";
import { seeded } from "./Dust";

interface SymbolStroke {
  /** SVG path data in the symbol's 24 by 24 grid. */
  d: string;
  /** Accent strokes glow signal blue. The rest are metal. */
  accent?: boolean;
}

interface SymbolDefinition {
  strokes: SymbolStroke[];
  /** Solid junctions, for example the circuit nodes on the brain. */
  nodes?: [number, number][];
}

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;

// Geometry matches the 2D symbols in CourseSymbol.tsx (Lucide icons, ISC licence).
const SYMBOLS: Record<CourseShape, SymbolDefinition> = {
  brain: {
    strokes: [
      { d: "M12 13h4", accent: true },
      { d: "M12 18h6a2 2 0 012 2v1", accent: true },
      { d: "M12 8h8", accent: true },
      { d: "M16 8V5a2 2 0 012-2", accent: true },
      { d: "M12 9a4.17 4.17 0 01-3 4" },
      { d: "M6 18a4 4 0 01-2-7.465" },
      { d: "M6.004 5.125a4 4 0 00-2.526 5.77" },
      { d: "M6.294 6.294A3 3 0 1112 5v13a4 4 0 11-7.967-.518" },
    ],
    nodes: [[16, 13], [18, 3], [20, 21], [20, 8]],
  },
  shield: {
    strokes: [
      { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" },
      { d: "m9 12 2 2 4-4", accent: true },
    ],
  },
  globe: {
    strokes: [
      { d: circle(12, 12, 10) },
      { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20", accent: true },
      { d: "M2 12h20", accent: true },
    ],
  },
  code: {
    strokes: [
      { d: "m18 16 4-4-4-4" },
      { d: "m6 8-4 4 4 4" },
      { d: "m14.5 4-5 16", accent: true },
    ],
  },
  bell: {
    strokes: [{ d: "M18 7V5a1 1 0 0 0-1-1H6.5a.5.5 0 0 0-.4.8l4.5 6a2 2 0 0 1 0 2.4l-4.5 6a.5.5 0 0 0 .4.8H17a1 1 0 0 0 1-1v-2", accent: true }],
  },
  surface: {
    strokes: [{ d: "M17 4.6c-1-1.7-4.3-1.9-4.9 1.4l-2.2 12c-.6 3.3-3.9 3.1-4.9 1.4", accent: true }],
  },
  tower: {
    strokes: [
      { d: "M4.9 16.1C1 12.2 1 5.8 4.9 1.9", accent: true },
      { d: "M7.8 4.7a6.14 6.14 0 0 0-.8 7.5", accent: true },
      { d: "M16.2 4.8c2 2 2.26 5.11.8 7.47", accent: true },
      { d: "M19.1 1.9a9.96 9.96 0 0 1 0 14.1", accent: true },
      { d: circle(12, 9, 2) },
      { d: "M9.5 18h5" },
      { d: "m8 22 4-11 4 11" },
    ],
  },
};

const WORLD_SCALE = 0.185;
const HALF_WIDTH = 0.1;
const HALF_DEPTH = 0.25;
const NODE_RADIUS = 0.24;
/** getPointAtLength is slow, so strokes are measured coarsely and interpolated when sampled. */
const TABLE_STEP = 0.3;

interface Traced {
  /** x, y, tangent x and tangent y per step, in world units. */
  table: Float32Array;
  steps: number;
  length: number;
  accent: number;
}

/** Measures each stroke once using the browser's own SVG geometry engine. */
function traceStrokes(strokes: SymbolStroke[], host: SVGSVGElement): Traced[] {
  return strokes.map(({ d, accent }) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    host.appendChild(path);
    const total = path.getTotalLength();
    const steps = Math.max(2, Math.ceil(total / TABLE_STEP));
    const table = new Float32Array(steps * 4);
    for (let i = 0; i < steps; i += 1) {
      const point = path.getPointAtLength((i / (steps - 1)) * total);
      table[i * 4] = (point.x - 12) * WORLD_SCALE;
      table[i * 4 + 1] = -(point.y - 12) * WORLD_SCALE;
    }
    for (let i = 0; i < steps; i += 1) {
      const ahead = Math.min(steps - 1, i + 1) * 4;
      const behind = Math.max(0, i - 1) * 4;
      const tx = table[ahead] - table[behind];
      const ty = table[ahead + 1] - table[behind + 1];
      const size = Math.hypot(tx, ty) || 1;
      table[i * 4 + 2] = tx / size;
      table[i * 4 + 3] = ty / size;
    }
    path.remove();
    return { table, steps, length: total, accent: accent ? 1 : 0 };
  });
}

/** Places one particle on the surface of the thick, extruded stroke. */
function sampleStroke(stroke: Traced, random: () => number, out: Float32Array, offset: number) {
  const along = random() * (stroke.steps - 1);
  const index = Math.min(stroke.steps - 2, Math.floor(along));
  const blend = along - index;
  const x = stroke.table[index * 4] + (stroke.table[index * 4 + 4] - stroke.table[index * 4]) * blend;
  const y = stroke.table[index * 4 + 1] + (stroke.table[index * 4 + 5] - stroke.table[index * 4 + 1]) * blend;
  const tx = stroke.table[index * 4 + 2];
  const ty = stroke.table[index * 4 + 3];
  const angle = random() * Math.PI * 2;
  // A squared-off section reads as a machined, solid bar rather than a thin tube.
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const edge = Math.max(Math.abs(c), Math.abs(s));
  const across = (c / edge) * HALF_WIDTH;
  const depth = (s / edge) * HALF_DEPTH;
  out[offset] = x - ty * across;
  out[offset + 1] = y + tx * across;
  out[offset + 2] = depth;
  out[offset + 3] = stroke.accent;
}

function sampleNode(node: [number, number], random: () => number, out: Float32Array, offset: number) {
  const y = random() * 2 - 1;
  const angle = random() * Math.PI * 2;
  const ring = Math.sqrt(1 - y * y);
  out[offset] = (node[0] - 12) * WORLD_SCALE + Math.cos(angle) * ring * NODE_RADIUS;
  out[offset + 1] = -(node[1] - 12) * WORLD_SCALE + y * NODE_RADIUS;
  out[offset + 2] = Math.sin(angle) * ring * NODE_RADIUS * 1.5;
  out[offset + 3] = 1;
}

const traces = new Map<CourseShape, Traced[]>();

/** Measures a symbol once. The page warms this cache while idle, so the section opens without a pause. */
export function traceShape(shape: CourseShape) {
  const cached = traces.get(shape);
  if (cached) return cached;
  const host = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = "position:absolute;width:0;height:0;visibility:hidden";
  document.body.appendChild(host);
  const traced = traceStrokes(SYMBOLS[shape].strokes, host);
  host.remove();
  traces.set(shape, traced);
  return traced;
}

/** Packs every symbol into one float texture: one column per particle, one row per symbol. */
export function buildTargets(shapes: CourseShape[], count: number) {
  const data = new Float32Array(count * shapes.length * 4);

  shapes.forEach((shape, row) => {
    const random = seeded(7919 + row * 613);
    const { nodes = [] } = SYMBOLS[shape];
    const traced = traceShape(shape);
    const totalLength = traced.reduce((sum, stroke) => sum + stroke.length, 0);
    const nodeCount = nodes.length > 0 ? Math.floor(count * 0.1) : 0;

    for (let i = 0; i < count; i += 1) {
      const offset = (row * count + i) * 4;
      if (i < nodeCount) {
        sampleNode(nodes[i % nodes.length], random, data, offset);
        continue;
      }
      let pick = random() * totalLength;
      let index = 0;
      while (pick > traced[index].length && index < traced.length - 1) pick -= traced[index++].length;
      sampleStroke(traced[index], random, data, offset);
    }
  });

  return data;
}
