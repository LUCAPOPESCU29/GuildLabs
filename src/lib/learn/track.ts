"use client";

/**
 * Tiny, dependency-free analytics for the learn academy. It never blocks and
 * never throws: if a provider (Plausible or gtag) is on the page it forwards the
 * event, otherwise it falls back to a debug log in development. No paid SDK, no
 * PII — just funnel events so we can see where learners drop off.
 */

export type LearnEvent =
  | "course_start"
  | "step_pass"
  | "solution_revealed"
  | "hint_revealed"
  | "quiz_complete"
  | "course_complete";

type Props = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Props }) => void;
    gtag?: (command: string, event: string, params?: Props) => void;
  }
}

export function trackLearn(event: LearnEvent, props: Props = {}): void {
  if (typeof window === "undefined") return;
  try {
    if (typeof window.plausible === "function") {
      window.plausible(`learn:${event}`, { props });
    } else if (typeof window.gtag === "function") {
      window.gtag("event", `learn_${event}`, props);
    } else if (process.env.NODE_ENV !== "production") {
      console.debug(`[learn] ${event}`, props);
    }
  } catch {
    /* analytics must never break the lesson */
  }
}
