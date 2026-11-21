"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, type Points, type ShaderMaterial } from "three";
import { sceneState } from "./sceneState";

const vertexShader = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    p.y += sin(uTime * 0.12 + aSeed * 6.28) * 0.22;
    p.x += cos(uTime * 0.09 + aSeed * 9.0) * 0.16;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (1.2 + aSeed * 2.2) * uPixelRatio * (8.0 / -mv.z);
    vAlpha = (0.12 + aSeed * 0.42) * (0.65 + 0.35 * sin(uTime * 0.5 + aSeed * 20.0));
  }
`;

const fragmentShader = /* glsl */ `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(0.62, 0.86, 0.95, vAlpha * smoothstep(0.5, 0.05, d));
  }
`;

/** Deterministic generator keeps the field stable between renders. */
export function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

export function Dust({ count, animated }: { count: number; animated: boolean }) {
  const points = useRef<Points>(null);
  const material = useRef<ShaderMaterial>(null);

  const { positions, seeds } = useMemo(() => {
    const random = seeded(4817);
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (random() - 0.5) * 18;
      positions[i * 3 + 1] = (random() - 0.5) * 11;
      positions[i * 3 + 2] = -7 + random() * 11;
      seeds[i] = random();
    }
    return { positions, seeds };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio, 1.6) },
    }),
    [],
  );

  useFrame(({ clock }) => {
    if (!animated || !material.current || !points.current) return;
    material.current.uniforms.uTime.value = clock.elapsedTime;
    points.current.rotation.y = sceneState.pointer.x * 0.035 + sceneState.scroll * 0.25;
    points.current.rotation.x = -sceneState.pointer.y * 0.025;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}
