"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { projects } from "@/content/projects";
import { useCapabilities } from "@/lib/capabilities";
import { ScrollTrigger } from "@/lib/gsap";
import { useNearViewport } from "@/lib/loading";
import { scrollToY } from "@/lib/lenis";
import { smoothstep } from "@/lib/transition";
import { transitState } from "@/three/transitState";

const TransitScene = dynamic(() => import("@/three/TransitScene"), { ssr: false });

const BLADES = Array.from({ length: 11 }, (_, index) => index);
const CENTER = (BLADES.length - 1) / 2;
const INCOMING = projects.slice(1);
const NAMES = INCOMING.map((project) => project.motif);
const band = (t: number, a: number, b: number, c: number, d: number) => smoothstep(t, a, b) * (1 - smoothstep(t, c, d));
/** The overlay is fixed and always on screen, so loading is keyed to the project list instead. */
const findDeck = () => document.querySelector("[data-project-deck]");
const shortTitle =(title: string) => title.replace(" Academic & Administrative Chatbot", " Chatbot").replace("Educational Media Processing ", "Media ");

/**
 * A full-screen shutter between projects. It closes over one card, shows the next project in 3D
 * while that card moves into place, then opens on it. Decorative, so hidden from assistive technology.
 */
export function ProjectTransit() {
  const overlay = useRef<HTMLDivElement>(null);
  const blades = useRef<(HTMLDivElement | null)[]>([]);
  const labels = useRef<(HTMLDivElement | null)[]>([]);
  const scan = useRef<HTMLDivElement>(null);
  const { ready, tier } = useCapabilities();
  const near = useNearViewport(findDeck);
  const live = ready && tier !== "none" && near;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const deck = document.querySelector<HTMLElement>("[data-project-deck]");
    if (!deck) return;
    const articles = Array.from(deck.querySelectorAll<HTMLElement>("[data-stack]"));
    const markers = Array.from(deck.querySelectorAll<HTMLElement>("[data-project-transit]"));
    let instances: ScrollTrigger[] = [];

    const paint = (index: number, t: number) => {
      transitState.index = index;
      transitState.t = t;
      if (!overlay.current) return;
      overlay.current.style.visibility = index >= 0 ? "visible" : "hidden";
      if (index < 0) return;

      blades.current.forEach((blade, bladeIndex) => {
        if (!blade) return;
        const order = Math.abs(bladeIndex - CENTER) / CENTER;
        const close = smoothstep(t, 0.02 + order * 0.12, 0.2 + order * 0.12);
        const open = smoothstep(t, 0.8 + order * 0.07, 0.91 + order * 0.08);
        const direction = bladeIndex % 2 ? 1 : -1;
        // Each blade crosses the screen in one direction, so opening continues the closing motion.
        blade.style.transform = `translate3d(0, ${direction * (1 - close - open) * 101}%, 0)`;
      });
      labels.current.forEach((label, labelIndex) => {
        if (!label) return;
        const show = labelIndex === index ? band(t, 0.34, 0.43, 0.72, 0.8) : 0;
        label.style.opacity = String(show);
        label.style.transform = `translate3d(-50%, ${(1 - show) * 24}px, 0)`;
      });
      if (scan.current) {
        scan.current.style.opacity = String(band(t, 0.24, 0.32, 0.72, 0.8));
        scan.current.style.transform = `translate3d(0, ${smoothstep(t, 0.26, 0.78) * 100}svh, 0)`;
      }
    };

    const update = () => {
      instances.forEach((instance, index) => {
        articles[index + 1].dataset.sceneGate = String(smoothstep(instance.progress, 0.84, 0.97));
      });
      const active = instances.findIndex((instance) => instance.isActive);
      paint(active, active >= 0 ? instances[active].progress : 0);
    };

    instances = markers.map((marker) =>
      ScrollTrigger.create({ trigger: marker, start: "top bottom", end: "bottom top", onUpdate: update, onToggle: update, onRefresh: update }),
    );
    update();

    // Keyboard focus must never land on a card that is behind the closed shutter.
    const onFocus = (event: FocusEvent) => {
      const article = (event.target as HTMLElement).closest<HTMLElement>("[data-stack]");
      const index = article ? articles.indexOf(article) : -1;
      if (index < 0) return;
      const lower = index === 0 ? -Infinity : instances[index - 1].end;
      const upper = instances[index]?.start ?? Infinity;
      if (window.scrollY < lower - 2 || window.scrollY > upper + 2) {
        scrollToY(index === 0 ? instances[0].start : instances[index - 1].end);
      }
    };
    deck.addEventListener("focusin", onFocus);

    return () => {
      deck.removeEventListener("focusin", onFocus);
      instances.forEach((instance) => instance.kill());
      articles.forEach((article) => delete article.dataset.sceneGate);
      transitState.index = -1;
      transitState.t = 0;
    };
  }, []);

  return (
    <div ref={overlay} aria-hidden style={{ visibility: "hidden" }} className="pointer-events-none fixed inset-0 z-30 overflow-hidden motion-reduce:hidden">
      <div className="absolute inset-0 flex">
        {BLADES.map((blade) => (
          <div
            key={blade}
            ref={(node) => {
              blades.current[blade] = node;
            }}
            style={{ transform: `translate3d(0, ${blade % 2 ? 101 : -101}%, 0)` }}
            className="-mr-px h-full flex-1 border-y-2 border-signal bg-[linear-gradient(180deg,#0f1115,#08090b_50%,#0f1115)] shadow-[0_0_26px_rgb(127_211_232/0.55)] will-change-transform"
          />
        ))}
      </div>

      <div className="absolute inset-0">{live && <TransitScene names={NAMES} streaks={tier === "high" ? 1500 : 600} />}</div>

      <div ref={scan} className="absolute inset-x-0 top-0 h-px bg-signal opacity-0 shadow-[0_0_18px_3px_rgb(127_211_232/0.7)]" />

      {INCOMING.map((project, index) => (
        <div
          key={project.slug}
          ref={(node) => {
            labels.current[index] = node;
          }}
          style={{ opacity: 0 }}
          className="absolute bottom-[11svh] left-1/2 w-full max-w-4xl px-5 text-center"
        >
          <p className="eyebrow !text-signal">
            {project.number} / {String(projects.length).padStart(2, "0")} · {project.category}
          </p>
          <p className="display mt-3 text-[clamp(2.2rem,6vw,5.75rem)]">{shortTitle(project.title)}</p>
        </div>
      ))}
    </div>
  );
}
