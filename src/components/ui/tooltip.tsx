"use client";

/**
 * Themed Radix tooltip. Accessible (keyboard + screen-reader), Esc-dismiss,
 * collision-aware. Styled to the existing tokens so it reads as native UI.
 * The Tooltip.Provider lives at the app root (see providers.tsx).
 */

import * as React from "react";
import * as RT from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export function Tooltip({
  content,
  children,
  side = "top",
  className,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}) {
  return (
    <RT.Root>
      <RT.Trigger asChild>{children}</RT.Trigger>
      <RT.Portal>
        <RT.Content
          side={side}
          sideOffset={6}
          collisionPadding={8}
          className={cn(
            "z-50 max-w-xs rounded-lg border border-card-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground shadow-[var(--card-shadow)]",
            className
          )}
        >
          {content}
          <RT.Arrow className="fill-card" width={11} height={5} />
        </RT.Content>
      </RT.Portal>
    </RT.Root>
  );
}
