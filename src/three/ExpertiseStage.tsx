"use client";

import { PerspectiveCamera, View } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  MathUtils,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  type ShaderMaterial,
} from "three";
import { seeded } from "./Dust";
import { expertiseState } from "./expertiseState";
import type { ModelName } from "./modelNames";
import { models } from "./models";
import { sceneState } from "./sceneState";

const vortexVertex = /* glsl */ `
  attribute float aSeed;
  uniform float uT;
  uniform float uTime;
  uniform float uPixel;
  varying float vEnergy;
  varying float vSeed;

  void main() {
    // Particles are drawn into the core, then thrown back out to their resting orbit.
    float pull = smoothstep(0.03 + aSeed * 0.14, 0.5, uT);
    float release = smoothstep(0.5, 0.94 - aSeed * 0.1, uT);
    float energy = pull * (1.0 - release);
    float radius = mix(position.y, 0.05 + aSeed * 0.12, pull);
    radius = mix(radius, position.y * (1.0 + 0.3 * sin(3.14159 * release)), release);
    float angle = position.x + uTime * (0.06 + aSeed * 0.1) + energy * (3.5 + aSeed * 3.0);
    vec3 p = vec3(cos(angle) * radius, position.z * (1.0 - energy) + sin(angle * 2.0) * 0.1, sin(angle) * radius);
    // Tilting the disc keeps the vortex readable from the fixed camera.
    p = vec3(p.x, p.y * 0.9 + p.z * 0.42, p.z * 0.9 - p.y * 0.42);
    vec4 view = modelViewMatrix * vec4(p, 1.0);
    vEnergy = sin(3.14159 * clamp(uT, 0.0, 1.0));
    vSeed = aSeed;
    gl_PointSize = uPixel * (1.5 + aSeed * 2.2 + vEnergy * 2.0) * (12.0 / -view.z);
    gl_Position = projectionMatrix * view;
  }
`;

const vortexFragment = /* glsl */ `
  varying float vEnergy;
  varying float vSeed;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float dot = smoothstep(0.5, 0.05, d);
    vec3 color = mix(vec3(0.5, 0.86, 0.95), vec3(0.92, 0.98, 1.0), vEnergy * vSeed);
    gl_FragColor = vec4(color, dot * (0.16 + vSeed * 0.14 + vEnergy * 0.62));
  }
`;

const glowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const glowFragment = /* glsl */ `
  uniform float uPower;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float halo = pow(max(1.0 - d, 0.0), 3.2);
    float core = pow(max(1.0 - d * 3.4, 0.0), 2.0);
    vec3 color = min((vec3(0.5, 0.86, 0.95) * halo + vec3(1.0) * core) * uPower, vec3(1.0));
    // The canvas is transparent, so alpha must fade with brightness or the quad shows as a black box.
    float alpha = max(color.r, max(color.g, color.b));
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(color / alpha, alpha);
  }
`;

const easeOutBack = (x: number) => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2);

/** amount 0 is at rest, 1 is fully collapsed. side -1 leaves and side 1 arrives, so the spiral feels continuous. */
function place(group: Group, amount: number, side: number, spin: number, bob: number) {
  group.visible = amount < 0.995;
  group.scale.setScalar(Math.max(1 - amount, 0.0001));
  group.position.set(side * amount * 1.1, bob * (1 - amount), -amount * 2);
  group.rotation.set(side * amount * 0.5, spin + side * amount * Math.PI * 1.7, side * amount * 0.8);
}

interface SceneProps {
  names: ModelName[];
  animated: boolean;
  particles: number;
  track: RefObject<HTMLDivElement | null>;
}

