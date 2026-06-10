"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { buttonMotion } from "@/lib/motion";
import { useMagnetic } from "@/lib/use-magnetic";

const buttonVariants = cva(
  // transition is scoped to color/shadow only — framer-motion owns the transform
  // (scale on hover/tap) so the two don't fight over the same property.
  "group/btn relative isolate inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full font-display text-sm font-bold tracking-tight outline-none transition-[color,background-color,box-shadow,border-color] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:brightness-110 shadow-[0_10px_30px_-8px_color-mix(in_oklab,var(--primary)_70%,transparent)]",
        accent:
          "bg-accent text-accent-foreground hover:brightness-110 shadow-[0_10px_30px_-8px_color-mix(in_oklab,var(--accent)_70%,transparent)]",
        glass:
          "border border-white/25 bg-white/10 text-current backdrop-blur-md hover:bg-white/20",
        outline:
          "border border-[color-mix(in_oklab,var(--foreground)_18%,transparent)] bg-transparent text-foreground hover:bg-muted",
        ghost: "bg-transparent text-foreground hover:bg-muted",
        destructive: "bg-destructive text-white hover:brightness-110",
      },
      size: {
        sm: "h-9 px-4",
        default: "h-11 px-6",
        lg: "h-13 px-8 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  }
);

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref" | "children">,
    VariantProps<typeof buttonVariants> {
  children?: React.ReactNode;
  /** Opt-in magnetic cursor-follow (primary CTAs). Desktop + motion-on only. */
  magnetic?: boolean;
  /** Show the hover sheen sweep (default true). */
  sheen?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, magnetic = false, sheen = true, children, ...props }, ref) => {
    const reduce = useReducedMotion();
    const magRef = useMagnetic<HTMLButtonElement>(!!magnetic && !reduce);

    // Merge the forwarded ref with the magnetic ref.
    const setRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        magRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      },
      [ref, magRef]
    );

    return (
      <motion.button
        ref={setRef}
        className={cn(buttonVariants({ variant, size }), className)}
        whileHover={reduce ? undefined : buttonMotion.whileHover}
        whileTap={reduce ? undefined : buttonMotion.whileTap}
        {...props}
      >
        {sheen && !reduce && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 -translate-x-[130%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-[600ms] ease-out group-hover/btn:translate-x-[130%]"
          />
        )}
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
