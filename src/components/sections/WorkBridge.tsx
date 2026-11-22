"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { projects } from "@/content/projects";
import { useCapabilities } from "@/lib/capabilities";
import { ScrollTrigger } from "@/lib/gsap";
import { useNearViewport } from "@/lib/loading";
import { BRIDGE_SVH, smoothstep } from "@/lib/transition";
import { bridgeState } from "@/three/bridgeState";
import { expertiseState } from "@/three/expertiseState";

const WarpScene = dynamic(() => import("@/three/WarpScene"), { ssr: false });

/** Each project flies past the camera during the jump, from a different side. */
const FLY_PATHS: [number, number][] = [[-1, -0.55], [1, -0.4], [-1, 0.45], [1, 0.55]];
const FLY_START = 0.4;
const FLY_GAP = 0.072;
const CORNERS = [
  "left-4 top-20 border-l border-t md:left-8",
  "right-4 top-20 border-r border-t md:right-8",
  "bottom-6 left-4 border-b border-l md:left-8",
  "bottom-6 right-4 border-b border-r md:right-8",
];
const band = (p: number, a: number, b: number, c: number, d: number) => smoothstep(p, a, b) * (1 - smoothstep(p, c, d));

/**
 * A scroll-scrubbed jump from Expertise to Selected Work. It is decorative, so it is hidden from
 * assistive technology, and it is removed entirely without JavaScript or with reduced motion.
 */
