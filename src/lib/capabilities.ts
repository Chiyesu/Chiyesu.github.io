"use client";

import { useSyncExternalStore } from "react";

export type RenderTier = "none" | "low" | "high";

export interface Capabilities {
  ready: boolean;
  tier: RenderTier;
  reducedMotion: boolean;
  finePointer: boolean;
}

const SERVER: Capabilities = { ready: false, tier: "none", reducedMotion: false, finePointer: false };
const QUERIES = ["(prefers-reduced-motion: reduce)", "(hover: hover) and (pointer: fine)", "(max-width: 767px)"];

let cached: Capabilities | null = null;
let webgl: boolean | null = null;

function supportsWebGL() {
  if (webgl === null) {
    try {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      webgl = Boolean(context);
      context?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      webgl = false;
    }
  }
  return webgl;
}

function read(): Capabilities {
  if (cached) return cached;
  const [reduced, fine, small] = QUERIES.map((query) => window.matchMedia(query).matches);
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const constrained = small || memory <= 4 || navigator.hardwareConcurrency <= 4;
  const tier: RenderTier = !supportsWebGL() ? "none" : constrained ? "low" : "high";
  cached = { ready: true, tier, reducedMotion: reduced, finePointer: fine };
  return cached;
}

function subscribe(onChange: () => void) {
  const lists = QUERIES.map((query) => window.matchMedia(query));
  const handler = () => {
    cached = null;
    onChange();
  };
  lists.forEach((list) => list.addEventListener("change", handler));
  return () => lists.forEach((list) => list.removeEventListener("change", handler));
}

export function useCapabilities() {
  return useSyncExternalStore(subscribe, read, () => SERVER);
}
