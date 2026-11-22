"use client";

import { useEffect, useState, type RefObject } from "react";

export const SPLASH_DONE = "frontier:splash-done";

/** Runs once the splash has finished, or on the next frame if there is no splash. */
export function afterSplash(run: () => void) {
  if (!document.documentElement.classList.contains("splash-first")) {
    const frame = requestAnimationFrame(run);
    return () => cancelAnimationFrame(frame);
  }
  window.addEventListener(SPLASH_DONE, run, { once: true });
  return () => window.removeEventListener(SPLASH_DONE, run);
}

/** Runs tasks one at a time while the browser is idle, so scrolling is never interrupted. */
export function runWhenIdle(tasks: (() => unknown)[]) {
  let cancelled = false;
  let index = 0;
  const schedule = (next: () => void) =>
    // Safari has no requestIdleCallback.
    typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(next, { timeout: 1500 }) : setTimeout(next, 120);
  const step = async () => {
    if (cancelled || index >= tasks.length) return;
    try {
      await tasks[index]();
    } catch {
      // Preloading is an optimisation. The section loads its own assets if this fails.
    }
    index += 1;
    schedule(step);
  };
  schedule(step);
  return () => {
    cancelled = true;
  };
}

/** True once the element comes within the margin of the viewport. It stays true afterwards. */
export function useNearViewport(target: RefObject<Element | null> | (() => Element | null), margin = "150%") {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const element = typeof target === "function" ? target() : target.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: `${margin} 0px` },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [target, margin]);

  return near;
}
