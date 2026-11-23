"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap, MOTION_OK, ScrollTrigger } from "@/lib/gsap";

/**
 * Runs reveal and scroll effects for one page. Wrapping the content guarantees this effect
 * fires after it has hydrated, and limits queries to this route rather than hidden ones.
 */
export function ScrollScope({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scope.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.setAttribute("data-visible", "");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    root.querySelectorAll("[data-reveal]:not([data-visible])").forEach((node) => observer.observe(node));

    const media = gsap.matchMedia();
    media.add(MOTION_OK, () => {
      root.querySelectorAll<HTMLElement>("[data-parallax]").forEach((node) => {
        gsap.fromTo(
          node,
          { yPercent: -Number(node.dataset.parallax) },
          {
            yPercent: Number(node.dataset.parallax),
            ease: "none",
            scrollTrigger: { trigger: node.parentElement, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });
    });
    media.add(MOTION_OK, () => {
      // The first project keeps the section's gate, which holds it back until the warp has finished.
      const panels = Array.from(root.querySelectorAll<HTMLElement>("[data-stack]")).slice(1);
      panels.forEach((panel) => {
        const setGate = (self: ScrollTrigger) => {
          panel.dataset.sceneGate = String(self.progress);
        };
        gsap.fromTo(
          panel.querySelector("[data-stack-card]"),
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            ease: "none",
            scrollTrigger: { trigger: panel, start: "top 85%", end: "top 40%", scrub: true, onUpdate: setGate, onRefresh: setGate },
          },
        );
      });
      return () => panels.forEach((panel) => delete panel.dataset.sceneGate);
    });
    ScrollTrigger.refresh();

    return () => {
      observer.disconnect();
      media.revert();
    };
  }, []);

  return <div ref={scope}>{children}</div>;
}
