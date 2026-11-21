"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Object3D } from "@/components/ui/Object3D";
import { expertise } from "@/content/expertise";
import { ScrollTrigger } from "@/lib/gsap";
import { scrollToY } from "@/lib/lenis";
import { DISSOLVE_SVH } from "@/lib/transition";
import type { ModelName } from "@/three/modelNames";

const COUNT = expertise.length;
const STEP = (Math.PI * 2) / COUNT;
const RADIUS_X = 41;
const RADIUS_Y = 38;
/** The stage is 100 by 80 units, so vertical percentages are scaled for the SVG. */
const SVG_RADIUS_Y = RADIUS_Y * 0.8;
const wrap = (value: number) => ((value % COUNT) + COUNT) % COUNT;

export function ExpertiseOrbit() {
  const [turn, setTurn] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<ScrollTrigger | null>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const reduced = useReducedMotion();
  const activeIndex = wrap(turn);
  const active = expertise[activeIndex];

  /** Takes the shortest way round the ring. */
  const show = useCallback((index: number) => {
    setTurn((current) => {
      let delta = index - wrap(current);
      if (delta > COUNT / 2) delta -= COUNT;
      if (delta < -COUNT / 2) delta += COUNT;
      return delta === 0 ? current : current + delta;
    });
  }, []);

  // Scroll position is the source of truth: each area owns an equal slice of the pinned distance.
  useEffect(() => {
    const sync = (self: ScrollTrigger) => show(Math.min(COUNT - 1, Math.floor(self.progress * COUNT)));
    const instance = ScrollTrigger.create({
      trigger: root.current,
      // The first stretch of this section is spent dissolving in, so the areas start after it.
      start: () => `top+=${(window.innerHeight * DISSOLVE_SVH) / 100} top`,
      end: "bottom bottom",
      onUpdate: sync,
      onRefresh: sync,
    });
    trigger.current = instance;
    return () => {
      instance.kill();
      trigger.current = null;
    };
  }, [show]);

  const goTo = (index: number) => {
    show(index);
    const instance = trigger.current;
    if (instance) scrollToY(instance.start + ((index + 0.5) / COUNT) * (instance.end - instance.start));
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
    <div ref={root} className="relative" style={{ height: `${COUNT * 90 + 10 + DISSOLVE_SVH}svh` }}>
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

              <Object3D
                name={active.id as ModelName}
                className="!absolute left-[20%] top-[12%] h-[70%] w-[60%]"
                fallback={<span className="display flex h-full items-center justify-center text-6xl text-signal md:text-8xl">{active.number}</span>}
              />

              {expertise.map((area, index) => {
                const angle = Math.PI / 2 + (index - turn) * STEP;
                const depth = (Math.sin(angle) + 1) / 2;
                const selected = index === activeIndex;
                return (
                  <motion.button
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
                    initial={false}
                    animate={{
                      left: `${50 + Math.cos(angle) * RADIUS_X}%`,
                      top: `${50 + Math.sin(angle) * RADIUS_Y}%`,
                      scale: 0.78 + depth * 0.3,
                      opacity: 0.62 + depth * 0.38,
                    }}
                    transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 70, damping: 17 }}
                    style={{ zIndex: Math.round(depth * 10) + 1, x: "-50%", y: "-50%" }}
                    className={`absolute flex h-11 w-11 items-center justify-center rounded-full border font-mono text-xs transition-colors md:h-[4.5rem] md:w-[4.5rem] md:text-sm ${
                      selected ? "border-signal bg-signal text-void" : "border-white/25 bg-graphite text-mist hover:border-signal"
                    }`}
                  >
                    {area.number}
                  </motion.button>
                );
              })}
            </div>

            <div id="expertise-panel" role="tabpanel" aria-labelledby={`tab-${active.id}`} className="min-h-[11.5rem] lg:min-h-[19rem]">
              {/* Content swaps immediately. Only the entrance animates, so input never waits. */}
              <motion.div
                key={active.id}
                initial={reduced ? false : { opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="eyebrow !text-signal">{active.number} / 0{COUNT}</p>
                <h3 className="display mt-2 text-3xl md:text-6xl lg:mt-4">{active.title}</h3>
                <p className="mt-2 max-w-md leading-snug text-haze md:text-lg md:leading-relaxed lg:mt-5">{active.summary}</p>
                <ul className="mt-3 flex flex-wrap gap-1.5 lg:mt-7 lg:gap-2">
                  {active.technologies.map((tech) => (
                    <li key={tech} className="border border-line px-2 py-1 font-mono text-[0.72rem] text-mist md:px-3 md:py-1.5 md:text-[0.8rem]">{tech}</li>
                  ))}
                </ul>
              </motion.div>
              <div aria-hidden className="mt-4 flex max-w-md gap-1.5 lg:mt-8">
                {expertise.map((area, index) => (
                  <span key={area.id} className={`h-0.5 flex-1 transition-colors duration-300 ${index <= activeIndex ? "bg-signal" : "bg-white/15"}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
