import type { CourseShape } from "@/content/coursework";
import { seeded } from "./Dust";

/** x, y, z and accent (0 is metal, 1 is signal blue). */
type Point = [number, number, number, number];
type Random = () => number;
type Vec2 = [number, number];
type Sampler = (fraction: number, random: Random) => Point;

const PI = Math.PI;
const TAU = PI * 2;
const between = (random: Random, low: number, high: number) => low + random() * (high - low);

function onStrokes(strokes: { from: Vec2; to: Vec2; accent: number }[], random: Random, thickness: number): Point {
  const lengths = strokes.map(({ from, to }) => Math.hypot(to[0] - from[0], to[1] - from[1]));
  let pick = random() * lengths.reduce((sum, length) => sum + length, 0);
  let index = 0;
  while (pick > lengths[index] && index < strokes.length - 1) pick -= lengths[index++];
  const { from, to, accent } = strokes[index];
  const t = random();
  return [
    from[0] + (to[0] - from[0]) * t + between(random, -thickness, thickness),
    from[1] + (to[1] - from[1]) * t + between(random, -thickness, thickness),
    between(random, -thickness * 1.3, thickness * 1.3),
    accent,
  ];
}

function direction(random: Random): [number, number, number] {
  const y = between(random, -1, 1);
  const angle = random() * TAU;
  const ring = Math.sqrt(1 - y * y);
  return [Math.cos(angle) * ring, y, Math.sin(angle) * ring];
}

/** A brain in profile: folded cerebrum, cerebellum, brain stem and a bright core of synapses. */
const brain: Sampler = (fraction, random) => {
  if (fraction > 0.87) {
    const [dx, dy, dz] = direction(random);
    const radius = 0.2 + random() * 0.72;
    return [dx * radius * 1.65 + 0.12, dy * radius * 1.0 + 0.42, dz * radius * 0.95, 1];
  }
  if (fraction > 0.76) {
    const [dx, dy, dz] = direction(random);
    const ridges = 1 + 0.07 * Math.sin(dy * 24);
    return [-1.2 + dx * 0.72 * ridges, -0.72 + dy * 0.48 * ridges, dz * 0.82 * ridges, 0];
  }
  if (fraction > 0.71) {
    const t = random();
    const angle = random() * TAU;
    const radius = 0.2 - t * 0.05;
    return [-0.42 + t * 0.2 + Math.cos(angle) * radius, -0.72 - t * 1.25, Math.sin(angle) * radius, 0];
  }
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const [dx, dy, dz] = direction(random);
    const fold = Math.sin(dx * 8.5 + Math.sin(dy * 5) * 1.7) * Math.cos(dy * 8 + dx * 2.6 + dz * 2.4);
    if (fold < -0.2 && random() < 0.86) continue;
    const swell = 1 + fold * 0.075;
    const underside = dy < 0 ? 0.68 : 1;
    const hemisphere = dz >= 0 ? 0.09 : -0.09;
    return [dx * 2.08 * swell + 0.12, dy * 1.5 * underside * swell + 0.42, dz * 1.42 * swell + hemisphere, 0];
  }
  return [0.12, 1.9, 0, 0];
};

const shieldWidth = (y: number) => (y >= 0.45 ? 1.5 : 1.5 * Math.sqrt(Math.max(0, 1 - ((0.45 - y) / 2.45) ** 2)));
const shieldTop = (x: number) => 1.72 - 0.28 * (Math.abs(x) / 1.5) ** 2;
const inKeyhole = (x: number, y: number) =>
  Math.hypot(x, y - 0.42) < 0.38 || (y < 0.3 && y > -0.78 && Math.abs(x) < 0.13 + (0.3 - y) * 0.13);

