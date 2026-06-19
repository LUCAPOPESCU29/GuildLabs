"use client";

/**
 * Per-bot "what it does" feature bands, built on <SectionWithMockup/>. Each
 * shows an on-brand Discord-style mockup of the bot in action (no stock photos)
 * with a short description. Dropped into each bot's product page.
 */

import * as React from "react";
import { SectionWithMockup } from "@/components/ui/section-with-mockup";

// ── Shared Discord-mock chrome ────────────────────────────────────────────────
function MockShell({ channel, children }: { channel: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#313338]">
      <div className="flex items-center gap-1.5 bg-[#1e1f22] px-3 py-2">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-1.5 font-mono text-[11px] text-white/40">#{channel}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function BotRow({ initial, accent, children }: { initial: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ background: accent }}>
        {initial}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-white">GuildLabs</span>
          <span className="rounded bg-[#5865f2] px-1 py-0.5 text-[0.55rem] font-bold uppercase text-white">Bot</span>
        </div>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  );
}

function UserRow({ text }: { text: string }) {
  return (
    <div className="mb-3 flex gap-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/15 text-xs font-bold text-white">U</span>
      <div>
        <div className="text-sm font-semibold text-white/85">you</div>
        <div className="mt-0.5 font-mono text-[13px] text-white/70">{text}</div>
      </div>
    </div>
  );
}

const UP = "#16c784";
const DOWN = "#ea3943";

function Embed({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-md bg-[#2b2d31] p-3" style={{ borderLeft: `3px solid ${color}` }}>
      {children}
    </div>
  );
}

function Spark({ up }: { up: boolean }) {
  const d = up
    ? "M0,34 L18,28 L36,30 L54,18 L72,22 L90,8 L108,12 L126,4"
    : "M0,6 L18,12 L36,9 L54,20 L72,16 L90,28 L108,24 L126,34";
  const c = up ? UP : DOWN;
  return (
    <svg viewBox="0 0 126 40" className="mt-2 h-12 w-full" preserveAspectRatio="none">
      <path d={`${d} L126,40 L0,40 Z`} fill={c} opacity="0.14" />
      <path d={d} fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── ChartIt ───────────────────────────────────────────────────────────────────
function ChartTicker({ name, sym, price, change, up }: { name: string; sym: string; price: string; change: string; up: boolean }) {
  return (
    <Embed color={up ? UP : DOWN}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-white">{name}</div>
          <div className="font-mono text-[11px] text-white/40">{sym}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm font-bold text-white">{price}</div>
          <div className="font-mono text-[11px] font-semibold" style={{ color: up ? UP : DOWN }}>{change}</div>
        </div>
      </div>
      <Spark up={up} />
      <div className="mt-1.5 text-[10px] text-white/30">Yahoo Finance · for information only, not financial advice</div>
    </Embed>
  );
}

export function ChartItFeature() {
  return (
    <SectionWithMockup
      accent="var(--coral)"
      title={<>Live charts,<br />right in chat.</>}
      description={<>Type <span className="font-mono text-white/80">/chart AAPL</span> and ChartIt pulls a live quote from Yahoo Finance and drops a clean price chart — stocks, crypto, ETFs, indices. Watchlists, comparisons, and price alerts keep the market in your server, no dashboards or API keys.</>}
      primaryMockup={
        <MockShell channel="markets">
          <UserRow text="/chart AAPL" />
          <BotRow initial="C" accent="#16c784">
            <ChartTicker name="Apple Inc." sym="AAPL · NASDAQ" price="$291.13" change="▲ +1.24%" up />
          </BotRow>
        </MockShell>
      }
      secondaryMockup={
        <MockShell channel="watchlist">
          <BotRow initial="C" accent="#16c784">
            <ChartTicker name="Bitcoin" sym="BTC-USD" price="$64,210" change="▼ −2.08%" up={false} />
          </BotRow>
        </MockShell>
      }
    />
  );
}

// ── Maven ─────────────────────────────────────────────────────────────────────
export function MavenFeature() {
  return (
    <SectionWithMockup
      reverseLayout
      accent="var(--accent)"
      title={<>Your community<br />already answered that.</>}
      description={<>Maven recognizes a repeat question and links the asker to the answer your team already wrote — instantly, no mod pinged. It runs on a local model, so questions never leave your server and there&apos;s no per-message bill. That&apos;s why it&apos;s free.</>}
      primaryMockup={
        <MockShell channel="support">
          <UserRow text="how do I get verified here?" />
          <BotRow initial="M" accent="#2dd4bf">
            <Embed color="#2dd4bf">
              <div className="text-xs font-bold text-[#2dd4bf]">Asked &amp; answered before ✓</div>
              <div className="mt-1.5 text-[13px] leading-relaxed text-[#dbdee1]">
                Head to <span className="font-mono text-white">#verify</span> and react with ✅ on the pinned message. A mod approves new members within the hour.
              </div>
              <div className="mt-2 text-[11px] text-white/35">Matched from a question answered 3 weeks ago · jump to original ↗</div>
            </Embed>
          </BotRow>
        </MockShell>
      }
      secondaryMockup={
        <MockShell channel="general">
          <BotRow initial="M" accent="#2dd4bf">
            <Embed color="#2dd4bf">
              <div className="text-xs font-bold text-[#2dd4bf]">42 answers indexed</div>
              <div className="mt-1.5 text-[13px] text-[#dbdee1]">Rules · roles · verification · events · FAQ — all instantly searchable.</div>
            </Embed>
          </BotRow>
        </MockShell>
      }
    />
  );
}

// ── Construct ─────────────────────────────────────────────────────────────────
function Channel({ name }: { name: string }) {
  return <div className="font-mono text-[12px] text-white/55">#{name}</div>;
}

export function ConstructFeature() {
  return (
    <SectionWithMockup
      accent="var(--primary)"
      title={<>Describe it.<br />Deploy it.</>}
      description={<>Tell Construct what you want — &ldquo;a crypto trading community with market channels and holder roles&rdquo; — and the AI designs the whole server: categories, channels, roles, and permissions. Review and edit everything, then deploy it to Discord in one pass.</>}
      primaryMockup={
        <MockShell channel="builder">
          <div className="rounded-md bg-[#2b2d31] p-3">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Your prompt</div>
            <div className="mt-1 text-[13px] text-[#dbdee1]">&ldquo;A crypto trading community with market channels, holder roles, and a not-financial-advice disclaimer.&rdquo;</div>
          </div>
          <div className="mt-3 rounded-md bg-[#2b2d31] p-3" style={{ borderLeft: "3px solid var(--primary)" }}>
            <div className="text-xs font-bold text-white">📈 MARKETS</div>
            <div className="mt-1.5 space-y-1">
              <Channel name="price-talk" />
              <Channel name="ta-and-charts" />
              <Channel name="alpha" />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Admin", "Mod", "Holder", "Member"].map((r) => (
                <span key={r} className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/80">{r}</span>
              ))}
            </div>
          </div>
        </MockShell>
      }
      secondaryMockup={
        <MockShell channel="deploy">
          <div className="rounded-md bg-[#2b2d31] p-3 text-center">
            <div className="text-2xl">✅</div>
            <div className="mt-1 text-sm font-bold text-white">Deployed</div>
            <div className="mt-0.5 text-[11px] text-white/45">6 channels · 4 roles · 3 categories</div>
          </div>
        </MockShell>
      }
    />
  );
}
