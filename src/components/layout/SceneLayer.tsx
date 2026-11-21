"use client";

import dynamic from "next/dynamic";
import { useCapabilities } from "@/lib/capabilities";

const SceneRoot = dynamic(() => import("@/three/SceneRoot"), { ssr: false });

export function SceneLayer() {
  const { ready, tier } = useCapabilities();
  if (!ready || tier === "none") return null;
  return <SceneRoot tier={tier} />;
}
