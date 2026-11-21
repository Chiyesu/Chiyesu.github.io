"use client";

import { useEffect, useRef } from "react";
import { useCapabilities } from "@/lib/capabilities";
import { gsap } from "@/lib/gsap";

/** A trailing ring that accompanies the native cursor, which always stays visible. */
export function Cursor() {
  const { finePointer, reducedMotion } = useCapabilities();
  const enabled = finePointer && !reducedMotion;
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ring.current;
    if (!enabled || !element) return;
    const x = gsap.quickTo(element, "x", { duration: 0.35, ease: "power3" });
    const y = gsap.quickTo(element, "y", { duration: 0.35, ease: "power3" });

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x(event.clientX);
      y(event.clientY);
      element.style.opacity = "1";
      const target = event.target instanceof Element ? event.target : null;
      const named = target?.closest<HTMLElement>("[data-cursor]");
      const interactive = target?.closest("a, button, [role='tab']");
      const text = named?.dataset.cursor ?? "";
      if (label.current) label.current.textContent = text;
      gsap.to(element.firstElementChild, {
        scale: text ? 2.5 : interactive ? 1.55 : 1,
        backgroundColor: text ? "rgba(127,211,232,0.92)" : "rgba(127,211,232,0)",
        borderColor: interactive ? "rgba(127,211,232,0.9)" : "rgba(255,255,255,0.3)",
        duration: 0.3,
        overwrite: "auto",
      });
    };
    const onLeave = () => {
      element.style.opacity = "0";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div ref={ring} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[80] opacity-0">
      <div className="absolute -left-4 -top-4 h-8 w-8 rounded-full border border-white/30" />
      <span ref={label} className="absolute -translate-x-1/2 -translate-y-1/2 font-mono text-[0.68rem] uppercase text-void" />
    </div>
  );
}
