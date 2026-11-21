"use client";

import { useThree } from "@react-three/fiber";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { LineBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, PMREMGenerator } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

function createKit(generator: PMREMGenerator) {
  const envMap = generator.fromScene(new RoomEnvironment(), 0.04).texture;
  generator.dispose();
  return {
    metal: new MeshStandardMaterial({ color: "#c6cdd6", metalness: 1, roughness: 0.22, envMap, envMapIntensity: 1.15 }),
    dark: new MeshStandardMaterial({ color: "#3a4049", metalness: 0.95, roughness: 0.34, envMap, envMapIntensity: 0.9 }),
    glass: new MeshPhysicalMaterial({
      color: "#cfeef7", metalness: 0.7, roughness: 0.04, transparent: true, opacity: 0.4,
      clearcoat: 1, envMap, envMapIntensity: 2.2, depthWrite: false,
    }),
    signal: new MeshStandardMaterial({
      color: "#7fd3e8", metalness: 0.6, roughness: 0.3, emissive: "#2f8ba5", emissiveIntensity: 0.9, envMap,
    }),
    line: new LineBasicMaterial({ color: "#7fd3e8", transparent: true, opacity: 0.55 }),
  };
}

export type MaterialKit = ReturnType<typeof createKit>;
export type SurfaceName = Exclude<keyof MaterialKit, "line">;

const KitContext = createContext<MaterialKit | null>(null);

/** One shared set of materials and one environment map for every object on the site. */
export function MaterialProvider({ children }: { children: ReactNode }) {
  const gl = useThree((state) => state.gl);
  const kit = useMemo(() => createKit(new PMREMGenerator(gl)), [gl]);
  return <KitContext.Provider value={kit}>{children}</KitContext.Provider>;
}

export function useKit() {
  const kit = useContext(KitContext);
  if (!kit) throw new Error("useKit must be used inside MaterialProvider");
  return kit;
}
