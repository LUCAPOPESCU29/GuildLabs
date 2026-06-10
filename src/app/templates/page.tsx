"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Layers, Zap, Sparkles, Hash, Shield } from "lucide-react";
import { TEMPLATES } from "@/lib/seo-data/templates";
import { TemplateIconBadge, TEMPLATE_COLORS } from "@/components/templates/template-icon";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.065, delayChildren: 0.15 } },
};
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const card = {
  hidden: { opacity: 0, y: 36, scale: 0.97 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.55, ease: EASE },
  },
} as const;

function HeroItem({ delay, children, className }: { delay: number; children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const PILLS = [
  { icon: Layers,  label: "Pre-built channels" },
  { icon: Shield,  label: "Role hierarchy" },
  { icon: Zap,     label: "1-click deploy" },
  { icon: Hash,    label: "Bot configs" },
];

export default function TemplatesHub() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">

      {/* Dot-grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.028]"
        style={{
          backgroundImage:
            "radial-gradient(circle, oklch(0.68 0.18 268) 1.2px, transparent 1.2px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <div className="relative pt-24 pb-20">
        {/* Blurred orbs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -left-48 h-[700px] w-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, oklch(0.68 0.18 268 / 0.14), transparent 68%)", filter: "blur(1px)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-10 -right-40 h-[500px] w-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, oklch(0.72 0.16 300 / 0.1), transparent 68%)" }}
        />

        <div className="mx-auto max-w-6xl px-4">
          <HeroItem delay={0}>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Home
            </Link>
          </HeroItem>

          <HeroItem delay={0.08} className="mt-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              <Sparkles className="size-3.5" />
              {TEMPLATES.length} free server templates
            </span>
          </HeroItem>

          <HeroItem delay={0.16} className="mt-5">
            <h1 className="font-display text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
              Discord Server{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, oklch(0.68 0.18 268), oklch(0.72 0.16 300) 50%, oklch(0.78 0.16 165))",
                }}
              >
                Templates
              </span>
            </h1>
          </HeroItem>

          <HeroItem delay={0.24} className="mt-5">
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              Free templates for every community type — channels, roles, bots, and setup guides.
              Pick yours and build it with GuildLabs in minutes.
            </p>
          </HeroItem>

          <HeroItem delay={0.32} className="mt-8 flex flex-wrap gap-2.5">
            {PILLS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-2 rounded-full border border-card-border bg-card px-4 py-2 text-sm text-muted-foreground"
              >
                <Icon className="size-3.5 text-primary" />
                {label}
              </span>
            ))}
          </HeroItem>
        </div>
      </div>

      {/* ─── Card grid ────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 pb-36">
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {TEMPLATES.map((t) => {
            const colors = TEMPLATE_COLORS[t.slug];
            return (
              <motion.div key={t.slug} variants={card}>
                <Link
                  href={`/templates/${t.slug}`}
                  className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-card-border bg-card p-6 transition-all duration-300 hover:border-primary/35"
                  style={{ willChange: "transform" }}
                >
                  {/* Top-tint glow that slides in on hover */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 -top-px h-32 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background: colors
                        ? `linear-gradient(to bottom, ${colors.glow}, transparent)`
                        : undefined,
                    }}
                  />

                  {/* Gradient border shimmer on hover */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 ring-1 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      boxShadow: colors ? `0 0 0 1px ${colors.start}44, 0 8px 32px -8px ${colors.glow}` : undefined,
                    }}
                  />

                  <div className="relative flex items-start justify-between">
                    <TemplateIconBadge slug={t.slug} size="md" />
                    <div className="flex size-8 items-center justify-center rounded-full border border-card-border bg-muted transition-all duration-300 group-hover:border-primary/40 group-hover:bg-primary/10">
                      <ArrowRight className="size-3.5 text-muted-foreground transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                  </div>

                  <h2 className="relative mt-5 font-display text-xl font-black">{t.name}</h2>
                  <p className="relative mt-2 flex-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {t.description}
                  </p>

                  <div className="relative mt-5 flex items-center gap-2">
                    <span className="rounded-lg border border-card-border bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
                      {t.stats.avgChannels} channels
                    </span>
                    <span className="rounded-lg border border-card-border bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
                      {t.stats.avgRoles} roles
                    </span>
                    <span
                      className="ml-auto text-xs font-semibold transition-colors duration-200 group-hover:text-primary"
                      style={{ color: "var(--color-muted-foreground)" }}
                    >
                      Free →
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </main>
  );
}
