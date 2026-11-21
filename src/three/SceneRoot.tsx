"use client";

import { View } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { ACESFilmicToneMapping } from "three";
import type { RenderTier } from "@/lib/capabilities";
import { MaterialProvider } from "./materials";
import { sceneState } from "./sceneState";

/** A single fixed canvas that draws every section's object, so the page uses one WebGL context. */
export default function SceneRoot({ tier }: { tier: Exclude<RenderTier, "none"> }) {
  const [lost, setLost] = useState(false);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      sceneState.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      sceneState.pointer.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  if (lost) return null;

  return (
    <Canvas
      aria-hidden
      style={{ position: "fixed", inset: 0, zIndex: 40, pointerEvents: "none" }}
      dpr={tier === "high" ? [1, 1.5] : [1, 1.2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: ACESFilmicToneMapping }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", () => setLost(true), { once: true });
      }}
    >
      <MaterialProvider>
        <View.Port />
      </MaterialProvider>
    </Canvas>
  );
}
