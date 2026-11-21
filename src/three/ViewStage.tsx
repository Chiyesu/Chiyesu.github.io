"use client";

import { PerspectiveCamera, View } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, type ReactNode, type RefObject } from "react";
import { MathUtils, type Group } from "three";
import type { ModelName } from "./modelNames";
import { models } from "./models";
import { sceneState } from "./sceneState";

interface MotionProps {
  track: RefObject<HTMLDivElement | null>;
  animated: boolean;
  /** Offsets the float so neighbouring objects don't bob in unison. */
  phase: number;
  children: ReactNode;
}

/** Fits, spins and tilts a model, and retires it before a stacked panel slides over it. */
function Motion({ track, animated, phase, children }: MotionProps) {
  const group = useRef<Group>(null);
  const intro = useRef(animated ? 0 : 1);

  useFrame(({ clock }, rawDelta) => {
    const element = track.current;
    if (!group.current || !element) return;
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const delta = Math.min(rawDelta, 0.05);

    const next = element.closest("[data-stack]")?.nextElementSibling;
    const covered = next ? (rect.bottom - next.getBoundingClientRect().top) / rect.height : -1;
    // The canvas sits above the page, so objects in a section that is fading in must follow its opacity.
    const gate = element.closest<HTMLElement>("[data-scene-gate]");
    const gated = gate ? Number(gate.dataset.sceneGate ?? 1) : 1;
    const visible = (1 - MathUtils.smoothstep(covered, -0.06, 0.04)) * gated;

    if (animated) intro.current = MathUtils.damp(intro.current, 1, 4.5, delta);
    const fit = Math.min(1, (rect.width / rect.height) * 0.92);
    group.current.scale.setScalar(Math.max(fit * intro.current * visible, 0.0001));
    group.current.visible = visible > 0.01;

    if (!animated) return;
    const time = clock.elapsedTime + phase;
    group.current.rotation.y += delta * 0.38;
    group.current.rotation.x = MathUtils.damp(group.current.rotation.x, -sceneState.pointer.y * 0.28, 3, delta);
    group.current.rotation.z = MathUtils.damp(group.current.rotation.z, sceneState.pointer.x * -0.12, 3, delta);
    group.current.position.y = Math.sin(time * 0.8) * 0.07;
  });

  return <group ref={group}>{children}</group>;
}

interface ViewStageProps {
  name: ModelName;
  animated: boolean;
  track: RefObject<HTMLDivElement | null>;
}

export default function ViewStage({ name, animated, track }: ViewStageProps) {
  const Model = models[name];
  return (
    // View measures the element it renders, so that element must fill the reserved slot.
    <View className="absolute inset-0">
      <PerspectiveCamera makeDefault position={[0, 0, 8.6]} fov={30} near={0.1} far={30} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 5, 6]} intensity={2.2} color="#e8f6ff" />
      <directionalLight position={[-5, -2, 2]} intensity={0.9} color="#7fd3e8" />
      <Motion key={name} track={track} animated={animated} phase={name.charCodeAt(0) + name.length * 1.7}>
        <Model />
      </Motion>
    </View>
  );
}
