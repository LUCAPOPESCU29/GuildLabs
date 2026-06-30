"use client";

import * as React from "react";

/**
 * Tiny localStorage progress tracker for the learn academy. Keys are arbitrary
 * strings (e.g. "quiz:basics", "lab:dice", "workshop:simple"). SSR-safe — reads
 * after mount so there's no hydration mismatch.
 */

const KEY = "guildlabs:learn";
type Progress = Record<string, boolean>;

export function useLearnProgress() {
  const [done, setDone] = React.useState<Progress>({});

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
      if (raw) setDone(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const mark = React.useCallback((id: string, value = true) => {
    setDone((d) => {
      const next = { ...d, [id]: value };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { done, mark };
}
