"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { coursework } from "@/content/coursework";
import { useCapabilities } from "@/lib/capabilities";
import { afterSplash, runWhenIdle } from "@/lib/loading";

const SceneRoot = dynamic(() => import("@/three/SceneRoot"), { ssr: false });

/** Downloaded in the background, so each section is ready by the time a visitor reaches it. */
const BACKGROUND_TASKS: (() => unknown)[] = [
  () => import("@/three/ViewStage"),
  () => import("@/three/NeuroLink"),
  () => import("@/three/CourseMorph"),
  () => import("@/three/ExpertiseStage"),
  () => import("@/three/WarpScene"),
  ...coursework.map((course) => async () => (await import("@/three/courseShapes")).traceShape(course.shape)),
];

export function SceneLayer() {
  const { ready, tier } = useCapabilities();
  const [started, setStarted] = useState(false);
  const enabled = ready && tier !== "none";

  useEffect(() => {
    if (!enabled) return;
    let stopIdle = () => {};
    const stopWaiting = afterSplash(() => {
      setStarted(true);
      stopIdle = runWhenIdle(BACKGROUND_TASKS);
    });
    return () => {
      stopWaiting();
      stopIdle();
    };
  }, [enabled]);

  if (!enabled || !started) return null;
  return <SceneRoot tier={tier} />;
}
