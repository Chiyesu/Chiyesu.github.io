"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { DoubleSide, MathUtils, type Group, type Mesh } from "three";
import { sceneState } from "./sceneState";
import { Shards } from "./Shards";

const MODEL = "/models/frontier.glb";
const DRACO = "/draco/";

interface SculptureProps {
  animated: boolean;
  shardCount: number;
}

export function Sculpture({ animated, shardCount }: SculptureProps) {
  const { nodes } = useGLTF(MODEL, DRACO);
  const rig = useRef<Group>(null);
  const spin = useRef<Group>(null);
  const core = useRef<Mesh>(null);
  const ringA = useRef<Mesh>(null);
  const ringB = useRef<Mesh>(null);
  const drag = useRef({ active: false, lastX: 0, lastY: 0, vx: 0, vy: 0 });
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (!animated) return;
    const state = drag.current;
    const down = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (event.pointerType !== "mouse" || !target?.closest("[data-hero-drag]")) return;
      if (target.closest("a, button, h1, p")) return;
      state.active = true;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
    };
    const move = (event: PointerEvent) => {
      sceneState.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      sceneState.pointer.y = -((event.clientY / window.innerHeight) * 2 - 1);
      if (!state.active) return;
      state.vy += (event.clientX - state.lastX) * 0.0016;
      state.vx += (event.clientY - state.lastY) * 0.0016;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
    };
    const up = () => {
      state.active = false;
    };
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [animated]);

  useEffect(() => invalidate(), [invalidate]);

  useFrame(({ viewport, camera }, rawDelta) => {
    if (!rig.current || !spin.current) return;
    const delta = Math.min(rawDelta, 0.05);
    const { width, height } = viewport.getCurrentViewport(camera, [0, 0, 0]);
    const wide = width / height > 1.15;
    const scroll = sceneState.scroll;
    // On portrait screens the sculpture sits in the clear space above the hero text.
    const fit = wide ? Math.min(height / 6.2, width / 9.5) : Math.min(width / 5.9, height / 14.5);

    rig.current.position.x = wide ? MathUtils.lerp(width * 0.22, 0, scroll) : 0;
    rig.current.position.y = wide ? 0 : MathUtils.lerp(height * 0.27, height * 0.05, scroll);
    rig.current.position.z = scroll * 2.6;
    rig.current.scale.setScalar(fit);

    if (!animated) return;
    const state = drag.current;
    spin.current.rotation.y += delta * 0.11 + state.vy;
    spin.current.rotation.x += state.vx;
    state.vx *= 0.92;
    state.vy *= 0.92;
    rig.current.rotation.y = MathUtils.damp(rig.current.rotation.y, sceneState.pointer.x * 0.28 + scroll * 1.1, 3, delta);
    rig.current.rotation.x = MathUtils.damp(rig.current.rotation.x, -sceneState.pointer.y * 0.18 + scroll * 0.35, 3, delta);
    if (core.current) {
      core.current.rotation.x -= delta * 0.22;
      core.current.rotation.y -= delta * 0.3;
    }
    if (ringA.current) ringA.current.rotation.z += delta * 0.09;
    if (ringB.current) ringB.current.rotation.z -= delta * 0.06;
  });

  const ribbon = nodes.Ribbon as Mesh;
  const glass = nodes.Core as Mesh;
  const a = nodes.RingA as Mesh;
  const b = nodes.RingB as Mesh;

  return (
    <group ref={rig}>
      <Shards count={shardCount} animated={animated} />
      <group ref={spin}>
        <mesh geometry={ribbon.geometry}>
          <meshStandardMaterial color="#c6cdd6" metalness={1} roughness={0.2} envMapIntensity={1.7} flatShading />
        </mesh>
        <mesh ref={core} geometry={glass.geometry}>
          {/* Layered reflective facets read as glass without a costly transmission pass. */}
          <meshPhysicalMaterial
            color="#cfeef7"
            metalness={0.75}
            roughness={0.03}
            transparent
            opacity={0.42}
            clearcoat={1}
            envMapIntensity={3.4}
            flatShading
            side={DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>
      <mesh ref={ringA} geometry={a.geometry} rotation={a.rotation}>
        <meshStandardMaterial color="#7fd3e8" metalness={1} roughness={0.3} emissive="#2f7f96" emissiveIntensity={0.6} />
      </mesh>
      <mesh ref={ringB} geometry={b.geometry} rotation={b.rotation}>
        <meshStandardMaterial color="#8d95a0" metalness={1} roughness={0.35} />
      </mesh>
    </group>
  );
}

useGLTF.preload(MODEL, DRACO);
