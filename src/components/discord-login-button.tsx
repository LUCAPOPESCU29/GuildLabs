"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { DiscordIcon } from "@/components/icons/discord";

/**
 * Discord-branded login button using the official blurple (#5865F2),
 * the Discord glyph, and the standard "Continue with Discord" copy.
 */
export const DiscordLoginButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    label?: string;
    fullWidth?: boolean;
  }
>(({ className, label = "Continue with Discord", fullWidth = true, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      "inline-flex items-center justify-center gap-2.5 rounded-full",
      "h-12 px-6 font-display text-base font-bold tracking-tight",
      "bg-[#5865F2] text-white",
      "shadow-[0_8px_24px_-8px_rgba(88,101,242,0.6)]",
      "transition-all duration-150 ease-out",
      "hover:bg-[#4752C4] hover:shadow-[0_10px_28px_-8px_rgba(88,101,242,0.7)]",
      "active:scale-[0.98]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5865F2] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "disabled:opacity-60 disabled:pointer-events-none cursor-pointer",
      fullWidth && "w-full",
      className
    )}
    {...props}
  >
    <DiscordIcon className="size-5" color="white" />
    {label}
  </button>
));
DiscordLoginButton.displayName = "DiscordLoginButton";
