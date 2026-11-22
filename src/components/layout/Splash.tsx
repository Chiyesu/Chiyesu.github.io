"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { supportsWebGL } from "@/lib/capabilities";
import { gsap } from "@/lib/gsap";
import { SPLASH_DONE } from "@/lib/loading";
import { sceneState } from "@/three/sceneState";

const MIN_MS = 2200;
/** A slow or failed asset must never keep the visitor out of the site. */
const MAX_MS = 25000;
const SCULPTURE_WEIGHT = 4;
const RADIUS = 96;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SCROLL_KEYS = new Set([" ", "PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown"]);

/** Only what the first screen needs. Later sections load in the background and as they approach. */
const SCENES = [() => import("@/three/HeroScene")];

/** Matches where Sculpture.tsx places the object on wide and portrait screens. */
const sculptureCenter = () => {
  const { innerWidth: width, innerHeight: height } = window;
  return width / height > 1.15 ? { x: width * 0.72, y: height * 0.5 } : { x: width * 0.5, y: height * 0.23 };
};

export function Splash() {
  const [finished, setFinished] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const reactor = useRef<HTMLDivElement>(null);
  const arc = useRef<SVGCircleElement>(null);
  const core = useRef<HTMLDivElement>(null);
  const wave = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const percent = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    if (!html.classList.contains("splash-hold")) {
      // The boot timer may have dismissed the splash after this module read its state.
      sceneState.intro = 1;
      return;
    }
    html.dataset.splashLive = "1";

    const webgl = supportsWebGL();
    let done = 0;
    let shown = 0;
    let playing = false;
    let timeline: gsap.core.Timeline | null = null;
    const total = 2 + (webgl ? SCENES.length + SCULPTURE_WEIGHT : 0);
    const finishTask = () => {
      done += 1;
    };

    const whenLoaded = new Promise<void>((resolve) => {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", () => resolve(), { once: true });
    });
    whenLoaded.then(finishTask);
    document.fonts.ready.then(finishTask, finishTask);
    if (webgl) SCENES.forEach((load) => load().then(finishTask, finishTask));

    const block = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    const blockKeys = (event: KeyboardEvent) => {
      if (SCROLL_KEYS.has(event.key)) block(event);
    };
    const options = { capture: true, passive: false };
    const lock = (on: boolean) => {
      const method = on ? window.addEventListener : window.removeEventListener;
      method("wheel", block, options);
      method("touchmove", block, options);
      method("keydown", blockKeys as EventListener, options);
    };
    lock(true);

    const play = () => {
      playing = true;
      root.current?.setAttribute("data-splash-state", "reveal");
      const { x, y } = sculptureCenter();
      const dx = x - window.innerWidth / 2;
      const dy = y - window.innerHeight / 2;
      const reach = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) * 1.12;
      const opening = { radius: 0 };

      const paintVeil = () => {
        if (!veil.current) return;
        const mask = `radial-gradient(circle at ${x}px ${y}px, transparent ${opening.radius}px, #000 ${opening.radius + 26}px)`;
        veil.current.style.maskImage = mask;
        veil.current.style.setProperty("-webkit-mask-image", mask);
        if (wave.current) {
          wave.current.style.width = wave.current.style.height = `${opening.radius * 2}px`;
        }
      };

      if (wave.current) gsap.set(wave.current, { left: x, top: y, xPercent: -50, yPercent: -50 });

      timeline = gsap.timeline({
        onComplete: () => {
          lock(false);
          history.scrollRestoration = "auto";
          html.classList.remove("splash-first");
          try {
            sessionStorage.setItem("frontier-splash", "1");
          } catch {
            // Private modes can block storage. The splash simply shows again next time.
          }
          setFinished(true);
          window.dispatchEvent(new Event(SPLASH_DONE));
        },
      });
      timeline
        // The loader travels to the exact spot where the sculpture lives.
        .to(copy.current, { autoAlpha: 0, y: 14, duration: 0.45, ease: "power2.in" }, 0)
        .to(reactor.current, { x: dx, y: dy, scale: 0.72, duration: 0.95, ease: "expo.inOut" }, 0.1)
        .to(core.current, { scale: 1.7, duration: 0.3, ease: "power2.in" }, 0.75)
        // The core ignites, the veil opens from it, and the sculpture bursts out of the same point.
        .add(() => {
          if (root.current) root.current.style.pointerEvents = "none";
        }, 1.05)
        .to(reactor.current, { scale: 2.6, autoAlpha: 0, duration: 0.6, ease: "power2.out" }, 1.05)
        .to(sceneState, { intro: 1, duration: 2.1, ease: "back.out(1.25)" }, 1.05)
        .to(opening, { radius: reach, duration: 1.3, ease: "power3.inOut", onUpdate: paintVeil }, 1.05)
        .fromTo(wave.current, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.5, ease: "power1.in" }, 1.9)
        .add(() => html.classList.remove("splash-hold"), 1.45)
        .set({}, {}, 3.15);
    };

    const tick = () => {
      if (playing) return;
      // Measured from the start of navigation, so a slow script download counts towards the limit.
      const elapsed = performance.now();
      const sculpture = webgl && sceneState.loaded ? SCULPTURE_WEIGHT : 0;
      const expired = elapsed >= MAX_MS;
      const target = expired ? 1 : (done + sculpture) / total;
      // Real progress drives the number. Easing only smooths the jumps between finished tasks.
      shown += (target - shown) * 0.09;
      if (target === 1 && shown > 0.995) shown = 1;
      if (percent.current) percent.current.textContent = String(Math.round(shown * 100)).padStart(3, "0");
      if (arc.current) arc.current.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - shown));
      if (shown === 1 && elapsed >= MIN_MS) {
        // If the model never arrived, show the site anyway rather than leaving it collapsed.
        play();
      }
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      timeline?.kill();
      lock(false);
    };
  }, []);

  if (finished) return null;

  return (
    <div ref={root} data-splash-state="loading" className="splash fixed inset-0 z-[95] overflow-hidden">
      <p role="status" className="sr-only">Loading {site.name}&apos;s portfolio</p>
      <div ref={veil} aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#12161c_0%,var(--color-void)_62%)]" />
      <div
        ref={wave}
        aria-hidden
        className="absolute rounded-full border border-signal opacity-0 shadow-[0_0_70px_rgb(127_211_232/0.75),inset_0_0_70px_rgb(127_211_232/0.4)]"
      />

      <div ref={reactor} aria-hidden className="absolute left-1/2 top-1/2 -ml-28 -mt-28 h-56 w-56">
        <svg viewBox="0 0 224 224" className="absolute inset-0 animate-spin" style={{ animationDuration: "16s" }}>
          <circle cx="112" cy="112" r="110" fill="none" stroke="rgb(255 255 255 / 0.16)" strokeDasharray="2 9" />
        </svg>
        <svg viewBox="0 0 224 224" className="absolute inset-0 -rotate-90">
          <circle cx="112" cy="112" r={RADIUS} fill="none" stroke="rgb(255 255 255 / 0.1)" />
          <circle
            ref={arc}
            cx="112"
            cy="112"
            r={RADIUS}
            fill="none"
            stroke="var(--color-signal)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE}
            style={{ filter: "drop-shadow(0 0 6px rgb(127 211 232 / 0.8))" }}
          />
        </svg>
        <svg viewBox="0 0 224 224" className="absolute inset-0 animate-spin" style={{ animationDuration: "7s" }}>
          <ellipse cx="112" cy="112" rx="72" ry="26" fill="none" stroke="rgb(127 211 232 / 0.6)" transform="rotate(28 112 112)" />
          <ellipse cx="112" cy="112" rx="72" ry="26" fill="none" stroke="rgb(236 239 242 / 0.35)" transform="rotate(-42 112 112)" />
        </svg>
        <div
          ref={core}
          className="absolute left-1/2 top-1/2 -ml-5 -mt-5 h-10 w-10 rotate-45 border border-white/70 bg-signal/25 shadow-[0_0_34px_10px_rgb(127_211_232/0.55)]"
        />
      </div>

      <div ref={copy} aria-hidden className="absolute inset-x-0 top-[calc(50%+8.5rem)] px-5 text-center">
        <p className="display text-3xl md:text-4xl">{site.name}</p>
        <p className="eyebrow mt-3">
          {site.role} <span className="mx-2 text-line">/</span> <span ref={percent} className="text-signal">000</span><span className="text-signal">%</span>
        </p>
      </div>
    </div>
  );
}
