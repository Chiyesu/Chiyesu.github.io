"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { ACESFilmicToneMapping } from "three";
import type { RenderTier } from "@/lib/capabilities";
import { Dust } from "./Dust";
import { Sculpture } from "./Sculpture";

interface HeroSceneProps {
  tier: Exclude<RenderTier, "none">;
  animated: boolean;
  active: boolean;
  onContextLost: () => void;
}

/** Local studio lighting. No HDRI download is required. */
function Studio() {
  return (
    <Environment resolution={128} frames={1}>
      <Lightformer form="rect" intensity={5} color="#dcefff" position={[-5, 4, 4]} rotation={[0, 0.9, 0]} scale={[3, 9, 1]} />
      <Lightformer form="rect" intensity={7} color="#9fdcee" position={[6, 0, 3]} rotation={[0, -1.1, 0]} scale={[0.8, 10, 1]} />
      <Lightformer form="rect" intensity={1.6} color="#ffffff" position={[0, -5, 2]} rotation={[1.4, 0, 0]} scale={[10, 1.5, 1]} />
      <Lightformer form="ring" intensity={1.4} color="#7fd3e8" position={[0, 3, -6]} scale={5} />
    </Environment>
  );
}

export default function HeroScene({ tier, animated, active, onContextLost }: HeroSceneProps) {
  const high = tier === "high";
  return (
    <Canvas
      aria-hidden
      dpr={high ? [1, 1.6] : [1, 1.25]}
      frameloop={!animated ? "demand" : active ? "always" : "never"}
      camera={{ position: [0, 0, 9], fov: 34, near: 0.1, far: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: ACESFilmicToneMapping }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", onContextLost, { once: true });
      }}
    >
      <Suspense fallback={null}>
        <Studio />
        <Sculpture animated={animated} shardCount={high ? 1400 : 520} />
      </Suspense>
      <Dust count={high ? 420 : 130} animated={animated} />
    </Canvas>
  );
}
