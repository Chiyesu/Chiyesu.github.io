"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { getProject } from "@/content/projects";
import { stack } from "@/content/stack";
import { useCapabilities } from "@/lib/capabilities";
import { ScrollTrigger } from "@/lib/gsap";
import { useNearViewport } from "@/lib/loading";
import { scrollToY } from "@/lib/lenis";
import { DISSOLVE_SVH, FINALE_SVH, smoothstep } from "@/lib/transition";
import { stackState } from "@/three/stackState";

const NeuroLink = dynamic(() => import("@/three/NeuroLink"), { ssr: false });

const COUNT = stack.length;
const SCROLL_PER_NODE = 62;
const STORY_SVH = COUNT * SCROLL_PER_NODE;
/** Share of the pinned scroll spent on the node-by-node story, before the cinematic. */
const STORY_SHARE = STORY_SVH / (STORY_SVH + FINALE_SVH);
const DISSOLVE_START = 1 - DISSOLVE_SVH / FINALE_SVH;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Renders the 3D view into the stage, which can grow beyond the grid slot to fill the screen. */
function NeuroLinkPortal({ target, children }: { target: RefObject<HTMLDivElement | null>; children: ReactNode }) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setElement(target.current));
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return element ? createPortal(children, element) : null;
}

export function StackNetwork() {
  const [activeIndex, setActiveIndex] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const pinned = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLParagraphElement>(null);
  const barTop = useRef<HTMLDivElement>(null);
  const barBottom = useRef<HTMLDivElement>(null);
  const trigger = useRef<ScrollTrigger | null>(null);
  const reduced = useReducedMotion();
  const { ready, tier, reducedMotion } = useCapabilities();
  const active = stack[activeIndex];
  const next = stack[activeIndex + 1];
  const live = ready && tier !== "none";
  const near = useNearViewport(root);

  useEffect(() => {
    // Each node holds for the first half of its slice, then the link grows towards the next one.
    const next = document.getElementById("expertise");
    // Expertise pins underneath the end of the cinematic so it can dissolve in without a cut.
    // Applied here so that, without JavaScript, the sections simply stack normally.
    if (next) {
      next.style.marginTop = `calc(-100svh - ${DISSOLVE_SVH}svh)`;
      next.style.scrollMarginTop = `calc(-${DISSOLVE_SVH}svh - 5rem)`;
    }

    /** Scroll drives every beat of the closing cinematic directly, so it can be scrubbed both ways. */
    const direct = (finale: number) => {
      stackState.finale = finale;

      if (pinned.current && slot.current && stage.current) {
        const frame = pinned.current.getBoundingClientRect();
        const from = slot.current.getBoundingClientRect();
        const open = smoothstep(finale, 0.04, 0.3);
        stage.current.style.left = `${lerp(from.left - frame.left, 0, open)}px`;
        stage.current.style.top = `${lerp(from.top - frame.top, 0, open)}px`;
        stage.current.style.width = `${lerp(from.width, frame.width, open)}px`;
        stage.current.style.height = `${lerp(from.height, frame.height, open)}px`;
      }
      if (panel.current) {
        const fade = smoothstep(finale, 0, 0.12);
        panel.current.style.opacity = String(1 - fade);
        panel.current.style.transform = `translateX(${-fade * 36}px)`;
        panel.current.style.pointerEvents = fade > 0.5 ? "none" : "";
      }
      if (caption.current) {
        const show = smoothstep(finale, 0.3, 0.4) * (1 - smoothstep(finale, 0.55, 0.63));
        caption.current.style.opacity = String(show);
        caption.current.style.transform = `translateY(${(1 - show) * 18}px)`;
      }
      const letterbox = smoothstep(finale, 0.06, 0.22) * (1 - smoothstep(finale, 0.74, 0.9));
      if (barTop.current) barTop.current.style.transform = `scaleY(${letterbox})`;
      if (barBottom.current) barBottom.current.style.transform = `scaleY(${letterbox})`;
      if (next) {
        const dissolve = smoothstep(finale, DISSOLVE_START, 1);
        next.style.opacity = String(dissolve);
        next.style.pointerEvents = dissolve < 0.5 ? "none" : "";
        next.dataset.sceneGate = String(dissolve);
      }
    };

    const sync = (self: ScrollTrigger) => {
      const story = Math.min(1, self.progress / STORY_SHARE);
      const raw = story * COUNT;
      const index = Math.min(COUNT - 1, Math.floor(raw));
      stackState.value = index + (index < COUNT - 1 ? smoothstep(raw - index, 0.48, 0.96) : 0);
      setActiveIndex(index);
      direct(Math.max(0, (self.progress - STORY_SHARE) / (1 - STORY_SHARE)));
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
      stackState.value = 0;
      stackState.finale = 0;
      if (next) {
        next.style.marginTop = "";
        next.style.scrollMarginTop = "";
        next.style.opacity = "";
        next.style.pointerEvents = "";
        next.dataset.sceneGate = "1";
      }
    };
  }, []);

  const goTo = (index: number) => {
    const instance = trigger.current;
    if (instance) scrollToY(instance.start + ((index + 0.2) / COUNT) * STORY_SHARE * (instance.end - instance.start));
  };

  return (
    <div ref={root} className="relative mt-24 md:mt-32" style={{ height: `${STORY_SVH + FINALE_SVH + 100}svh` }}>
      <div ref={pinned} className="sticky top-0 h-svh overflow-hidden pb-4 pt-[4.75rem] lg:pb-8 lg:pt-24">
        <div aria-hidden ref={stage} className="absolute" />
        <div aria-hidden ref={barTop} style={{ transform: "scaleY(0)" }} className="absolute inset-x-0 top-0 z-20 h-[11svh] origin-top border-b border-white/15 bg-black" />
        <div aria-hidden ref={barBottom} style={{ transform: "scaleY(0)" }} className="absolute inset-x-0 bottom-0 z-20 h-[11svh] origin-bottom border-t border-white/15 bg-black" />
        <p
          ref={caption}
          aria-hidden
          className="display pointer-events-none absolute inset-x-0 bottom-[14svh] z-30 px-5 text-center text-[clamp(1.9rem,4.4vw,4.25rem)] opacity-0"
        >
          Every tool, <em className="text-signal">one connected system.</em>
        </p>
        <div className="shell grid h-full grid-rows-[minmax(0,1fr)_auto] gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-1 lg:gap-10">
          <div ref={panel} className="relative order-2 flex h-[19.5rem] flex-col lg:order-1 lg:h-full lg:justify-center">
            <p className="eyebrow">How my stack connects</p>
            <p aria-hidden className="mt-2 font-mono text-xs text-signal lg:mt-8">
              {String(activeIndex + 1).padStart(2, "0")} / {COUNT} · {active.area}
            </p>
            <motion.div
              key={active.id}
              initial={reduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <h3 className="display mt-1.5 text-[clamp(2rem,4.6vw,4.5rem)] lg:mt-3">{active.label}</h3>
              <p className="mt-2 max-w-lg text-[0.95rem] leading-snug text-haze md:text-lg md:leading-relaxed lg:mt-5">{active.usage}</p>
              <div className="mt-2 flex min-h-7 flex-wrap items-center gap-1.5 lg:mt-5">
                {active.usedIn.map((slug) => {
                  const project = getProject(slug);
                  if (!project) return null;
                  return (
                    <Link
                      key={slug}
                      href={`/projects/${slug}`}
                      className="inline-flex max-w-full items-center gap-1 border border-line px-2 py-1 font-mono text-[0.68rem] text-mist transition-colors hover:border-signal hover:text-signal md:text-xs"
                    >
                      <span className="truncate">{project.title.replace(" Academic & Administrative Chatbot", " Chatbot").replace("Educational Media Processing ", "Media ")}</span>
                      <ArrowUpRight size={12} className="shrink-0" aria-hidden />
                    </Link>
                  );
                })}
                {active.usedIn.length === 0 && <span className="pending">Project example to be added</span>}
              </div>
              <p className="mt-2 flex max-w-lg items-start gap-2 text-sm leading-snug text-dim lg:mt-6">
                <ArrowDown size={14} className="mt-0.5 shrink-0 text-signal" aria-hidden />
                <span>
                  {active.linkToNext}
                  {next && <span className="text-mist"> Next: {next.label}.</span>}
                </span>
              </p>
            </motion.div>

            <div role="group" aria-label="Jump to a technology" className="absolute inset-x-0 bottom-0 flex gap-0.5 lg:bottom-2 lg:max-w-lg">
              {stack.map((node, index) => (
                <button
                  key={node.id}
                  type="button"
                  aria-label={node.label}
                  aria-current={index === activeIndex ? "step" : undefined}
                  onClick={() => goTo(index)}
                  className="group flex h-6 flex-1 items-center"
                >
                  <span className={`block h-0.5 w-full transition-colors duration-300 group-hover:bg-mist ${index <= activeIndex ? "bg-signal" : "bg-white/15"}`} />
                </button>
              ))}
            </div>
          </div>

          <div ref={slot} aria-hidden className="relative order-1 min-h-0 lg:order-2">
            {live ? (
              near && (
                <NeuroLinkPortal target={stage}>
                  <NeuroLink stack={stack} animated={!reducedMotion} dustCount={tier === "high" ? 520 : 180} />
                </NeuroLinkPortal>
              )
            ) : (
              <ul className="flex h-full flex-wrap content-center justify-center gap-2">
                {stack.map((node, index) => (
                  <li key={node.id} className={`border px-2 py-1 font-mono text-xs ${index <= activeIndex ? "border-signal text-signal" : "border-line text-dim"}`}>
                    {node.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      <noscript>
        <ol className="shell pb-16">
          {stack.map((node) => (
            <li key={node.id} className="border-t border-line py-4">
              <h3 className="display text-2xl">{node.label}</h3>
              <p className="mt-1 text-haze">{node.usage}</p>
            </li>
          ))}
        </ol>
      </noscript>
    </div>
  );
}
