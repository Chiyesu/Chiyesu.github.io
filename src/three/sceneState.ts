/** Mutable bridge between DOM events and the render loop. Avoids React re-renders per frame. */
export const sceneState = {
  /** Hero scroll progress, 0 to 1. */
  scroll: 0,
  pointer: { x: 0, y: 0 },
  /** How far the sculpture has emerged from the splash screen. Stays at 1 when there is no splash. */
  intro: typeof document !== "undefined" && document.documentElement.classList.contains("splash-hold") ? 0 : 1,
  /** True once the sculpture has been loaded and drawn on the GPU. */
  loaded: false,
};
