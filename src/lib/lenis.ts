"use client";

import type Lenis from "lenis";

let instance: Lenis | null = null;

export const setLenis = (lenis: Lenis | null) => {
  instance = lenis;
};

/** Scrolls through Lenis when it is active, and natively otherwise. */
export function scrollToY(y: number) {
  if (instance) instance.scrollTo(y, { duration: 0.9 });
  else window.scrollTo({ top: y });
}
