"use client";

import dynamic from "next/dynamic";
import { useRef, type ReactNode } from "react";
import { useCapabilities } from "@/lib/capabilities";
import { useNearViewport } from "@/lib/loading";
import type { ModelName } from "@/three/modelNames";

const ViewStage = dynamic(() => import("@/three/ViewStage"), { ssr: false });

interface Object3DProps {
  name: ModelName;
  className?: string;
  /** Shown when WebGL is unavailable, and before the scene loads. */
  fallback?: ReactNode;
}

/** Reserves a slot in the layout. The shared canvas draws the named model inside it. */
export function Object3D({ name, className = "", fallback }: Object3DProps) {
  const { ready, tier, reducedMotion } = useCapabilities();
  const track = useRef<HTMLDivElement>(null);
  const near = useNearViewport(track);
  const live = ready && tier !== "none" && near;

  return (
    <div ref={track} aria-hidden className={`relative ${className}`}>
      {!live && fallback}
      {live && <ViewStage name={name} animated={!reducedMotion} track={track} />}
    </div>
  );
}
