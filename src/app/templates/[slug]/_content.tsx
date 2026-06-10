"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Hash, Users, Bot, Check, ChevronRight, Download, AlertTriangle, FileText, GitCompare } from "lucide-react";
import { type ServerTemplate, getTemplate } from "@/lib/seo-data/templates";
import { getBotCategory } from "@/lib/seo-data/bot-categories";
import { getComparison } from "@/lib/seo-data/comparisons";
import { TemplateIconBadge, TEMPLATE_COLORS } from "@/components/templates/template-icon";
import { ShimmerButton } from "@/components/fx/shimmer-button";
import { downloadBlueprint, wizardURL } from "@/lib/template-blueprint";

/* ─── shared easing ───────────────────────────────────────────────────── */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const DUR = 0.52;

/* ─── scroll-reveal wrapper ───────────────────────────────────────────── */
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
} as const;

const staggerItem = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DUR, ease: EASE },
  },
} as const;

function FadeSection({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      className={className}
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </motion.section>
  );
}

function FadeItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}

/* Strip emoji prefix like "📋│" to just the channel slug */
function channelName(raw: string) {
  const idx = raw.indexOf("│");
  return idx >= 0 ? raw.slice(idx + 1) : raw;
}

/* ─── hero stagger helper ─────────────────────────────────────────────── */
function HeroItem({
  delay,
  children,
  className,
}: {
  delay: number;
  children: React.ReactNode;
  className?: string;
}) {
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

/* ─── related-link card ───────────────────────────────────────────────── */
function RelatedCard({ href, label, sub }: { href: string; label: string; sub: string }) {
  return (
    <motion.div variants={staggerItem}>
      <Link
        href={href}
        className="group flex h-full flex-col rounded-2xl border border-card-border bg-card p-5 transition-all duration-200 hover:border-primary/35 hover:bg-muted/30"
      >
        <span className="flex items-center justify-between gap-2 font-display font-bold">
          {label}
          <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
        </span>
        <span className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{sub}</span>
      </Link>
    </motion.div>
  );
}

/* ─── component ───────────────────────────────────────────────────────── */
export function TemplateDetailContent({ t }: { t: ServerTemplate }) {
  const colors = TEMPLATE_COLORS[t.slug];

  const relatedTemplates = t.relatedSlugs
    .map((slug) => getTemplate(slug))
    .filter((x): x is ServerTemplate => Boolean(x))
    .map((x) => ({ href: `/templates/${x.slug}`, label: `Discord ${x.name} template`, sub: x.useCase }));

  const relatedBotGuides = (t.relatedBots ?? [])
    .map((slug) => getBotCategory(slug))
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .map((x) => ({ href: `/bots/${x.slug}`, label: `Best ${x.name.toLowerCase()} bots`, sub: x.name }));

  const relatedComparisons = (t.relatedComparisons ?? [])
    .map((slug) => getComparison(slug))
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .map((x) => ({ href: `/vs/${x.slug}`, label: `GuildLabs vs ${x.competitorName}`, sub: x.competitorTagline }));

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden pb-16 pt-24">
        {/* Gradient orbs */}
        {colors && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute -top-28 -left-36 h-[520px] w-[520px] rounded-full"
              style={{
                background: `radial-gradient(circle, ${colors.glow}, transparent 65%)`,
                filter: "blur(1px)",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 right-0 h-[340px] w-[340px] rounded-full"
              style={{
                background: `radial-gradient(circle, ${colors.glow}, transparent 65%)`,
              }}
            />
          </>
        )}

        {/* Dot-grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.026]"
          style={{
            backgroundImage:
              "radial-gradient(circle, oklch(0.68 0.18 268) 1.2px, transparent 1.2px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative mx-auto max-w-4xl px-4">
          {/* Breadcrumb */}
          <HeroItem delay={0}>
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Link href="/" className="transition-colors hover:text-foreground">
                Home
              </Link>
              <ChevronRight className="size-3.5" />
              <Link href="/templates" className="transition-colors hover:text-foreground">
                Templates
              </Link>
              <ChevronRight className="size-3.5" />
              <span className="text-foreground">{t.name}</span>
            </nav>
          </HeroItem>

          <HeroItem delay={0.08} className="mt-10">
            <TemplateIconBadge slug={t.slug} size="lg" />
          </HeroItem>

          <HeroItem delay={0.16} className="mt-5">
            <h1 className="font-display text-5xl font-black leading-tight tracking-tight sm:text-6xl">
              Discord {t.name} Template
            </h1>
          </HeroItem>

          <HeroItem delay={0.22} className="mt-5">
            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {t.description}
            </p>
          </HeroItem>

          <HeroItem delay={0.27} className="mt-3">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Best for:</strong> {t.useCase}
            </p>
          </HeroItem>

          {/* Stat pills */}
          <HeroItem delay={0.33} className="mt-7 flex flex-wrap gap-3">
            {[
              { icon: Hash,  label: `${t.stats.avgChannels} channels` },
              { icon: Users, label: `${t.stats.avgRoles} roles` },
              { icon: Users, label: `${t.stats.avgMembers} members` },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-2 rounded-full border border-card-border bg-card px-4 py-2 text-sm text-muted-foreground"
              >
                <Icon className="size-3.5 text-primary" />
                {label}
              </span>
            ))}
          </HeroItem>

          <HeroItem delay={0.40} className="mt-9 flex flex-wrap items-center gap-3">
            <ShimmerButton href={wizardURL(t.slug, t.name)} size="lg">
              Build this server free <ArrowRight className="size-4" />
            </ShimmerButton>
            <button
              type="button"
              onClick={() => downloadBlueprint(t)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-card-border bg-card px-6 py-3.5 text-base font-display font-bold text-foreground transition-all duration-200 hover:border-primary/50 hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Download className="size-4" />
              Download JSON
            </button>
          </HeroItem>
        </div>
      </div>

      {/* ── Content sections ─────────────────────────────────────── */}
      <div className="mx-auto max-w-4xl space-y-20 px-4 pb-36">

        {/* Intro / overview */}
        {t.intro && (
          <FadeSection>
            <FadeItem>
              <p className="text-lg leading-relaxed text-muted-foreground">
                {t.intro}
              </p>
            </FadeItem>
          </FadeSection>
        )}

        {/* Channels */}
        <FadeSection>
          <FadeItem>
            <h2 className="font-display text-3xl font-black tracking-tight">
              Channels included
            </h2>
            <p className="mt-2 text-muted-foreground">
              Recommended channel structure for a {t.name.toLowerCase()}.
            </p>
          </FadeItem>
          <motion.div
            variants={staggerContainer}
            className="mt-7 overflow-hidden rounded-2xl border border-card-border"
          >
            {t.channels.map((ch) => (
              <motion.div
                key={ch.name}
                variants={staggerItem}
                className="flex items-start gap-4 border-b border-card-border bg-card px-5 py-3.5 last:border-b-0 transition-colors hover:bg-muted/40"
              >
                <div className="mt-0.5 flex shrink-0 items-center gap-1.5">
                  <Hash className="size-3.5 text-primary" />
                  <code className="font-mono text-sm font-medium text-primary">
                    {channelName(ch.name)}
                  </code>
                </div>
                <span className="text-sm leading-relaxed text-muted-foreground">
                  {ch.purpose}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </FadeSection>

        {/* Roles */}
        <FadeSection>
          <FadeItem>
            <h2 className="font-display text-3xl font-black tracking-tight">
              Role hierarchy
            </h2>
            <p className="mt-2 text-muted-foreground">
              Recommended roles and what they can do.
            </p>
          </FadeItem>
          <motion.div
            variants={staggerContainer}
            className="mt-7 grid gap-3 sm:grid-cols-2"
          >
            {t.roles.map((r) => (
              <motion.div
                key={r.name}
                variants={staggerItem}
                className="relative overflow-hidden rounded-xl border border-card-border bg-card p-4 transition-colors hover:bg-muted/30"
              >
                {r.color && (
                  <div
                    className="absolute inset-y-0 left-0 w-1 rounded-l-xl"
                    style={{ backgroundColor: r.color }}
                  />
                )}
                <div className="flex items-center gap-2 pl-3">
                  {r.color && (
                    <span
                      className="size-2.5 shrink-0 rounded-full ring-2 ring-card"
                      style={{ backgroundColor: r.color }}
                    />
                  )}
                  <span className="font-display font-bold">{r.name}</span>
                </div>
                <p className="mt-1.5 pl-3 text-sm leading-relaxed text-muted-foreground">
                  {r.purpose}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </FadeSection>

        {/* Bots */}
        <FadeSection>
          <FadeItem>
            <h2 className="font-display text-3xl font-black tracking-tight">
              Recommended bots
            </h2>
            <p className="mt-2 text-muted-foreground">
              The bots that work best for a {t.name.toLowerCase()}.
            </p>
          </FadeItem>
          <motion.div
            variants={staggerContainer}
            className="mt-7 grid gap-4 sm:grid-cols-3"
          >
            {t.bots.map((b) => (
              <motion.div
                key={b.name}
                variants={staggerItem}
                className="group relative overflow-hidden rounded-2xl border border-card-border bg-card p-5 transition-all duration-300 hover:border-primary/35"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 -top-px h-16 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background: colors
                      ? `linear-gradient(to bottom, ${colors.glow}, transparent)`
                      : undefined,
                  }}
                />
                <div className="relative flex size-10 items-center justify-center rounded-xl bg-primary/10">
                  <Bot className="size-5 text-primary" />
                </div>
                <p className="relative mt-3 font-display font-bold">{b.name}</p>
                <p className="relative mt-1 text-sm leading-relaxed text-muted-foreground">
                  {b.purpose}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </FadeSection>

        {/* Setup guide */}
        {t.setupGuide && t.setupGuide.length > 0 && (
          <FadeSection>
            <FadeItem>
              <h2 className="font-display text-3xl font-black tracking-tight">
                How to set up a {t.name.toLowerCase()}
              </h2>
              <p className="mt-2 text-muted-foreground">
                A step-by-step walkthrough — or skip it and let GuildLabs build the whole structure for you.
              </p>
            </FadeItem>
            <motion.ol variants={staggerContainer} className="mt-7 space-y-4">
              {t.setupGuide.map((step, i) => (
                <motion.li
                  key={step.title}
                  variants={staggerItem}
                  className="flex gap-4 rounded-2xl border border-card-border bg-card p-5 transition-colors hover:bg-muted/20"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 font-display text-sm font-bold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-display font-bold">{step.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </motion.li>
              ))}
            </motion.ol>
          </FadeSection>
        )}

        {/* Features */}
        <FadeSection>
          <FadeItem>
            <h2 className="font-display text-3xl font-black tracking-tight">
              Key features
            </h2>
          </FadeItem>
          <motion.ul
            variants={staggerContainer}
            className="mt-7 grid gap-3 sm:grid-cols-2"
          >
            {t.features.map((f) => (
              <motion.li
                key={f}
                variants={staggerItem}
                className="flex items-center gap-3 rounded-xl border border-card-border bg-card px-4 py-3 text-sm transition-colors hover:bg-muted/30"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Check className="size-3.5 text-primary" />
                </span>
                {f}
              </motion.li>
            ))}
          </motion.ul>
        </FadeSection>

        {/* Common mistakes */}
        {t.mistakes && t.mistakes.length > 0 && (
          <FadeSection>
            <FadeItem>
              <h2 className="font-display text-3xl font-black tracking-tight">
                Common mistakes to avoid
              </h2>
              <p className="mt-2 text-muted-foreground">
                The setup errors that quietly kill {t.name.toLowerCase()}s — and how to fix each one.
              </p>
            </FadeItem>
            <motion.div variants={staggerContainer} className="mt-7 space-y-3">
              {t.mistakes.map((m) => (
                <motion.div
                  key={m.mistake}
                  variants={staggerItem}
                  className="rounded-2xl border border-card-border bg-card p-5 transition-colors hover:bg-muted/20"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary" />
                    <h3 className="font-display font-bold">{m.mistake}</h3>
                  </div>
                  <p className="mt-2 pl-7 text-sm leading-relaxed text-muted-foreground">
                    <strong className="font-semibold text-foreground">Fix:</strong> {m.fix}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </FadeSection>
        )}

        {/* CTA banner */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card p-10 text-center"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              background: colors
                ? `radial-gradient(ellipse at 50% 0%, ${colors.start}, ${colors.end}, transparent 70%)`
                : "radial-gradient(ellipse at 50% 0%, oklch(0.68 0.18 268), transparent 70%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "radial-gradient(circle, oklch(0.68 0.18 268) 1.2px, transparent 1.2px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative">
            <h2 className="font-display text-3xl font-black tracking-tight">
              Build your {t.name.toLowerCase()} in minutes
            </h2>
            <p className="mt-3 text-muted-foreground">
              Use GuildLabs to deploy this template — channels, roles, and permissions set
              up correctly. Free and open source.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <ShimmerButton href={wizardURL(t.slug, t.name)} size="lg">
                Start building — it&apos;s free <ArrowRight className="size-4" />
              </ShimmerButton>
              <button
                type="button"
                onClick={() => downloadBlueprint(t)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-7 py-3.5 text-base font-display font-bold text-primary transition-all duration-200 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Download className="size-4" />
                Download JSON
              </button>
            </div>
          </div>
        </motion.div>

        {/* Related / internal links */}
        {(relatedTemplates.length > 0 ||
          relatedBotGuides.length > 0 ||
          relatedComparisons.length > 0) && (
          <FadeSection className="space-y-10">
            {relatedTemplates.length > 0 && (
              <div>
                <FadeItem>
                  <div className="flex items-center gap-2">
                    <FileText className="size-5 text-primary" />
                    <h2 className="font-display text-2xl font-black tracking-tight">
                      Related templates
                    </h2>
                  </div>
                </FadeItem>
                <motion.div variants={staggerContainer} className="mt-5 grid gap-3 sm:grid-cols-3">
                  {relatedTemplates.map((l) => (
                    <RelatedCard key={l.href} {...l} />
                  ))}
                </motion.div>
              </div>
            )}

            {relatedBotGuides.length > 0 && (
              <div>
                <FadeItem>
                  <div className="flex items-center gap-2">
                    <Bot className="size-5 text-primary" />
                    <h2 className="font-display text-2xl font-black tracking-tight">
                      Bot guides for this server
                    </h2>
                  </div>
                </FadeItem>
                <motion.div variants={staggerContainer} className="mt-5 grid gap-3 sm:grid-cols-3">
                  {relatedBotGuides.map((l) => (
                    <RelatedCard key={l.href} {...l} />
                  ))}
                </motion.div>
              </div>
            )}

            {relatedComparisons.length > 0 && (
              <div>
                <FadeItem>
                  <div className="flex items-center gap-2">
                    <GitCompare className="size-5 text-primary" />
                    <h2 className="font-display text-2xl font-black tracking-tight">
                      How GuildLabs compares
                    </h2>
                  </div>
                </FadeItem>
                <motion.div variants={staggerContainer} className="mt-5 grid gap-3 sm:grid-cols-2">
                  {relatedComparisons.map((l) => (
                    <RelatedCard key={l.href} {...l} />
                  ))}
                </motion.div>
              </div>
            )}
          </FadeSection>
        )}

        {/* FAQs */}
        <FadeSection>
          <FadeItem>
            <h2 className="font-display text-3xl font-black tracking-tight">
              Frequently asked questions
            </h2>
          </FadeItem>
          <motion.div variants={staggerContainer} className="mt-7 space-y-4">
            {t.faqs.map((f) => (
              <motion.div
                key={f.q}
                variants={staggerItem}
                className="rounded-2xl border border-card-border bg-card p-6 transition-colors hover:bg-muted/20"
              >
                <h3 className="font-display font-bold">{f.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </motion.div>
            ))}
          </motion.div>
        </FadeSection>
      </div>
    </>
  );
}
