"use client";

import { PerspectiveCamera, View } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  DoubleSide,
  MathUtils,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  type PerspectiveCamera as PerspectiveCameraType,
  type ShaderMaterial,
} from "three";
import type { ModelName } from "./modelNames";
import { models } from "./models";
import { transitState } from "./transitState";
import { flowFragment, glowFragment, glowVertex, streakVertex } from "./WarpScene";

const smooth = MathUtils.smoothstep;
const MODEL_Z = -10;
const band = (t: number, a: number, b: number, c: number, d: number) => smooth(t, a, b) * (1 - smooth(t, c, d));
const easeOutBack = (x: number) => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2);

function Scene({ names, streaks }: { names: ModelName[]; streaks: number }) {
  const root = useRef<Group>(null);
  const items = useRef<(Group | null)[]>([]);
  const rings = useRef<(Mesh | null)[]>([]);
  const flow = useRef<ShaderMaterial>(null);
  const glow = useRef<Mesh>(null);
  const glowMaterial = useRef<ShaderMaterial>(null);
  const clock = useRef(0);
  const flowUniforms = useMemo(() => ({ uTravel: { value: 0 }, uSpeed: { value: 0 }, uVisible: { value: 0 }, uTime: { value: 0 } }), []);
  const glowUniforms = useMemo(() => ({ uPower: { value: 0 } }), []);

  useFrame(({ camera }, rawDelta) => {
    const { index, t } = transitState;
    if (!root.current) return;
    root.current.visible = index >= 0 && t > 0 && t < 1;
    if (!root.current.visible) return;
    clock.current += Math.min(rawDelta, 0.05);

    const run = MathUtils.clamp((t - 0.08) / 0.84, 0, 1);
    if (flow.current) {
      const values = flow.current.uniforms;
      values.uTravel.value = 95 * run * run * (3 - 2 * run);
      values.uSpeed.value = Math.sin(run * Math.PI) * 0.62;
      values.uVisible.value = band(t, 0.1, 0.24, 0.8, 0.92);
      values.uTime.value = clock.current;
    }

    const aspect = (camera as PerspectiveCameraType).aspect || 1;
    const fit = Math.min(1, aspect * 1.25);
    const enter = easeOutBack(MathUtils.clamp((t - 0.28) / 0.2, 0, 1));
    const exit = smooth(t, 0.74, 0.86);
    const presence = Math.max(enter * (1 - exit), 0.0001);

    items.current.forEach((group, itemIndex) => {
      if (!group) return;
      group.visible = itemIndex === index && t > 0.28 && exit < 1;
      if (!group.visible) return;
      group.scale.setScalar(presence * fit);
      group.position.set(0, 0.62, MODEL_Z + exit * 3);
      group.rotation.set(0.08, clock.current * 0.45 + (1 - enter) * Math.PI * 2 + exit * Math.PI * 1.5, (1 - enter) * 0.7);
    });

    rings.current.forEach((ring, ringIndex) => {
      if (!ring) return;
      const direction = ringIndex % 2 ? -1 : 1;
      ring.position.set(0, 0.62, MODEL_Z);
      ring.scale.setScalar(Math.max(enter, 0.001) * fit * (1 + ringIndex * 0.17 + exit * 2.4));
      ring.rotation.z = direction * (clock.current * 0.35 + t * 5);
      (ring.material as MeshBasicMaterial).opacity = band(t, 0.3, 0.42, 0.76, 0.88) * (0.8 - ringIndex * 0.22);
    });

    const flash = band(t, 0.76, 0.84, 0.84, 0.97);
    if (glow.current && glowMaterial.current) {
      glow.current.visible = flash > 0.003;
      glow.current.position.set(0, 0, -7);
      glow.current.scale.setScalar(1 + flash * 4.6);
      glowMaterial.current.uniforms.uPower.value = flash * 1.3;
    }
  });

  return (
    <group ref={root} visible={false}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 5, 6]} intensity={2.4} color="#e8f6ff" />
      <directionalLight position={[-5, -2, 2]} intensity={1} color="#7fd3e8" />

      <instancedMesh args={[undefined, undefined, streaks]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <shaderMaterial ref={flow} vertexShader={streakVertex} fragmentShader={flowFragment} uniforms={flowUniforms} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>

      {names.map((name, index) => {
        const Model = models[name];
        return (
          <group
            key={name}
            visible={false}
            ref={(node) => {
              items.current[index] = node;
            }}
          >
            <Model />
          </group>
        );
      })}

      {[0, 1, 2].map((index) => (
        <mesh
          key={index}
          ref={(node) => {
            rings.current[index] = node;
          }}
        >
          <ringGeometry args={[2.72, 2.75, 6, 1]} />
          <meshBasicMaterial color="#a8e9f7" transparent opacity={0} blending={AdditiveBlending} depthWrite={false} side={DoubleSide} toneMapped={false} />
        </mesh>
      ))}

      <mesh ref={glow} visible={false} renderOrder={6}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial ref={glowMaterial} vertexShader={glowVertex} fragmentShader={glowFragment} uniforms={glowUniforms} transparent blending={AdditiveBlending} depthTest={false} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function TransitScene({ names, streaks }: { names: ModelName[]; streaks: number }) {
  return (
    <View className="absolute inset-0">
      <PerspectiveCamera makeDefault position={[0, 0, 0]} fov={36} near={0.05} far={120} />
      <Scene names={names} streaks={streaks} />
    </View>
  );
}
