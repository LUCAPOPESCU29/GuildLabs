import { esc, escAttrUrl, paragraphs, formatNumber, formatDateTime, sparkline } from "../../lib/html.js";
import { tagLabel } from "../../lib/tags.js";
import { layout, inviteUrl } from "./layout.js";
import { banner, bannerSrc, icon, tagChip, cardGrid, pagination, searchForm, growthBadge } from "./components.js";

// ── Home ──────────────────────────────────────────────────────────────────────
export function homePage({ config, featured, top, tags, total }) {
  const body = `
<section class="hero">
  <p class="eyebrow">Discord server directory</p>
  <h1>Find a server that's actually alive.</h1>
  <p class="lede">${esc(config.siteName)} ranks servers by real activity — who's online, who's growing, what's on the calendar. Nobody can bump their way to the top.</p>
  ${searchForm()}
  <p class="hero-meta">${total ? `${formatNumber(total)} server${total === 1 ? "" : "s"} listed · ` : ""}<a href="${inviteUrl(config)}" rel="noopener">Add yours</a> — it takes one command.</p>
</section>

${featured.length ? `<section class="section">
  <div class="section-head"><h2>Featured</h2></div>
  ${cardGrid(config, featured)}
</section>` : ""}

${tags.length ? `<section class="section">
  <div class="section-head"><h2>Browse by topic</h2><a class="link" href="/servers">All servers →</a></div>
  <div class="chips">${tags.map(({ tag, count }) => tagChip(tag, { count })).join("")}</div>
</section>` : ""}

<section class="section">
  <div class="section-head"><h2>Most active right now</h2>${top.length ? `<a class="link" href="/servers">See all →</a>` : ""}</div>
  ${top.length ? cardGrid(config, top) : emptyState(config)}
</section>`;

  return layout({
    config,
    title: "",
    description: `${config.siteName} is a Discord server directory ranked by real activity — online members, growth, and events — never bumps.`,
    path: "/",
    body,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: config.siteName,
      url: `${config.publicUrl}/`,
      potentialAction: {
        "@type": "SearchAction",
        target: `${config.publicUrl}/servers?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  });
}

function emptyState(config) {
  return `<div class="empty">
  <p>No servers listed yet.</p>
  <p><a class="btn btn-primary" href="${inviteUrl(config)}" rel="noopener">Add Beacon to your server</a> then run <code>/beacon setup</code> and <code>/beacon publish</code>.</p>
</div>`;
}

// ── Directory / tag pages ────────────────────────────────────────────────────
export function directoryPage({ config, q, tag, result, tags }) {
  const heading = tag ? `${tagLabel(tag)} servers` : "All servers";
  const sub = q
    ? `${result.total} result${result.total === 1 ? "" : "s"} for “${esc(q)}”${tag ? ` in ${esc(tagLabel(tag))}` : ""}`
    : `${result.total} server${result.total === 1 ? "" : "s"}, ranked by activity`;

  const body = `
<section class="page-head">
  <p class="eyebrow"><a href="/servers">Directory</a>${tag ? ` / ${esc(tagLabel(tag))}` : ""}</p>
  <h1>${esc(heading)}</h1>
  <p class="lede">${sub}</p>
  ${searchForm({ q, tag })}
</section>
${tags.length ? `<div class="chips chips--scroll"><a class="chip${!tag ? " is-active" : ""}" href="/servers">All</a>${tags.map(({ tag: t, count }) => tagChip(t, { count, active: t === tag })).join("")}</div>` : ""}
<section class="section">
  ${result.items.length ? cardGrid(config, result.items) : `<div class="empty"><p>Nothing here yet${q ? " — try a different search" : ""}.</p></div>`}
  ${pagination({ page: result.page, pages: result.pages, q, tag })}
</section>`;

  return layout({
    config,
    title: q ? `Search: ${q}` : heading,
    description: tag
      ? `${tagLabel(tag)} Discord servers ranked by real activity — online members, growth, and upcoming events.`
      : `Browse Discord servers ranked by real activity on ${config.siteName}.`,
    path: tag ? `/servers/${tag}` : "/servers",
    robots: q ? "noindex,follow" : "",
    active: "directory",
    body,
  });
}

// ── Server page ──────────────────────────────────────────────────────────────
export function serverPage({ config, model }) {
  const { row, members, online, growth7d, series, events, rank } = model;
  const eventsCount = model.eventsCount ?? events.length;
  const pagePath = `/s/${row.slug}`;
  const ogImage = bannerSrc(config, row);
  const absOg = ogImage ? (ogImage.startsWith("/") ? `${config.publicUrl}${ogImage}` : ogImage) : row.icon_url || null;
  const unlisted = !row.published;

  const body = `
<article class="server">
  <div class="server-banner">${banner(config, row, { className: "server-banner-media" })}</div>
  <header class="server-head">
    ${icon(row, { size: 88 })}
    <div class="server-titles">
      <p class="eyebrow"><a href="/servers">Directory</a>${row.tags[0] ? ` / <a href="/servers/${esc(row.tags[0])}">${esc(tagLabel(row.tags[0]))}</a>` : ""}</p>
      <h1>${esc(row.name)}${row.featured ? ' <span class="badge">Featured</span>' : ""}${unlisted ? ' <span class="badge badge--muted">Unlisted</span>' : ""}</h1>
      <p class="lede">${esc(row.tagline ?? "")}</p>
      <div class="chips chips--inline">${row.tags.map((t) => tagChip(t)).join("")}</div>
    </div>
    <div class="server-cta">
      <a class="btn btn-primary btn-lg" href="${pagePath}/join" rel="noopener">Join server</a>
      <p class="server-cta-note">Opens a Discord invite</p>
    </div>
  </header>

  <section class="stats" aria-label="Server stats">
    <div class="stat"><span class="stat-value">${esc(formatNumber(members))}</span><span class="stat-label">members</span></div>
    <div class="stat"><span class="stat-value"><span class="dot"></span>${esc(formatNumber(online))}</span><span class="stat-label">online</span></div>
    <div class="stat"><span class="stat-value">${growth7d ? growthBadge(growth7d) : "—"}</span><span class="stat-label">this week</span></div>
    <div class="stat"><span class="stat-value">${eventsCount}</span><span class="stat-label">upcoming event${eventsCount === 1 ? "" : "s"}</span></div>
    ${rank ? `<div class="stat"><span class="stat-value">#${rank.rank}</span><span class="stat-label">of ${rank.of} in ${esc(tagLabel(row.tags[0]))}</span></div>` : ""}
  </section>

  <div class="server-grid">
    <section class="panel">
      <h2>About</h2>
      ${row.description ? paragraphs(row.description) : `<p class="muted">No description yet.</p>`}
    </section>
    <aside class="panel-col">
      ${series.length >= 2 ? `<section class="panel">
        <h2>Members, last ${series.length} days</h2>
        ${sparkline(series, { width: 320, height: 64 })}
      </section>` : ""}
      ${events.length ? `<section class="panel">
        <h2>Upcoming events</h2>
        <ul class="events">${events
          .slice(0, 5)
          .map(
            (e) =>
              `<li><a href="${escAttrUrl(e.url)}" rel="noopener">${esc(e.name)}</a><span class="muted">${e.live ? "Live now" : esc(formatDateTime(e.startsAt))}</span></li>`
          )
          .join("")}</ul>
      </section>` : ""}
      <section class="panel panel--quiet">
        <p class="muted small">Counts refresh automatically. Ranking uses online ratio, growth, events, and views — no bumping.</p>
        ${config.reportEmail ? `<p class="small"><a href="mailto:${esc(config.reportEmail)}?subject=${encodeURIComponent(`Report: ${row.name} (${row.slug})`)}">Report this server</a></p>` : ""}
      </section>
    </aside>
  </div>
</article>`;

  return layout({
    config,
    title: row.name,
    description: `${row.tagline ?? row.name} — ${formatNumber(members)} members, ${formatNumber(online)} online. Join on Discord.`,
    path: pagePath,
    robots: unlisted ? "noindex,nofollow" : "",
    og: { image: absOg, type: "website" },
    body,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: row.name,
      description: row.tagline ?? "",
      url: `${config.publicUrl}${pagePath}`,
      ...(absOg ? { image: absOg } : {}),
      isPartOf: { "@type": "WebSite", name: config.siteName, url: `${config.publicUrl}/` },
    },
  });
}

// ── Errors ───────────────────────────────────────────────────────────────────
export function errorPage({ config, status, message }) {
  const body = `
<section class="hero hero--small">
  <p class="eyebrow">${status}</p>
  <h1>${status === 404 ? "Not found" : "Something went wrong"}</h1>
  <p class="lede">${esc(message)}</p>
  <p><a class="btn btn-primary" href="/servers">Browse the directory</a></p>
</section>`;
  return layout({ config, title: String(status), description: message, path: "/", robots: "noindex", body });
}
