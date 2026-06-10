"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, ShieldCheck, FileText } from "lucide-react";
import * as yup from "yup";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const TOS_KEY = "construct:tos:v1";

export function hasAcceptedTos(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(TOS_KEY) === "1";
  } catch {
    return false;
  }
}

const schema = yup.object({
  agree: yup
    .boolean()
    .oneOf([true], "You must accept the terms to continue.")
    .required(),
  email: yup
    .string()
    .trim()
    .email("Enter a valid email, or leave it blank.")
    .optional(),
});

export function TosGate({ onAccept }: { onAccept: () => void }) {
  const reduce = useReducedMotion();
  const [agree, setAgree] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [errors, setErrors] = React.useState<{ agree?: string; email?: string }>({});
  const [accepted, setAccepted] = React.useState(false);

  async function submit() {
    try {
      await schema.validate({ agree, email: email || undefined }, { abortEarly: false });
      setErrors({});
      try {
        window.localStorage.setItem(TOS_KEY, "1");
      } catch {
        /* storage unavailable — proceed anyway */
      }
      setAccepted(true);
      // Let the confirm animation play, then advance.
      window.setTimeout(onAccept, reduce ? 0 : 620);
    } catch (e) {
      if (e instanceof yup.ValidationError) {
        const next: { agree?: string; email?: string } = {};
        for (const err of e.inner) {
          if (err.path === "agree" && !next.agree) next.agree = err.message;
          if (err.path === "email" && !next.email) next.email = err.message;
        }
        setErrors(next);
      }
    }
  }

  return (
    <div className="glass-strong relative overflow-hidden rounded-3xl p-6 sm:p-8">
      <div className="flex items-center gap-2 text-xs font-medium text-secondary">
        <ShieldCheck className="size-4" /> ONE QUICK THING
      </div>
      <h2 className="mt-1 font-display text-2xl tracking-wide text-foreground sm:text-3xl">
        Agree to the terms
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Construct generates a server layout with AI. You stay in control — review and
        edit everything before anything is deployed.
      </p>

      <div className="mt-6 space-y-4">
        {/* Agree checkbox — real input + label so the nested Terms link stays valid */}
        <div>
          <label
            htmlFor="tos-agree"
            className={cn(
              "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors cursor-pointer",
              agree
                ? "border-primary/50 bg-primary/10"
                : errors.agree
                  ? "border-destructive/60 bg-destructive/5"
                  : "border-card-border bg-muted/30 hover:bg-muted/50"
            )}
          >
            <input
              id="tos-agree"
              type="checkbox"
              checked={agree}
              aria-describedby={errors.agree ? "tos-agree-err" : undefined}
              onChange={() => {
                setAgree((a) => !a);
                setErrors((e) => ({ ...e, agree: undefined }));
              }}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className={cn(
                "mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
                agree ? "border-primary bg-primary text-primary-foreground" : "border-card-border bg-card"
              )}
            >
              <AnimatePresence>
                {agree && (
                  <motion.span
                    initial={reduce ? false : { scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  >
                    <Check className="size-4" strokeWidth={3} />
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
            <span className="text-sm text-foreground/90">
              I agree to the{" "}
              <Link
                href="/terms"
                target="_blank"
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-primary hover:underline"
              >
                Terms of Service
              </Link>{" "}
              and understand this is{" "}
              <span className="font-semibold">not financial advice</span> — I&apos;m
              responsible for what I deploy to my server.
            </span>
          </label>
          {errors.agree && (
            <p id="tos-agree-err" role="alert" className="mt-1.5 px-1 text-xs text-destructive">
              {errors.agree}
            </p>
          )}
        </div>

        {/* Optional email (lead capture) */}
        <div>
          <label htmlFor="tos-email" className="mb-1.5 block px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Email <span className="font-normal normal-case tracking-normal">(optional — for product updates)</span>
          </label>
          <input
            id="tos-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((er) => ({ ...er, email: undefined }));
            }}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "tos-email-err" : undefined}
            placeholder="you@example.com"
            className="glass-input w-full rounded-2xl px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-ring"
          />
          {errors.email && (
            <p id="tos-email-err" role="alert" className="mt-1.5 px-1 text-xs text-destructive">
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button size="lg" onClick={submit} disabled={accepted} className="flex-1 sm:flex-none">
          {accepted ? (
            <motion.span
              className="inline-flex items-center gap-2"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Check className="size-5" strokeWidth={3} /> Thanks!
            </motion.span>
          ) : (
            <>
              <FileText className="size-5" /> Agree &amp; continue
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          We only store that you accepted, in this browser.
        </p>
      </div>
    </div>
  );
}
