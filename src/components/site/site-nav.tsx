"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Menu, X, Search } from "lucide-react";
import { GuildLabsLogo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { DynamicIsland } from "@/components/dynamic-island";
import { dropdownMotion, staggerChild, EASE_EXPO } from "@/lib/motion";

type NavLink = { label: string; href: string; desc?: string };
type NavGroup = { label: string; items: NavLink[] };

const PRODUCTS: NavGroup = {
  label: "Products",
  items: [
    { label: "ChartIt", href: "/bots/chartit", desc: "Live stock & crypto charts" },
    { label: "Construct", href: "/bots/construct", desc: "Build & manage your server" },
    { label: "Maven", href: "/bots/maven", desc: "Community engagement" },
    { label: "All bots", href: "/bots", desc: "Browse the studio" },
    { label: "Templates", href: "/templates", desc: "Ready-made server setups" },
  ],
};

const RESOURCES: NavGroup = {
  label: "Resources",
  items: [
    { label: "Docs", href: "/docs", desc: "Command references" },
    { label: "Guides", href: "/guides", desc: "How-tos & playbooks" },
    { label: "Compare", href: "/vs", desc: "GuildLabs vs alternatives" },
    { label: "Changelog", href: "/changelog", desc: "What's new" },
    { label: "Status", href: "/status", desc: "Live bot uptime" },
    { label: "Wall of love", href: "/wall", desc: "What people say" },
  ],
};

const DIRECT: NavLink = { label: "Charts", href: "/stocks" };

export function SiteNav({ floating = false }: { floating?: boolean }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const groupActive = (g: NavGroup) => g.items.some((i) => isActive(i.href));

  const position = floating ? "fixed inset-x-0 top-0" : "sticky top-0";

  return (
    <header className={`${position} z-50`}>
      <div className="px-4 pt-[max(0.75rem,env(safe-area-inset-top,0.75rem))]">
        <motion.div
          initial={false}
          animate={{
            backgroundColor: scrolled
              ? "color-mix(in oklab, var(--card) 85%, transparent)"
              : "color-mix(in oklab, var(--card) 60%, transparent)",
          }}
          transition={reduce ? { duration: 0 } : { duration: 0.25, ease: EASE_EXPO }}
          className="nav-blur mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full px-3 py-2"
          style={{ boxShadow: scrolled ? "var(--card-shadow)" : "none" }}
        >
          {/* Left — logo + desktop nav */}
          <div className="flex items-center gap-1">
            <Link href="/" aria-label="GuildLabs home" className="mx-1 shrink-0">
              <GuildLabsLogo className="h-8 w-auto" />
            </Link>
            <span aria-hidden className="mx-1 hidden h-5 w-px bg-foreground/15 md:block" />
            <nav className="hidden items-center gap-0.5 md:flex" aria-label="Primary">
              <NavDropdown group={PRODUCTS} active={groupActive(PRODUCTS)} reduce={!!reduce} />
              <NavItem link={DIRECT} active={isActive(DIRECT.href)} />
              <NavDropdown group={RESOURCES} active={groupActive(RESOURCES)} reduce={!!reduce} />
            </nav>
          </div>

          {/* Right — controls + auth island */}
          <div className="flex items-center gap-1.5">
            {/* Command palette trigger (desktop pill) */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("guildlabs:command"))}
              aria-label="Open command menu"
              className="hidden items-center gap-2 rounded-full border border-card-border bg-muted/40 py-1.5 pl-3 pr-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer lg:flex"
            >
              <Search className="size-4" />
              <span>Search</span>
              <kbd className="rounded-md border border-card-border bg-card px-1.5 py-0.5 font-mono text-[0.65rem]">
                ⌘K
              </kbd>
            </button>
            {/* Command palette trigger (compact, small screens) */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("guildlabs:command"))}
              aria-label="Search"
              className="grid size-10 place-items-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer lg:hidden"
            >
              <Search className="size-5" />
            </button>
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <Link href="/dashboard" className="hidden sm:inline-flex">
              <Button size="sm" variant="ghost">Dashboard</Button>
            </Link>
            {/* Docked auth/server-switcher — anchored, never overlaps the bar */}
            <DynamicIsland />
            {/* Mobile toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className="grid size-10 place-items-center rounded-full text-foreground transition-colors hover:bg-muted md:hidden"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={reduce ? { duration: 0 } : { duration: 0.22, ease: EASE_EXPO }}
            className="px-4 md:hidden"
          >
            <div className="mx-auto mt-2 max-w-6xl overflow-hidden rounded-3xl border border-card-border bg-card p-3 shadow-lg">
              <MobileGroup group={PRODUCTS} onNavigate={() => setMobileOpen(false)} />
              <Link
                href={DIRECT.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-3 py-2.5 font-display font-bold transition-colors hover:bg-muted"
              >
                {DIRECT.label}
              </Link>
              <MobileGroup group={RESOURCES} onNavigate={() => setMobileOpen(false)} />
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="mt-1 block rounded-xl bg-primary px-3 py-2.5 text-center font-display font-bold text-primary-foreground"
              >
                Dashboard
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ── Desktop direct link with animated underline ──────────────────────────────
function NavItem({ link, active }: { link: NavLink; active: boolean }) {
  return (
    <Link
      href={link.href}
      className={`relative rounded-full px-3 py-2 text-sm font-medium transition-colors hover:text-foreground ${
        active ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      {link.label}
      {active && (
        <motion.span
          layoutId="nav-underline"
          className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-primary"
        />
      )}
    </Link>
  );
}

// ── Desktop dropdown (hover-intent + click, keyboard-safe) ────────────────────
function NavDropdown({ group, active, reduce }: { group: NavGroup; active: boolean; reduce: boolean }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const closeSoon = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div ref={ref} className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition-colors hover:text-foreground ${
          active ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {group.label}
        <ChevronDown className={`size-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? { opacity: 0 } : dropdownMotion.initial}
            animate={reduce ? { opacity: 1 } : dropdownMotion.animate}
            exit={reduce ? { opacity: 0 } : dropdownMotion.exit}
            style={{ transformOrigin: "top left" }}
            className="absolute left-0 top-full z-[55] mt-2 w-72 overflow-hidden rounded-2xl border border-card-border bg-card p-1.5 shadow-lg"
            role="menu"
          >
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex flex-col gap-0.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted"
              >
                <span className="font-display text-sm font-bold">{item.label}</span>
                {item.desc && <span className="text-xs text-muted-foreground">{item.desc}</span>}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Mobile group ─────────────────────────────────────────────────────────────
function MobileGroup({ group, onNavigate }: { group: NavGroup; onNavigate: () => void }) {
  return (
    <div className="py-1">
      <div className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {group.label}
      </div>
      {group.items.map((item) => (
        <motion.div key={item.href} variants={staggerChild}>
          <Link
            href={item.href}
            onClick={onNavigate}
            className="block rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            {item.label}
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
