/** Scroll length of the cinematic between the stack network and Expertise. */
export const FINALE_SVH = 190;
/** The last part of the cinematic, where Expertise dissolves in over the shockwave. */
export const DISSOLVE_SVH = 45;

export const smoothstep = (value: number, low: number, high: number) => {
  const t = Math.min(1, Math.max(0, (value - low) / (high - low)));
  return t * t * (3 - 2 * t);
};
