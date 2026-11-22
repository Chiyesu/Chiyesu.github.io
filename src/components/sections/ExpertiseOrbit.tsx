"use client";

import { useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { expertise } from "@/content/expertise";
import { useCapabilities } from "@/lib/capabilities";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { scrollToY } from "@/lib/lenis";
import { DISSOLVE_SVH, smoothstep } from "@/lib/transition";
import { expertiseState } from "@/three/expertiseState";
import type { ModelName } from "@/three/modelNames";

const ExpertiseStage = dynamic(() => import("@/three/ExpertiseStage"), { ssr: false });

const COUNT = expertise.length;
const STEP = (Math.PI * 2) / COUNT;
const RADIUS_X = 41;
const RADIUS_Y = 38;
/** The stage is 100 by 80 units, so vertical percentages are scaled for the SVG. */
const SVG_RADIUS_Y = RADIUS_Y * 0.8;
const SCROLL_PER_AREA = 110;
const NAMES = expertise.map((area) => area.id as ModelName);
const HIDDEN: CSSProperties = { visibility: "hidden", opacity: 0 };
const wrap = (value: number) => ((value % COUNT) + COUNT) % COUNT;
const clamp = (value: number) => Math.min(1, Math.max(0, value));

function orbitPosition(index: number, value: number) {
  const angle = Math.PI / 2 + (index - value) * STEP;
  const depth = (Math.sin(angle) + 1) / 2;
  return {
    left: `${50 + Math.cos(angle) * RADIUS_X}%`,
    top: `${50 + Math.sin(angle) * RADIUS_Y}%`,
    transform: `translate(-50%, -50%) scale(${0.78 + depth * 0.3})`,
    opacity: 0.62 + depth * 0.38,
    zIndex: Math.round(depth * 10) + 1,
  };
}

/** Moves one panel's title, text and chips in a stagger. amount 0 is at rest, direction -1 exits upward. */
function paintPanel(panel: HTMLElement, amount: number, direction: number) {
  panel.style.visibility = amount >= 1 ? "hidden" : "visible";
  panel.style.opacity = amount >= 1 ? "0" : "1";
  if (amount >= 1) return;
  panel.querySelectorAll<HTMLElement>("[data-part]").forEach((part, order, parts) => {
    const spread = 0.42 / Math.max(1, parts.length - 1);
    const local = clamp((amount - (direction < 0 ? order : parts.length - 1 - order) * spread) / 0.58);
    const eased = local * local * (3 - 2 * local);
    if (part.dataset.part === "word") {
      part.style.transform = `translate3d(0, ${direction * eased * 115}%, 0) rotate(${direction * eased * 5}deg)`;
    } else {
      part.style.transform = `translate3d(0, ${direction * eased * 26}px, 0) scale(${1 - eased * 0.05})`;
      part.style.opacity = String(1 - eased);
    }
  });
}

export function ExpertiseOrbit() {
  const [activeIndex, setActiveIndex] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const trigger = useRef<ScrollTrigger | null>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const bars = useRef<(HTMLSpanElement | null)[]>([]);
  const reduced = useReducedMotion();
  const { ready, tier, reducedMotion } = useCapabilities();
  const live = ready && tier !== "none";
  const active = expertise[activeIndex];

  // Scroll is the source of truth, so every part of the transition can be scrubbed forwards and backwards.
  useEffect(() => {
    let target = 0;
    let value = -1;
    let shown = 0;

    const paint = (next: number) => {
      value = next;
      expertiseState.value = next;
      tabs.current.forEach((tab, index) => {
        if (tab) Object.assign(tab.style, orbitPosition(index, next));
      });
      panels.current.forEach((panel, index) => {
        if (!panel) return;
        const distance = next - index;
        const amount = smoothstep(Math.abs(distance), 0, 0.48);
        paintPanel(panel, Math.abs(distance) >= 0.48 ? 1 : amount, distance > 0 ? -1 : 1);
      });
      bars.current.forEach((bar, index) => {
        if (bar) bar.style.transform = `scaleX(${clamp(next - index + 1)})`;
      });
      const nearest = Math.round(next);
      if (nearest !== shown) {
        shown = nearest;
        setActiveIndex(nearest);
      }
    };

    const sync = (self: ScrollTrigger) => {
      const raw = self.progress * COUNT;
      const index = Math.min(COUNT - 1, Math.floor(raw));
      // Each area holds, then the back half of its slice becomes the transition.
      target = reduced ? index : index + (index < COUNT - 1 ? smoothstep(raw - index, 0.42, 0.96) : 0);
    };

    const tick = (_time: number, deltaMs: number) => {
      if (value < 0) return paint(target);
      if (value === target) return;
      const next = reduced ? target : target + (value - target) * Math.exp(-(9 * Math.min(deltaMs, 50)) / 1000);
      paint(Math.abs(next - target) < 0.0004 ? target : next);
    };

    const instance = ScrollTrigger.create({
      trigger: root.current,
      // The first stretch of this section is spent dissolving in, so the areas start after it.
      start: () => `top+=${(window.innerHeight * DISSOLVE_SVH) / 100} top`,
      end: "bottom bottom",
      onUpdate: sync,
      onRefresh: sync,
    });
    trigger.current = instance;
    sync(instance);
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      instance.kill();
      trigger.current = null;
      expertiseState.value = 0;
    };
  }, [reduced]);

  const goTo = (index: number) => {
    const instance = trigger.current;
    if (instance) scrollToY(instance.start + ((index + 0.2) / COUNT) * (instance.end - instance.start));
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const moves: Record<string, number> = {
      ArrowRight: wrap(activeIndex + 1),
      ArrowDown: wrap(activeIndex + 1),
      ArrowLeft: wrap(activeIndex - 1),
      ArrowUp: wrap(activeIndex - 1),
      Home: 0,
      End: COUNT - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    goTo(moves[event.key]);
    tabs.current[moves[event.key]]?.focus({ preventScroll: true });
  };

  return (
    <div ref={root} className="relative" style={{ height: `${COUNT * SCROLL_PER_AREA + 10 + DISSOLVE_SVH}svh` }}>
      <div className="sticky top-0 flex h-svh flex-col overflow-hidden pb-5 pt-20 lg:pb-8 lg:pt-24">
        <div className="shell flex min-h-0 flex-1 flex-col">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Expertise</p>
              <h2 id="expertise-title" className="display mt-2 text-[clamp(1.8rem,4.2vw,4.25rem)] lg:mt-4">
                Five areas, one connected system.
              </h2>
            </div>
            <p className="eyebrow hidden shrink-0 pb-2 md:block">Scroll to explore</p>
          </div>

          <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] items-center gap-3 pt-3 lg:grid-cols-[1.15fr_1fr] lg:grid-rows-1 lg:gap-16 lg:pt-4">
            <div
              role="tablist"
              aria-label="Areas of expertise"
              aria-orientation="horizontal"
              onKeyDown={onKeyDown}
              onFocus={() => {
                // Keyboard users arriving early skip past the dissolve so the focused control is visible.
                const instance = trigger.current;
                if (instance && window.scrollY < instance.start) scrollToY(instance.start + 1);
              }}
              className="relative mx-auto aspect-[5/4] max-h-full w-[min(100%,calc((100svh-24rem)*1.25))] min-w-48 lg:w-[min(100%,calc((100svh-13rem)*1.25),38rem)]"
            >
              <svg aria-hidden viewBox="0 0 100 80" className="absolute inset-0 h-full w-full">
                <ellipse cx="50" cy="40" rx={RADIUS_X} ry={SVG_RADIUS_Y} fill="none" stroke="rgb(255 255 255 / 0.13)" strokeWidth="0.2" />
                <ellipse cx="50" cy="40" rx="24" ry="17" fill="none" stroke="rgb(255 255 255 / 0.07)" strokeWidth="0.2" strokeDasharray="0.6 1.4" />
              </svg>

              <div ref={stage} aria-hidden className="absolute inset-0">
                {live ? (
                  <ExpertiseStage names={NAMES} animated={!reducedMotion} particles={tier === "high" ? 1400 : 600} track={stage} />
                ) : (
                  <span className="display flex h-full items-center justify-center text-6xl text-signal md:text-8xl">{active.number}</span>
                )}
              </div>

              {expertise.map((area, index) => {
                const selected = index === activeIndex;
                return (
                  <button
                    key={area.id}
                    ref={(node) => {
                      tabs.current[index] = node;
                    }}
                    type="button"
                    role="tab"
                    id={`tab-${area.id}`}
                    aria-selected={selected}
                    aria-controls="expertise-panel"
                    aria-label={area.title}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => goTo(index)}
                    style={orbitPosition(index, 0)}
                    className={`absolute flex h-11 w-11 items-center justify-center rounded-full border font-mono text-xs transition-[background-color,border-color,color,box-shadow] duration-500 md:h-[4.5rem] md:w-[4.5rem] md:text-sm ${
                      selected ? "border-signal bg-signal text-void shadow-[0_0_28px_rgb(127_211_232/0.45)]" : "border-white/25 bg-graphite text-mist hover:border-signal"
                    }`}
                  >
                    {area.number}
                  </button>
                );
              })}
            </div>

            <div id="expertise-panel" role="tabpanel" aria-labelledby={`tab-${active.id}`} className="min-h-[11.5rem] lg:min-h-[19rem]">
              <div className="grid">
                {expertise.map((area, index) => (
                  <div
                    key={area.id}
                    ref={(node) => {
                      panels.current[index] = node;
                    }}
                    inert={index !== activeIndex}
                    aria-hidden={index !== activeIndex}
                    style={index === 0 ? undefined : HIDDEN}
                    className="col-start-1 row-start-1"
                  >
                    <p data-part="line" className="eyebrow !text-signal">{area.number} / 0{COUNT}</p>
                    <h3 className="display mt-2 text-3xl md:text-6xl lg:mt-4">
                      {area.title.split(" ").map((word, wordIndex) => (
                        <span key={`${word}-${wordIndex}`} className="inline-block overflow-hidden pb-[0.12em] align-top">
                          <span data-part="word" className="inline-block origin-bottom-left will-change-transform">{word}</span>
                          {" "}
                        </span>
                      ))}
                    </h3>
                    <p data-part="line" className="mt-1 max-w-md leading-snug text-haze md:text-lg md:leading-relaxed lg:mt-3">{area.summary}</p>
                    <ul className="mt-3 flex flex-wrap gap-1.5 lg:mt-7 lg:gap-2">
                      {area.technologies.map((tech) => (
                        <li key={tech} data-part="chip" className="border border-line px-2 py-1 font-mono text-[0.72rem] text-mist md:px-3 md:py-1.5 md:text-[0.8rem]">{tech}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div aria-hidden className="mt-4 flex max-w-md gap-1.5 lg:mt-8">
                {expertise.map((area, index) => (
                  <span key={area.id} className="h-0.5 flex-1 overflow-hidden bg-white/15">
                    <span
                      ref={(node) => {
                        bars.current[index] = node;
                      }}
                      className="block h-full origin-left bg-signal"
                      style={{ transform: index === 0 ? "scaleX(1)" : "scaleX(0)" }}
                    />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