function Scene({ names, animated, particles, track }: SceneProps) {
  const pixelRatio = useThree((state) => state.viewport.dpr);
  const root = useRef<Group>(null);
  const items = useRef<(Group | null)[]>([]);
  const vortex = useRef<ShaderMaterial>(null);
  const glow = useRef<Mesh>(null);
  const glowMaterial = useRef<ShaderMaterial>(null);
  const waves = useRef<(Mesh | null)[]>([]);
  const spin = useRef(0);
  const time = useRef(0);

  const geometry = useMemo(() => {
    const random = seeded(4242);
    const positions = new Float32Array(particles * 3);
    const seeds = new Float32Array(particles);
    for (let i = 0; i < particles; i += 1) {
      positions[i * 3] = random() * Math.PI * 2;
      positions[i * 3 + 1] = 2.05 + Math.pow(random(), 1.6) * 1.35;
      positions[i * 3 + 2] = (random() - 0.5) * 0.34;
      seeds[i] = random();
    }
    const built = new BufferGeometry();
    built.setAttribute("position", new BufferAttribute(positions, 3));
    built.setAttribute("aSeed", new BufferAttribute(seeds, 1));
    return built;
  }, [particles]);

  const vortexUniforms = useMemo(() => ({ uT: { value: 0 }, uTime: { value: 0 }, uPixel: { value: 1 } }), []);
  const glowUniforms = useMemo(() => ({ uPower: { value: 0 } }), []);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const element = track.current;
    if (!root.current || !element) return;
    const gate = Number(element.closest<HTMLElement>("[data-scene-gate]")?.dataset.sceneGate ?? 1);
    root.current.visible = gate > 0.01;
    root.current.scale.setScalar(Math.max(gate, 0.0001));
    if (!root.current.visible) return;

    if (animated) {
      spin.current += delta * 0.38;
      time.current += delta;
    }
    const last = names.length - 1;
    const value = MathUtils.clamp(expertiseState.value, 0, last);
    const from = Math.min(Math.floor(value), last);
    const t = value - from;
    const leaving = Math.pow(MathUtils.smoothstep(t, 0, 0.54), 1.6);
    const arriving = 1 - easeOutBack(MathUtils.clamp((t - 0.46) / 0.54, 0, 1));

    items.current.forEach((group, index) => {
      if (!group) return;
      const bob = animated ? Math.sin(time.current * 0.8 + index) * 0.07 : 0;
      if (index === from) place(group, leaving, -1, spin.current, bob);
      else if (index === from + 1 && t > 0.46) place(group, arriving, 1, spin.current, bob);
      else group.visible = false;
    });

    root.current.rotation.x = MathUtils.damp(root.current.rotation.x, -sceneState.pointer.y * 0.22, 3, delta);
    root.current.rotation.z = MathUtils.damp(root.current.rotation.z, sceneState.pointer.x * -0.1, 3, delta);

    if (vortex.current) {
      vortex.current.uniforms.uT.value = t;
      vortex.current.uniforms.uTime.value = time.current;
      vortex.current.uniforms.uPixel.value = pixelRatio;
    }

    const flash = MathUtils.smoothstep(t, 0.24, 0.5) * (1 - MathUtils.smoothstep(t, 0.5, 0.78));
    if (glow.current && glowMaterial.current) {
      glow.current.visible = flash > 0.002;
      // Stays inside the view's height so the halo fades out before the scissor edge.
      glow.current.scale.setScalar(1.2 + flash * 1.95);
      glowMaterial.current.uniforms.uPower.value = flash * 1.25;
    }

    waves.current.forEach((wave, index) => {
      if (!wave) return;
      const progress = MathUtils.clamp((t - 0.47 - index * 0.06) / 0.4, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      wave.visible = progress > 0 && progress < 1;
      wave.scale.setScalar(0.1 + eased * (3.05 - index * 0.35));
      wave.rotation.z = time.current * 0.3 + index;
      (wave.material as MeshBasicMaterial).opacity = (1 - progress) * (1 - progress) * (0.85 - index * 0.2);
    });
  });

  return (
    <group ref={root}>
      {names.map((name, index) => {
        const Model = models[name];
        return (
          <group
            key={name}
            visible={index === 0}
            ref={(node) => {
              items.current[index] = node;
            }}
          >
            <Model />
          </group>
        );
      })}

      <points geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={vortex}
          vertexShader={vortexVertex}
          fragmentShader={vortexFragment}
          uniforms={vortexUniforms}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </points>

      <mesh ref={glow} visible={false} renderOrder={5}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          ref={glowMaterial}
          vertexShader={glowVertex}
          fragmentShader={glowFragment}
          uniforms={glowUniforms}
          transparent
          blending={AdditiveBlending}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {[[-1.18, 0.12], [-1.72, -0.5], [-0.72, 0.62]].map(([x, y], index) => (
        <mesh
          key={x}
          visible={false}
          rotation={[x, y, 0]}
          renderOrder={4}
          ref={(node) => {
            waves.current[index] = node;
          }}
        >
          <ringGeometry args={[0.985, 1, 128]} />
          <meshBasicMaterial color="#a8e9f7" transparent opacity={0} blending={AdditiveBlending} depthWrite={false} side={2} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

export default function ExpertiseStage(props: SceneProps) {
  return (
    <View className="absolute inset-0">
      <PerspectiveCamera makeDefault position={[0, 0, 12.3]} fov={30} near={0.1} far={40} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 5, 6]} intensity={2.2} color="#e8f6ff" />
      <directionalLight position={[-5, -2, 2]} intensity={0.9} color="#7fd3e8" />
      <Scene {...props} />
    </View>
  );
}
