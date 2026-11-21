"use client";

import { motion, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { CourseSymbol } from "@/components/ui/CourseSymbol";
import { coursework } from "@/content/coursework";
import { useCapabilities } from "@/lib/capabilities";
import { ScrollTrigger } from "@/lib/gsap";
import { scrollToY } from "@/lib/lenis";
import { smoothstep } from "@/lib/transition";
import { courseState } from "@/three/courseState";

const CourseMorph = dynamic(() => import("@/three/CourseMorph"), { ssr: false });

const COUNT = coursework.length;
const SCROLL_PER_COURSE = 80;
const SHAPES = coursework.map((course) => course.shape);

export function Coursework() {
  const [activeIndex, setActiveIndex] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<ScrollTrigger | null>(null);
  const reduced = useReducedMotion();
  const { ready, tier, reducedMotion } = useCapabilities();
  const active = coursework[activeIndex];
  const live = ready && tier !== "none";

  useEffect(() => {
    // Each course holds for the first half of its slice, then its particles flow into the next object.
    const sync = (self: ScrollTrigger) => {
      const raw = self.progress * COUNT;
      const index = Math.min(COUNT - 1, Math.floor(raw));
      courseState.value = index + (index < COUNT - 1 ? smoothstep(raw - index, 0.46, 0.98) : 0);
      setActiveIndex(index);
    };
    const instance = ScrollTrigger.create({
      trigger: root.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: sync,
      onRefresh: sync,
    });
    trigger.current = instance;
    return () => {
      instance.kill();
      trigger.current = null;
      courseState.value = 0;
    };
  }, []);

  const goTo = (index: number) => {
    const instance = trigger.current;
    if (instance) scrollToY(instance.start + ((index + 0.2) / COUNT) * (instance.end - instance.start));
  };

  return (
    <div ref={root} data-coursework className="relative mt-24 md:mt-32" style={{ height: `${COUNT * SCROLL_PER_COURSE + 100}svh` }}>
      <div className="sticky top-0 h-svh overflow-hidden pb-4 pt-[4.75rem] lg:pb-8 lg:pt-24">
        <div className="shell grid h-full grid-rows-[minmax(0,1fr)_auto] gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:grid-rows-1 lg:gap-12">
          <div aria-hidden className="relative min-h-0">
            {live ? (
              <CourseMorph shapes={SHAPES} animated={!reducedMotion} count={tier === "high" ? 7000 : 4000} size={tier === "high" ? 0.024 : 0.03} />
            ) : (
              <ul className="flex h-full flex-wrap content-center justify-center gap-2">
                {coursework.map((course, index) => (
                  <li key={course.id} className={`border px-2 py-1 font-mono text-xs ${index === activeIndex ? "border-signal text-signal" : "border-line text-dim"}`}>
                    {course.title}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="relative flex h-[18rem] flex-col lg:h-full lg:justify-center">
            <p className="eyebrow">Computer Science foundations</p>
            <div aria-hidden className="mt-2 flex items-center gap-3 font-mono text-xs text-signal lg:mt-7">
              <motion.span
                key={active.id}
                initial={reduced ? false : { opacity: 0, scale: 0.6, rotate: -25 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-signal/60 bg-signal/10 lg:h-14 lg:w-14"
              >
                <CourseSymbol shape={active.shape} className="h-[1.15rem] w-[1.15rem] lg:h-7 lg:w-7" />
              </motion.span>
              Course {String(activeIndex + 1).padStart(2, "0")} / {String(COUNT).padStart(2, "0")}
            </div>
            <motion.div
              key={active.id}
              initial={reduced ? false : { opacity: 0, y: 18, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <h3 className="display mt-1.5 text-[clamp(2.1rem,4.7vw,4.75rem)] lg:mt-3">{active.title}</h3>
              <p className="mt-2 max-w-lg text-[0.95rem] leading-snug text-haze md:text-lg md:leading-relaxed lg:mt-5">{active.summary}</p>
            </motion.div>

            <div role="group" aria-label="Jump to a course" className="absolute inset-x-0 bottom-0 flex gap-1 lg:bottom-2 lg:max-w-lg">
              {coursework.map((course, index) => (
                <button
                  key={course.id}
                  type="button"
                  aria-label={course.title}
                  aria-current={index === activeIndex ? "step" : undefined}
                  onClick={() => goTo(index)}
                  title={course.title}
                  className={`group flex h-11 flex-1 flex-col items-center justify-between transition-colors duration-500 hover:text-mist ${
                    index === activeIndex ? "text-signal" : index < activeIndex ? "text-signal/60" : "text-dim"
                  }`}
                >
                  <CourseSymbol shape={course.shape} className="mt-1 h-[1.1rem] w-[1.1rem] transition-transform duration-300 group-hover:-translate-y-0.5 lg:h-5 lg:w-5" />
                  <span className={`block h-0.5 w-full transition-colors duration-500 group-hover:bg-mist ${index <= activeIndex ? "bg-signal" : "bg-white/15"}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <noscript>
        <ul className="shell pb-16">
          {coursework.map((course) => (
            <li key={course.id} className="border-t border-line py-4">
              <h3 className="display text-2xl">{course.title}</h3>
              <p className="mt-1 text-haze">{course.summary}</p>
            </li>
          ))}
        </ul>
      </noscript>
    </div>
  );
}
