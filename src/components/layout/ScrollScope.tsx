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
    media.add(`${MOTION_OK} and (min-width: 1024px)`, () => {
      const panels = Array.from(root.querySelectorAll<HTMLElement>("[data-stack]"));
      panels.slice(0, -1).forEach((panel, index) => {
        gsap.to(panel.querySelector("[data-stack-card]"), {
          scale: 0.94,
          opacity: 0.35,
          ease: "none",
          scrollTrigger: { trigger: panels[index + 1], start: "top bottom", end: "top top", scrub: true },
        });
      });
    });
    ScrollTrigger.refresh();

    return () => {
      observer.disconnect();
      media.revert();
    };
  }, []);

  return <div ref={scope}>{children}</div>;
}
