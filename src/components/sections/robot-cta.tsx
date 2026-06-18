"use client";

/**
 * Final CTA band, rebuilt around the GuildLabs 3D robot mascot. Replaces the
 * old painted night-sky panel: brand-colored floating paths drift behind a
 * pointer-reactive CSS-3D robot, with modern copy + the build CTAs alongside.
 *
 * Design: Liquid-Glass / premium (per ui-ux-pro-max) — dark band, translucent
 * surfaces, brand-gradient motion, accessible contrast, reduced-motion safe.
 */

import * as React from "react";
import Link from "next/link";
import { Sparkles, MousePointerClick, Download } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { BackgroundPaths } from "@/components/fx/background-paths";
import { GuildBot3D } from "@/components/fx/guild-bot-3d";

export function RobotCta() {
  return (
    <section className="px-4 py-20">
      <Reveal>
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem]">
          {/* dark throne backdrop */}
          <div
            aria-hidden
            className="grain absolute inset-0"
            style={{ background: "linear-gradient(160deg, #2a1d52 0%, #1d1440 52%, #120c28 100%)" }}
          />
          {/* brand floating paths, faded toward edges */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-70"
            style={{
              maskImage: "radial-gradient(120% 90% at 50% 40%, black, transparent 80%)",
              WebkitMaskImage: "radial-gradient(120% 90% at 50% 40%, black, transparent 80%)",
            }}
          >
            <BackgroundPaths />
          </div>
          {/* accent glows */}
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full opacity-30 blur-3xl" style={{ background: "var(--secondary)" }} />
          <div aria-hidden className="pointer-events-none absolute -bottom-28 -left-16 size-96 rounded-full opacity-25 blur-3xl" style={{ background: "var(--accent)" }} />

          {/* content */}
          <div className="relative grid items-center gap-8 px-6 py-16 text-white sm:px-10 sm:py-20 lg:grid-cols-[1.05fr,0.95fr]">
            {/* copy */}
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-[0.72rem] font-black uppercase tracking-[0.14em] backdrop-blur-sm">
                <Sparkles className="size-3.5 text-accent" /> Free forever
              </span>
              <h2 className="mt-6 font-display text-5xl font-black leading-[0.95] tracking-tight text-balance sm:text-6xl lg:text-7xl">
                Build the server you
                <br />
                <span className="text-accent">actually wanted.</span>
              </h2>
              <p className="mx-auto mt-6 max-w-md text-lg text-white/75 text-pretty lg:mx-0">
                Describe it, review the blueprint, deploy. A few minutes — and it costs nothing.
                Your friendly builder bot does the rest.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Link href="/#builder">
                  <Button size="lg" variant="accent" magnetic className="w-full sm:w-auto">
                    <MousePointerClick className="size-5" /> Build my server — free
                  </Button>
                </Link>
                <Link href="/templates">
                  <Button size="lg" variant="glass" className="w-full !border-white/30 !bg-white/10 !text-white hover:!bg-white/20 sm:w-auto">
                    <Download className="size-5" /> Download a blueprint first
                  </Button>
                </Link>
              </div>
            </div>

            {/* the robot — click it 👀 */}
            <div className="mx-auto h-[340px] w-full max-w-[340px] sm:h-[400px] sm:max-w-[380px]">
              <GuildBot3D />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
