import Link from "next/link";
import { GuildLabsLogo } from "@/components/logo";

/**
 * Shared marketing footer. Link columns give every page a deep internal-link
 * graph so crawlers reach the long-tail (tickers, docs, guides, comparisons)
 * from anywhere on the site.
 */
const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Bots",
    links: [
      { label: "ChartIt", href: "/bots/chartit" },
      { label: "Construct", href: "/bots/construct" },
      { label: "Maven", href: "/bots/maven" },
      { label: "All bots", href: "/bots" },
    ],
  },
  {
    heading: "Product",
    links: [
      { label: "Templates", href: "/templates" },
      { label: "Self-host", href: "/self-host" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Status", href: "/status" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    heading: "Learn",
    links: [
      { label: "Build a bot", href: "/learn" },
      { label: "Docs", href: "/docs" },
      { label: "Guides", href: "/guides" },
      { label: "Compare", href: "/vs" },
      { label: "Stocks", href: "/stocks" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Wall of love", href: "/wall" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-card-border">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link href="/" aria-label="GuildLabs home">
              <GuildLabsLogo className="h-8 w-auto" />
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Discord tools, done right — charts, server setup, and more.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h2 className="font-display text-sm font-bold">{col.heading}</h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-card-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} GuildLabs. Not affiliated with Discord Inc.</span>
          <span>Market data is informational only — not financial advice.</span>
        </div>
      </div>
    </footer>
  );
}