/** A curved shield with a keyhole cut through it. */
const shield: Sampler = (fraction, random) => {
  const depth = (x: number, y: number) => 0.34 * (1 - (x / 1.5) ** 2) * (1 - ((y + 0.2) / 2.3) ** 2);
  if (fraction < 0.2) {
    const side = random() > 0.5 ? 1 : -1;
    if (random() < 0.24) {
      const x = between(random, -1.5, 1.5);
      return [x, shieldTop(x) + between(random, -0.04, 0.04), between(random, -0.08, 0.08), 1];
    }
    const y = between(random, -2, 1.5);
    return [side * shieldWidth(y) + between(random, -0.04, 0.04), y, between(random, -0.08, 0.08), 1];
  }
  if (fraction < 0.32) {
    if (random() < 0.56) {
      const angle = between(random, -0.75, PI + 0.75);
      return [Math.cos(angle) * 0.4, 0.42 + Math.sin(angle) * 0.4, 0.34, 1];
    }
    const y = between(random, -0.8, 0.14);
    const side = random() > 0.5 ? 1 : -1;
    return [side * (0.15 + (0.3 - y) * 0.13), y, 0.34, 1];
  }
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const x = between(random, -1.5, 1.5);
    const y = between(random, -2.0, 1.72);
    if (Math.abs(x) <= shieldWidth(y) && y <= shieldTop(x) && !inKeyhole(x, y)) {
      return [x, y, (random() > 0.5 ? 1 : -0.35) * depth(x, y), 0];
    }
  }
  return [0, -1.2, 0.2, 0];
};

const CITIES: [number, number][] = [[0.7, 0.3], [0.2, 2.1], [-0.5, 1.2], [0.9, 4.2], [-0.2, 5.3], [0.4, 3.2], [-0.8, 2.8]];
const onSphere = (lat: number, lon: number, radius: number): [number, number, number] => [
  Math.cos(lat) * Math.sin(lon) * radius,
  Math.sin(lat) * radius,
  Math.cos(lat) * Math.cos(lon) * radius,
];

/** A wire globe with data arcs travelling between nodes. */
const globe: Sampler = (fraction, random) => {
  const radius = 1.72;
  if (fraction < 0.36) {
    const lat = ((Math.floor(random() * 9) - 4) / 5) * (PI / 2);
    return [...onSphere(lat, random() * TAU, radius), 0];
  }
  if (fraction < 0.68) {
    const lon = (Math.floor(random() * 12) / 12) * TAU;
    return [...onSphere(between(random, -PI / 2, PI / 2), lon, radius), 0];
  }
  const a = Math.floor(random() * CITIES.length);
  const b = (a + 1 + Math.floor(random() * 3)) % CITIES.length;
  if (fraction > 0.93) {
    const [lat, lon] = CITIES[a];
    const [x, y, z] = onSphere(lat, lon, radius * 1.02);
    const spread = 0.09;
    return [x + between(random, -spread, spread), y + between(random, -spread, spread), z + between(random, -spread, spread), 1];
  }
  const t = random();
  const [x1, y1, z1] = onSphere(CITIES[a][0], CITIES[a][1], 1);
  const [x2, y2, z2] = onSphere(CITIES[b][0], CITIES[b][1], 1);
  const mx = x1 + (x2 - x1) * t;
  const my = y1 + (y2 - y1) * t;
  const mz = z1 + (z2 - z1) * t;
  const length = Math.hypot(mx, my, mz) || 1;
  const lift = radius * (1 + Math.sin(PI * t) * 0.3);
  return [(mx / length) * lift, (my / length) * lift, (mz / length) * lift, 1];
};

const CODE_STROKES = [
  { from: [-0.82, 1.15] as Vec2, to: [-2.05, 0] as Vec2, accent: 0 },
  { from: [-2.05, 0] as Vec2, to: [-0.82, -1.15] as Vec2, accent: 0 },
  { from: [0.5, 1.6] as Vec2, to: [-0.5, -1.6] as Vec2, accent: 1 },
  { from: [0.82, 1.15] as Vec2, to: [2.05, 0] as Vec2, accent: 0 },
  { from: [2.05, 0] as Vec2, to: [0.82, -1.15] as Vec2, accent: 0 },
];

/** The universal symbol of code. */
const code: Sampler = (_, random) => onStrokes(CODE_STROKES, random, 0.15);

/** A 3D histogram rising into a bell curve. */
const bell: Sampler = (fraction, random) => {
  const gaussian = (x: number, z: number) => 3.25 * Math.exp(-(x * x) / 1.15) * Math.exp(-(z * z) / 1.5);
  if (fraction > 0.84) {
    const x = between(random, -2.4, 2.4);
    return [x, -1.72 + gaussian(x, 0) + 0.2, between(random, -0.03, 0.03), 1];
  }
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const column = Math.floor(random() * 13) - 6;
    const row = Math.floor(random() * 7) - 3;
    const cx = column * 0.38;
    const cz = row * 0.42;
    const height = gaussian(cx, cz) + 0.06;
    if (random() > (height + 0.28) / 3.5) continue;
    const onTop = random() < 0.32;
    const x = cx + between(random, -0.14, 0.14);
    const z = cz + between(random, -0.15, 0.15);
    const y = onTop ? height : random() * height;
    return [x, y - 1.72, z, 0];
  }
  return [0, -1.72, 0, 0];
};

