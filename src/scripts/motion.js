/* One place asks the question every other module needs the answer to. */
export const reducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;
