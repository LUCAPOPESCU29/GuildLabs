/**
 * Shared motion language (from the `animate` skill's guidance, matched to the
 * cubic-bezier already used by globals.css `anim-rise`/`anim-pop`).
 *
 * Division of labor: framer-motion owns interaction state (hover/tap/focus,
 * presence); GSAP owns scroll-driven + text effects. Both use the same
 * ease-out-expo curve so the whole site feels consistent.
 */

/** ease-out-expo — confident, decisive. Used by framer (cubic array) + CSS. */
export const EASE_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_QUART = [0.25, 1, 0.5, 1] as const;

/** Durations (seconds) by purpose. Exits run at ~75% of entrance. */
export const DUR = {
  feedback: 0.14, // button press, toggle
  state: 0.22, // hover, menu open
  layout: 0.36, // accordion, dropdown
  entrance: 0.6, // first-view reveals
} as const;

/** GSAP-equivalent easing string for the same feel. */
export const GSAP_EASE = "expo.out";

// ── framer-motion presets ────────────────────────────────────────────────────

/** Subtle hover lift + press, for the Button primitive. */
export const buttonMotion = {
  whileHover: { scale: 1.03, transition: { duration: DUR.state, ease: EASE_EXPO } },
  whileTap: { scale: 0.97, transition: { duration: DUR.feedback, ease: EASE_EXPO } },
} as const;

/** Anchored dropdown / panel reveal (origin top). */
export const dropdownMotion = {
  initial: { opacity: 0, y: -8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: DUR.state, ease: EASE_EXPO } },
  exit: { opacity: 0, y: -6, scale: 0.98, transition: { duration: DUR.feedback, ease: EASE_EXPO } },
} as const;

/** Staggered list/menu items. */
export const staggerParent = {
  animate: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
} as const;

export const staggerChild = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: DUR.state, ease: EASE_EXPO } },
} as const;
