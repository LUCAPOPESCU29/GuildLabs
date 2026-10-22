import { esc, escAttrUrl, formatNumber } from "../../lib/html.js";
import { tagLabel } from "../../lib/tags.js";

/** Stable 0–7 bucket from a guild id, for the gradient banner fallback. */
export function hueBucket(id) {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 8;
}

export function bannerSrc(config, row) {
  if (row.banner_path) return `/uploads/${encodeURIComponent(row.banner_path)}`;
  return row.banner_url || null;
}

export function banner(config, row, { className = "" } = {}) {
  const src = bannerSrc(config, row);
  if (src) return `<img class="banner-img ${className}" src="${escAttrUrl(src)}" alt="" loading="lazy">`;
  return `<div class="banner banner--${hueBucket(row.guild_id)} ${className}" aria-hidden="true"></div>`;
}

export function icon(row, { size = 48 } = {}) {
  if (row.icon_url) {
    return `<img class="icon" src="${escAttrUrl(row.icon_url)}" width="${size}" height="${size}" alt="" loading="lazy">`;
  }
  const initials = String(row.name ?? "?")
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return `<span class="icon icon--fallback" aria-hidden="true">${esc(initials || "?")}</span>`;
}

export function tagChip(tag, { count = null, active = false } = {}) {
  const cls = `chip${active ? " is-active" : ""}`;
  return `<a class="${cls}" href="/servers/${esc(tag)}">${esc(tagLabel(tag))}${count !== null ? ` <span class="chip-count">${formatNumber(count)}</span>` : ""}</a>`;
}

export function growthBadge(growth) {
  if (!growth) return "";
  const up = growth > 0;
  return `<span class="growth ${up ? "up" : "down"}" title="Members this week">${up ? "▲" : "▼"} ${esc(Math.abs(growth))}</span>`;
}

export function serverCard(config, e) {
  return `<a class="card" href="/s/${esc(e.slug)}">
  ${banner(config, e, { className: "card-banner" })}
  <div class="card-body">
    <div class="card-head">
      ${icon(e, { size: 44 })}
      <div class="card-titles">
        <h3 class="card-title">${esc(e.name)}${e.featured ? ' <span class="badge">Featured</span>' : ""}</h3>
        <p class="card-tagline">${esc(e.tagline ?? "")}</p>
      </div>
    </div>
    <div class="card-meta">
      <span><strong>${esc(formatNumber(e.members))}</strong> members</span>
      <span><span class="dot"></span><strong>${esc(formatNumber(e.online))}</strong> online</span>
      ${growthBadge(e.growth7d)}
    </div>
    <div class="chips chips--inline">${(e.tags ?? []).slice(0, 3).map((t) => `<span class="chip chip--static">${esc(tagLabel(t))}</span>`).join("")}</div>
  </div>
</a>`;
}

export function cardGrid(config, entries) {
  if (!entries.length) return "";
  return `<div class="grid">${entries.map((e) => serverCard(config, e)).join("")}</div>`;
}

export function pagination({ page, pages, q = "", tag = "" }) {
  if (pages <= 1) return "";
  const href = (p) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (tag) params.set("tag", tag);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return `/servers${s ? `?${s}` : ""}`;
  };
  return `<nav class="pagination" aria-label="Pagination">
  ${page > 1 ? `<a class="btn btn-ghost" href="${esc(href(page - 1))}">← Previous</a>` : `<span class="btn btn-ghost is-disabled">← Previous</span>`}
  <span class="pagination-status">Page ${page} of ${pages}</span>
  ${page < pages ? `<a class="btn btn-ghost" href="${esc(href(page + 1))}">Next →</a>` : `<span class="btn btn-ghost is-disabled">Next →</span>`}
</nav>`;
}

export function searchForm({ q = "", tag = "" } = {}) {
  return `<form class="search" action="/servers" method="get" role="search">
  <label class="sr-only" for="q">Search servers</label>
  <input id="q" name="q" type="search" placeholder="Search by name or tagline" value="${esc(q)}" maxlength="80" autocomplete="off">
  ${tag ? `<input type="hidden" name="tag" value="${esc(tag)}">` : ""}
  <button class="btn btn-primary" type="submit">Search</button>
</form>`;
}