export function WorkBridge() {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const iris = useRef<HTMLDivElement>(null);
  const hud = useRef<HTMLDivElement>(null);
  const percent = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const captionA = useRef<HTMLParagraphElement>(null);
  const captionB = useRef<HTMLParagraphElement>(null);
  const labels = useRef<(HTMLDivElement | null)[]>([]);
  const { ready, tier } = useCapabilities();
  const near = useNearViewport(root);
  const live = ready && tier !== "none" && near;

  useEffect(() => {
    const target = document.getElementById("projects");

    const paint = (p: number) => {
      bridgeState.value = p;
      expertiseState.exit = 1 - smoothstep(p, 0.01, 0.1);
      if (target) target.dataset.sceneGate = String(smoothstep(p, 0.92, 0.99));
      if (!stage.current || !veil.current || !iris.current) return;

      const active = p > 0 && p < 0.995;
      stage.current.style.visibility = active ? "visible" : "hidden";
      if (!active) return;

      veil.current.style.opacity = String(smoothstep(p, 0, 0.1));
      const open = smoothstep(p, 0.885, 0.985);
      const radius = open * open * 82;
      const mask = open > 0 ? `radial-gradient(circle at 50% 50%, transparent ${radius}vmax, #000 ${radius + 1.2}vmax)` : "none";
      veil.current.style.maskImage = mask;
      veil.current.style.setProperty("-webkit-mask-image", mask);
      iris.current.style.opacity = String(open > 0 ? 1 - smoothstep(open, 0.72, 1) : 0);
      iris.current.style.width = iris.current.style.height = `${radius * 2}vmax`;

      if (hud.current) hud.current.style.opacity = String(band(p, 0.06, 0.14, 0.84, 0.9));
      if (percent.current) percent.current.textContent = String(Math.round(smoothstep(p, 0.08, 0.86) * 100)).padStart(3, "0");
      if (bar.current) bar.current.style.transform = `scaleX(${smoothstep(p, 0.08, 0.86)})`;

      if (captionA.current) {
        const show = band(p, 0.13, 0.19, 0.28, 0.33);
        captionA.current.style.opacity = String(show);
        captionA.current.style.transform = `translate3d(0, ${(1 - show) * 22}px, 0)`;
        captionA.current.style.letterSpacing = `${(1 - show) * 0.12}em`;
      }
      if (captionB.current) {
        // Finishes before the flash, because the canvas draws above this text.
        const show = band(p, 0.74, 0.79, 0.825, 0.86);
        captionB.current.style.opacity = String(show);
        captionB.current.style.transform = `translate(-50%, -50%) scale(${0.82 + smoothstep(p, 0.74, 0.86) * 0.3})`;
      }

      labels.current.forEach((label, index) => {
        if (!label) return;
        const local = (p - (FLY_START + index * FLY_GAP)) / 0.11;
        if (Math.abs(local) >= 1) {
          label.style.opacity = "0";
          return;
        }
        const scale = 0.1 * Math.pow(15, (local + 1) / 2);
        const [x, y] = FLY_PATHS[index % FLY_PATHS.length];
        label.style.opacity = String(smoothstep(local, -1, -0.5) * (1 - smoothstep(local, 0.42, 0.95)));
        label.style.transform = `translate(calc(-50% + ${x * scale * 20}vw), calc(-50% + ${y * scale * 24}svh)) scale(${scale})`;
      });
    };

    const instance = ScrollTrigger.create({
      trigger: root.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => paint(self.progress),
      onRefresh: (self) => paint(self.progress),
    });
    paint(instance.progress);

    return () => {
      instance.kill();
      bridgeState.value = 0;
      expertiseState.exit = 1;
      if (target) target.dataset.sceneGate = "1";
    };
  }, []);

  return (
    // The negative margin equals 100svh plus BRIDGE_IN_SVH, so the warp starts over the pinned Expertise stage.
    <div
      ref={root}
      aria-hidden
      data-work-bridge
      className="pointer-events-none relative z-20 hidden [.js_&]:motion-safe:mt-[-140svh] [.js_&]:motion-safe:block"
      style={{ height: `${BRIDGE_SVH + 100}svh` }}
    >
      <div ref={stage} style={{ visibility: "hidden" }} className="sticky top-0 h-svh overflow-hidden">
        <div ref={veil} className="absolute inset-0 bg-void opacity-0" />
        <div className="absolute inset-0">{live && <WarpScene streaks={tier === "high" ? 2600 : 1000} />}</div>

        <div
          ref={iris}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-signal opacity-0 shadow-[0_0_60px_rgb(127_211_232/0.7),inset_0_0_60px_rgb(127_211_232/0.45)]"
        />

        <p ref={captionA} className="display absolute inset-x-0 bottom-[11svh] px-5 text-center text-[clamp(1.9rem,4.6vw,4.5rem)] opacity-0">
          Five disciplines, <em className="text-signal">one direction.</em>
        </p>

        {projects.map((project, index) => (
          <div
            key={project.slug}
            ref={(node) => {
              labels.current[index] = node;
            }}
            className="absolute left-1/2 top-1/2 w-max max-w-[80vw] border-l-2 border-signal bg-void/40 py-2 pl-4 pr-6 opacity-0 will-change-transform"
          >
            <span className="block font-mono text-xs text-signal">{project.number} · {project.category}</span>
            <span className="display mt-1 block text-[clamp(1.6rem,3.6vw,3.5rem)]">
              {project.title.replace(" Academic & Administrative Chatbot", " Chatbot").replace("Educational Media Processing ", "Media ")}
            </span>
          </div>
        ))}

        <p ref={captionB} className="display absolute left-1/2 top-1/2 w-full px-5 text-center text-[clamp(2.6rem,8vw,8rem)] opacity-0">
          Now, <em className="text-signal">the work.</em>
        </p>

        <div ref={hud} className="absolute inset-0 opacity-0">
          {CORNERS.map((corner) => (
            <span key={corner} className={`absolute h-7 w-7 border-signal/70 ${corner}`} />
          ))}
          <p className="eyebrow absolute left-8 top-28 hidden !text-signal md:block">Expertise → Selected work</p>
          <div className="absolute inset-x-8 bottom-10 mx-auto flex max-w-md items-center gap-3 font-mono text-[0.7rem] text-signal">
            <span>LINK</span>
            <span className="h-px flex-1 bg-white/15">
              <span ref={bar} className="block h-full origin-left bg-signal" style={{ transform: "scaleX(0)" }} />
            </span>
            <span><span ref={percent}>000</span>%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
