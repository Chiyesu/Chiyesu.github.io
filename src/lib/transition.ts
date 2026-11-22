/** Scroll length of the cinematic between the stack network and Expertise. */
export const FINALE_SVH = 190;
/** The last part of the cinematic, where Expertise dissolves in over the shockwave. */
export const DISSOLVE_SVH = 45;
/** Scroll length of the warp cinematic between Expertise and Selected Work. */
export const BRIDGE_SVH = 340;
/** How long Expertise stays pinned underneath while the warp fades in. WorkBridge's negative margin must equal 100 plus this. */
export const BRIDGE_IN_SVH = 40;

export const smoothstep = (value: number, low: number, high: number) => {
  const t = Math.min(1, Math.max(0, (value - low) / (high - low)));
  return t * t * (3 - 2 * t);
};
