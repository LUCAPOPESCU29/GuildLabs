/**
 * Dependency-free PNG generation for Forget's embed banners.
 *
 * A generated image is the single biggest visual lever Discord gives an embed —
 * it renders full-width at the bottom, unlike the tiny thumbnail. Rather than
 * ship binary assets or call an image service, we synthesise PNGs at runtime
 * from raw chunks (Node's zlib does the compression), so banners can be tinted
 * per-embed to match the accent colour.
 */

import { deflateSync } from "zlib";

// ── PNG plumbing ────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** Build an RGB PNG from a (x,y)->[r,g,b] shader. */
function png(width, height, shade) {
  const raw = Buffer.alloc(height * (width * 3 + 1));
  let p = 0;
  for (let y = 0; y < height; y++) {
    raw[p++] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b] = shade(x, y);
      raw[p++] = r; raw[p++] = g; raw[p++] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // colour type: truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Colour helpers ──────────────────────────────────────────────────────────
const rgb = (hex) => [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff];
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
/** Smoothstep keeps gradients from banding at the midpoint. */
const ease = (t) => t * t * (3 - 2 * t);

/**
 * A slim gradient rule used as a section divider inside an embed.
 * Wide and short so Discord renders it as a crisp horizontal line.
 */
export function gradientRule(accent, { width = 600, height = 8 } = {}) {
  const a = rgb(accent);
  const dark = mix(a, [11, 12, 16], 0.72);
  return png(width, height, (x) => {
    const t = ease(x / (width - 1));
    // Bright at the left, fading right — gives the bar direction.
    return mix(a, dark, t);
  });
}

/**
 * A full banner: diagonal gradient with a soft vignette, sized to Discord's
 * embed image aspect so it never gets letterboxed.
 */
export function banner(accent, { width = 600, height = 100, tone = "deep" } = {}) {
  const a = rgb(accent);
  const base = tone === "deep" ? [10, 11, 16] : [24, 26, 34];
  const hi = mix(a, [255, 255, 255], 0.18);
  return png(width, height, (x, y) => {
    const dx = x / (width - 1);
    const dy = y / (height - 1);
    // Diagonal sweep
    const t = ease(Math.min(1, dx * 0.75 + dy * 0.45));
    let c = mix(hi, base, t);
    // Vignette the bottom edge so text above it stays readable
    const v = ease(Math.max(0, (dy - 0.55) / 0.45)) * 0.35;
    c = mix(c, base, v);
    return c;
  });
}
