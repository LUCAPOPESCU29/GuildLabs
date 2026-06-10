"use client";

/**
 * App-wide client providers. Wraps next-themes (unchanged), TanStack Query for
 * server-state, a Radix Tooltip provider, and the Sonner toaster — all themed
 * to the existing OKLCH tokens so nothing here alters the visual identity.
 */

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useTheme } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Toaster } from "sonner";
import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";
import { CommandPalette } from "@/components/command-palette";
import { ShortcutsDialog } from "@/components/shortcuts-dialog";
import type { ComponentProps } from "react";

/** Thin site-wide reading-progress bar pinned to the very top of the viewport. */
function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, reduce ? { duration: 0 } : { stiffness: 120, damping: 30, mass: 0.3 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[65] h-0.5 origin-left bg-gradient-to-r from-primary via-secondary to-accent"
    />
  );
}

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      theme={(resolvedTheme as "light" | "dark") ?? "dark"}
      gap={10}
      toastOptions={{
        classNames: {
          toast:
            "glass !rounded-2xl !border-card-border !text-foreground !font-sans",
          title: "!font-display !font-bold",
          description: "!text-muted-foreground",
          actionButton: "!bg-primary !text-primary-foreground !rounded-full",
          cancelButton: "!bg-muted !text-muted-foreground !rounded-full",
          error: "!text-destructive",
          success: "!text-success",
        },
      }}
    />
  );
}

export function Providers({
  children,
  ...themeProps
}: ComponentProps<typeof NextThemesProvider>) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        },
      })
  );

  return (
    <NextThemesProvider {...themeProps}>
      <QueryClientProvider client={queryClient}>
        <Tooltip.Provider delayDuration={200} skipDelayDuration={400}>
          <ScrollProgress />
          {children}
          <CommandPalette />
          <ShortcutsDialog />
        </Tooltip.Provider>
        <ThemedToaster />
      </QueryClientProvider>
    </NextThemesProvider>
  );
}