/** A rippling function surface beneath an integral sign. */
const surface: Sampler = (fraction, random) => {
  if (fraction > 0.8) {
    const part = random();
    const thickness = 0.055;
    let x = 0;
    let y = 0;
    if (part < 0.68) {
      const t = between(random, -1, 1);
      x = t * 0.17;
      y = t * 1.16;
    } else if (part < 0.84) {
      const angle = random() * PI;
      x = 0.4 + Math.cos(angle) * 0.23;
      y = 1.16 + Math.sin(angle) * 0.23;
    } else {
      const angle = PI + random() * PI;
      x = -0.4 + Math.cos(angle) * 0.23;
      y = -1.16 + Math.sin(angle) * 0.23;
    }
    return [x + between(random, -thickness, thickness), y + 0.72 + between(random, -thickness, thickness), between(random, -thickness, thickness), 1];
  }
  const radius = 2.3 * Math.sqrt(random());
  const angle = random() * TAU;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  return [x, -1.48 + Math.cos(radius * 3.4) * Math.exp(-radius * 0.38) * 0.42, z, 0];
};

const HEX_CENTRES: Vec2[] = [[0, 0]];
for (let ring = 1; ring <= 2; ring += 1) {
  for (let i = 0; i < ring * 6; i += 1) {
    const corner = Math.floor(i / ring);
    const a = (corner / 6) * TAU;
    const b = ((corner + 1) / 6) * TAU;
    const t = (i % ring) / ring;
    HEX_CENTRES.push([(Math.cos(a) * (1 - t) + Math.cos(b) * t) * ring * 0.92, (Math.sin(a) * (1 - t) + Math.sin(b) * t) * ring * 0.92]);
  }
}

/** A lattice mast broadcasting signal arcs over a hexagonal cell grid. */
const tower: Sampler = (fraction, random) => {
  if (fraction < 0.38) {
    const leg = Math.floor(random() * 4);
    const sx = leg < 2 ? 1 : -1;
    const sz = leg % 2 ? 1 : -1;
    const t = random();
    const spread = 0.58 * (1 - t) + 0.05;
    const y = -2 + t * 3.5;
    if (random() < 0.42) {
      const level = Math.floor(t * 8) / 8;
      const levelSpread = 0.58 * (1 - level) + 0.05;
      const u = between(random, -1, 1);
      const along = random() > 0.5;
      return [along ? u * levelSpread : sx * levelSpread, -2 + level * 3.5, along ? sz * levelSpread : u * levelSpread, 0];
    }
    return [sx * spread, y, sz * spread, 0];
  }
  if (fraction < 0.72) {
    const wave = Math.floor(random() * 4);
    const radius = 0.62 + wave * 0.42;
    const side = random() > 0.5 ? 0 : PI;
    const angle = side + between(random, -0.72, 0.72);
    const jitter = 0.022;
    return [Math.cos(angle) * radius + between(random, -jitter, jitter), 1.42 + Math.sin(angle) * radius + between(random, -jitter, jitter), between(random, -0.05, 0.05), 1];
  }
  const [cx, cz] = HEX_CENTRES[Math.floor(random() * HEX_CENTRES.length)];
  const edge = Math.floor(random() * 6);
  const t = random();
  const a = (edge / 6) * TAU + PI / 6;
  const b = ((edge + 1) / 6) * TAU + PI / 6;
  const size = 0.5;
  return [cx + (Math.cos(a) * (1 - t) + Math.cos(b) * t) * size, -2.04, cz + (Math.sin(a) * (1 - t) + Math.sin(b) * t) * size, 0.25];
};

const samplers: Record<CourseShape, Sampler> = { brain, shield, globe, code, bell, surface, tower };

/** Packs every shape into one float texture: one column per particle, one row per shape. */
export function buildTargets(shapes: CourseShape[], count: number) {
  const data = new Float32Array(count * shapes.length * 4);
  shapes.forEach((shape, row) => {
    const random = seeded(7919 + row * 613);
    for (let i = 0; i < count; i += 1) {
      const point = samplers[shape](i / count, random);
      data.set(point, (row * count + i) * 4);
    }
  });
  return data;
}
