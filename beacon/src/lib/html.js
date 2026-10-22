/**
 * HTML helpers for the template-literal views. Every piece of user content —
 * server names, taglines, descriptions, slugs, query strings — must go through
 * `esc()` before it lands in markup.
 */

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ESC[c]);
}

/** Escape for use inside an attribute that is itself a URL (keeps it a string). */
export function escAttrUrl(value) {
  const s = String(value ?? "");
  // Only allow http(s), mailto, and site-relative URLs through.
  if (!/^(https?:\/\/|mailto:|\/)/i.test(s)) return "#";
  return esc(s);
}

/** Plain-text description → paragraphs with <br>, escaped. */
export function paragraphs(text) {
  return String(text ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function formatNumber(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1)}k`;
  return String(v);
}

export function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

export function formatDateTime(iso) {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
      timeZoneName: "short",
    });
  } catch {
    return "";
  }
}

/**
 * Inline SVG sparkline from a series of numbers. Returns "" for fewer than two
 * points so the page never shows a lonely dot.
 */
export function sparkline(values, { width = 320, height = 56, stroke = "currentColor" } = {}) {
  const pts = (values ?? []).map(Number).filter((n) => Number.isFinite(n));
  if (pts.length < 2) return "";
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const pad = 3;
  const step = (width - pad * 2) / (pts.length - 1);
  const coords = pts.map((v, i) => {
    const x = pad + i * step;
    const y = height - pad - ((v - min) / span) * (height - pad * 2);
    return [x.toFixed(1), y.toFixed(1)];
  });
  const line = coords.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  const area = `${line} L${coords.at(-1)[0]},${height} L${coords[0][0]},${height} Z`;
  return (
    `<svg class="spark" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" ` +
    `preserveAspectRatio="none" role="img" aria-label="Member count over the last ${pts.length} days">` +
    `<path d="${area}" fill="${stroke}" opacity="0.12"/>` +
    `<path d="${line}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` +
    `</svg>`
  );
}
