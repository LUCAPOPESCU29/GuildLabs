import { esc, escAttrUrl } from "../../lib/html.js";

/** The Discord OAuth URL for this instance's bot — the "Add your server" CTA. */
export function inviteUrl(config, { manageGuild = false } = {}) {
  const perms = manageGuild ? 19489 : 19457;
  return `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(config.clientId)}&permissions=${perms}&scope=bot%20applications.commands`;
}

export const REPO_URL = "https://github.com/LUCAPOPESCU29/GuildLabs/tree/main/beacon";

/**
 * Page shell. Every page passes through here so meta tags, nav, footer, and
 * the CSP-friendly asset links are always consistent.
 */
export function layout({ config, title, description, path = "/", robots = "", og = {}, jsonLd = null, active = "", body }) {
  const site = config.siteName;
  const fullTitle = title ? `${title} · ${site}` : site;
  const canonical = `${config.publicUrl}${path}`;
  const ogImage = og.image || `${config.publicUrl}/static/og-default.svg`;
  const footerText =
    config.footerText ||
    (site === "Beacon" ? "Open source and self-hostable." : `${site} runs on Beacon — open source and self-hostable.`);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${escAttrUrl(canonical)}">
${robots ? `<meta name="robots" content="${esc(robots)}">` : ""}
<meta property="og:site_name" content="${esc(site)}">
<meta property="og:type" content="${esc(og.type || "website")}">
<meta property="og:title" content="${esc(title || site)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${escAttrUrl(canonical)}">
<meta property="og:image" content="${escAttrUrl(ogImage)}">
<meta name="twitter:card" content="${og.image ? "summary_large_image" : "summary"}">
<meta name="theme-color" content="#0b0b0f">
<link rel="icon" href="/static/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/static/style.css">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>` : ""}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="nav">
  <div class="container nav-inner">
    <a class="brand" href="/" aria-label="${esc(site)} home">
      <svg class="brand-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 9 9h6l-3-7Zm0 8.5 5.5 11h-11L12 10.5Z" fill="currentColor"/></svg>
      <span>${esc(site)}</span>
    </a>
    <nav aria-label="Primary">
      <a class="nav-link${active === "directory" ? " is-active" : ""}" href="/servers">Directory</a>
      <a class="btn btn-primary btn-sm" href="${inviteUrl(config)}" rel="noopener">Add your server</a>
    </nav>
  </div>
</header>
<main id="main" class="container">
${body}
</main>
<footer class="footer">
  <div class="container footer-inner">
    <p>${esc(footerText)}</p>
    <p class="footer-links">
      <a href="${REPO_URL}" rel="noopener">Source</a>
      <a href="/sitemap.xml">Sitemap</a>
      ${config.reportEmail ? `<a href="mailto:${esc(config.reportEmail)}">Report a server</a>` : ""}
    </p>
  </div>
</footer>
</body>
</html>`;
}
