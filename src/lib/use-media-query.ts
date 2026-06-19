"use client";

import * as React from "react";

/**
 * SSR-safe media-query hook. Returns `false` on the server and first paint,
 * then updates after mount — so render-time branches never cause hydration
 * mismatches. Used to dial down expensive animations on phones.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);
  React.useEffect(() => {
    const m = window.matchMedia(query);
    const update = () => setMatches(m.matches);
    update();
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, [query]);
  return matches;
}
