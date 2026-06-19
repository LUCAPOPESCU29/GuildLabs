"use client";

/**
 * "Queen — coming soon" teaser for the landing page.
 *
 * Design: Waitlist/Coming-Soon pattern in a dark, OLED-ish band (per
 * ui-ux-pro-max) — anticipation, regal-violet accent highlights, minimal glow,
 * prominent capture, visible focus. Cohesive with the homepage night-sky CTA
 * but themed to Queen's accent (--secondary). Reduced-motion safe.
 *
 * Queen is the studio's in-server AI assistant ("ChatGPT in your Discord"):
 * @mention or /ask and it reasons in-channel, summarizes threads, and runs on
 * a local model so messages never leave the server. Distinct from Maven, which
 * surfaces the community's *own* answered knowledge.
 */

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useMediaQuery } from "@/lib/use-media-query";
import { Crown, Sparkles, Lock, MessageSquare, ScrollText, Loader2, Check, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/site/reveal";

const ACCENT = "var(--secondary)"; // regal violet
type Status = "idle" | "sending" | "done" | "error";

const CHIPS = [
  { icon: MessageSquare, label: "Answers in any channel" },
  { icon: ScrollText, label: "Summarizes long threads" },
  { icon: Lock, label: "Runs on your own model — fully private" },
];

export function QueenTeaser() {
  const reduceRaw = useReducedMotion();
  // Treat phones like reduced-motion for the heavy animated-blur backdrop +
  // shimmer (they're the expensive bits; the form interactions stay lively).
  const phone = useMediaQuery("(max-width: 768px)");
  const reduce = reduceRaw || phone;
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending" || status === "done") return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email.");
      return;
    }
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), product: "Queen" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || "Something went wrong — try again.");
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setError("Network hiccup — try again.");
      setStatus("error");
    }
  }

  return (
    <section className="px-4 py-20">
      <Reveal>
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem]" style={{ ["--queen" as string]: ACCENT }}>
          {/* ── Dark throne backdrop ─────────────────────────────────────── */}
          <div
            aria-hidden
            className="grain absolute inset-0 overflow-hidden rounded-[2.5rem]"
            style={{ background: "linear-gradient(160deg, #15101f 0%, #1c1330 50%, #0e0a17 100%)" }}
          >
            {/* blueprint dot-grid, faded toward the bottom */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage: "radial-gradient(circle, white 1px, transparent 1.4px)",
                backgroundSize: "22px 22px",
                maskImage: "radial-gradient(120% 100% at 50% 0%, black, transparent 75%)",
                WebkitMaskImage: "radial-gradient(120% 100% at 50% 0%, black, transparent 75%)",
              }}
            />
            {/* violet aurora — drifts unless reduced-motion */}
            <motion.div
              className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full opacity-40 blur-3xl"
              style={{ background: ACCENT }}
              animate={reduce ? undefined : { x: [0, 36, 0], y: [0, 28, 0] }}
              transition={{ duration: 16, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
            />
            <motion.div
              className="pointer-events-none absolute -bottom-28 -left-16 size-96 rounded-full opacity-25 blur-3xl"
              style={{ background: "color-mix(in oklab, var(--queen) 70%, #ec4899)" }}
              animate={reduce ? undefined : { x: [0, -30, 0], y: [0, -24, 0] }}
              transition={{ duration: 20, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
            />
            {/* faint sparkles */}
            <span className="absolute left-[14%] top-[24%] size-1 rounded-full bg-white/70 animate-twinkle" />
            <span className="absolute right-[20%] top-[34%] size-1.5 rounded-full bg-white/60 animate-twinkle [animation-delay:1.1s]" />
            <span className="absolute left-[28%] bottom-[28%] size-1 rounded-full bg-white/50 animate-twinkle [animation-delay:0.7s]" />
          </div>

          {/* ── Content ──────────────────────────────────────────────────── */}
          <div className="relative grid gap-10 px-6 py-16 text-white sm:px-10 sm:py-20 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
            <div>
              {/* Coming-soon pill with shimmer */}
              <span className="relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-[0.72rem] font-black uppercase tracking-[0.14em] backdrop-blur-sm">
                <Sparkles className="size-3.5" style={{ color: ACCENT }} /> Coming soon
                {!reduce && (
                  <motion.span
                    aria-hidden
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)" }}
                    initial={{ x: "-120%" }}
                    animate={{ x: "120%" }}
                    transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 2.4, ease: "easeInOut" }}
                  />
                )}
              </span>

              {/* Lockup */}
              <div className="mt-6 flex items-center gap-3.5">
                <span className="grid size-14 place-items-center rounded-2xl ring-1 ring-white/15" style={{ background: "color-mix(in oklab, var(--queen) 26%, transparent)" }}>
                  <Crown className="size-7" style={{ color: "color-mix(in oklab, var(--queen) 55%, white)" }} />
                </span>
                <span className="font-display text-5xl font-black tracking-tight sm:text-6xl">Queen</span>
              </div>

              <h2 className="mt-6 font-display text-3xl font-black leading-[1.02] tracking-tight text-balance sm:text-4xl">
                Your server&apos;s own AI. <span style={{ color: "color-mix(in oklab, var(--queen) 50%, white)" }}>@mention it</span> and it answers — in context, in your channels.
              </h2>

              {/* Capability chips */}
              <ul className="mt-7 flex flex-wrap gap-2.5">
                {CHIPS.map((c) => (
                  <li key={c.label} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-sm text-white/85">
                    <c.icon className="size-3.5" style={{ color: "color-mix(in oklab, var(--queen) 55%, white)" }} />
                    {c.label}
                  </li>
                ))}
              </ul>

              {/* Queen vs Maven */}
              <p className="mt-6 max-w-lg text-sm leading-relaxed text-white/60">
                Not to be confused with <span className="font-semibold text-white/80">Maven</span>, which surfaces your community&apos;s own answered questions. <span className="font-semibold text-white/80">Queen</span> is a general assistant that reasons — ask it anything.
              </p>
            </div>

            {/* ── Waitlist capture ───────────────────────────────────────── */}
            <div className="rounded-3xl border border-white/12 bg-white/[0.05] p-6 backdrop-blur-sm">
              {status === "done" ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <motion.span
                    className="grid size-14 place-items-center rounded-full"
                    style={{ background: "color-mix(in oklab, var(--queen) 28%, transparent)" }}
                    initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  >
                    <Check className="size-7" style={{ color: "color-mix(in oklab, var(--queen) 55%, white)" }} strokeWidth={2.5} />
                  </motion.span>
                  <p className="mt-4 font-display text-xl font-black">You&apos;re on the list 👑</p>
                  <p className="mt-1 text-sm text-white/60">We&apos;ll email you the moment Queen opens up.</p>
                </div>
              ) : (
                <form onSubmit={submit} noValidate>
                  <p className="font-display text-lg font-bold">Get early access</p>
                  <p className="mt-1 text-sm text-white/60">Be first in line when Queen launches. No spam — one email, that&apos;s it.</p>

                  <div className="mt-5">
                    <label htmlFor="queen-email" className="sr-only">Email address</label>
                    <input
                      id="queen-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (error) setError(null); }}
                      placeholder="you@server.gg"
                      aria-invalid={status === "error"}
                      aria-describedby={error ? "queen-error" : undefined}
                      className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-[0.95rem] text-white outline-none transition-colors placeholder:text-white/35 focus-visible:border-transparent focus-visible:ring-2"
                      style={{ ["--tw-ring-color" as string]: ACCENT }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-display font-bold text-white shadow-lg transition-[transform,filter] hover:brightness-110 active:scale-[0.99] disabled:opacity-70 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                    style={{ background: `linear-gradient(135deg, ${ACCENT}, color-mix(in oklab, var(--queen) 60%, #ec4899))` }}
                  >
                    {status === "sending" ? <><Loader2 className="size-4 animate-spin" /> Adding you…</> : <>Notify me <ArrowRight className="size-4" /></>}
                  </button>

                  <p id="queen-error" aria-live="polite" className="mt-2 min-h-[1.1rem] text-xs text-rose-300">
                    {error}
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
