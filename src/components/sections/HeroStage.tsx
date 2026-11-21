"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { useCapabilities } from "@/lib/capabilities";
import { gsap, MOTION_OK } from "@/lib/gsap";
import { sceneState } from "@/three/sceneState";

const HeroScene = dynamic(() => import("@/three/HeroScene"), { ssr: false });

class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function Poster() {
  return (
    <div className="absolute inset-0 flex items-start justify-center md:items-center md:justify-end md:pr-[4vw]">
      <Image
        src="/images/frontier-poster.webp"
        alt=""
        width={1100}
        height={1100}
        priority={false}
        sizes="(max-width: 768px) 100vw, 55vw"
        className="mt-16 w-[min(100vw,30rem)] opacity-70 md:mt-0 md:w-[min(52vw,88vh)] md:opacity-100"
      />
    </div>
  );
}

export function HeroStage({ children }: { children: ReactNode }) {
  const { ready, tier, reducedMotion } = useCapabilities();
  const root = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  const [lost, setLost] = useState(false);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const media = gsap.matchMedia();
    media.add(MOTION_OK, () => {
      gsap.to(sceneState, {
        scroll: 1,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 0.6 },
      });
      gsap.to(copy.current, {
        autoAlpha: 0,
        y: -70,
        ease: "power1.in",
        scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${window.innerHeight * 0.42}`, scrub: true },
      });
    });
    return () => {
      media.revert();
      sceneState.scroll = 0;
    };
  }, []);

  const showScene = ready && tier !== "none" && !lost;

  return (
    <div ref={root} data-hero-drag className="relative h-[175svh] motion-reduce:h-svh">
      <div className="sticky top-0 h-svh overflow-hidden">
        <div className="enter-fade absolute inset-0" aria-hidden>
          {showScene ? (
            <SceneBoundary fallback={<Poster />}>
              <HeroScene
                tier={tier === "high" ? "high" : "low"}
                animated={!reducedMotion}
                active={active}
                onContextLost={() => setLost(true)}
              />
            </SceneBoundary>
          ) : (
            ready && <Poster />
          )}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,var(--color-void)_0%,rgb(8_9_11/0.72)_34%,transparent_62%)] md:bg-[linear-gradient(to_right,rgb(8_9_11/0.82)_0%,rgb(8_9_11/0.35)_42%,transparent_64%)]"
        />
        <div ref={copy} className="relative h-full">
          {children}
        </div>
      </div>
    </div>
  );
}
