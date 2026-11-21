/** Mutable bridge between DOM events and the render loop. Avoids React re-renders per frame. */
export const sceneState = {
  /** Hero scroll progress, 0 to 1. */
  scroll: 0,
  pointer: { x: 0, y: 0 },
};
