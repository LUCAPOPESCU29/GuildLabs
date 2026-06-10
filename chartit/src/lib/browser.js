/**
 * Shared headless-Chromium plumbing for every image renderer (candlestick
 * charts, comparison charts, heatmaps, portfolio cards).
 *
 * lightweight-charts and our HTML-based cards are canvas/DOM renderers with no
 * Node equivalent, so we draw them in a real browser and screenshot the result.
 * Launching Chromium is expensive, so a single browser is launched lazily,
 * reused across renders, and closed after a few idle minutes to keep resting
 * memory low. Renders are serialized — a page render briefly spikes Chromium's
 * memory, so running them one at a time keeps a burst of commands from spawning
 * many pages at once.
 *
 * Previously this lived inside chart.js; it was lifted here so heatmap.js and
 * the comparison renderer can share the exact same browser instead of each
 * launching their own.
 */

import { existsSync } from "node:fs";
import puppeteer from "puppeteer";

const IDLE_SHUTDOWN_MS = 5 * 60_000;

let browserPromise = null;
let idleTimer = null;

// In Docker we run the system Chromium; locally puppeteer uses its own
// downloaded build (undefined → puppeteer resolves it). Alpine has shipped the
// binary under both names across versions, so probe rather than hardcode.
function chromiumPath() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  return candidates.find((p) => p && existsSync(p)) || undefined;
}

export async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer
      .launch({
        headless: true,
        executablePath: chromiumPath(),
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage", // /dev/shm is tiny in containers
          "--disable-gpu",
        ],
      })
      .catch((err) => {
        browserPromise = null; // let the next call retry a fresh launch
        throw err;
      });
  }
  return browserPromise;
}

/** Close the shared browser — called on shutdown and after an idle period. */
export async function closeBrowser() {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
  const pending = browserPromise;
  browserPromise = null;
  if (!pending) return;
  try {
    const browser = await pending;
    await browser.close();
  } catch {
    // already gone — nothing to clean up
  }
}

function scheduleIdleClose() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(closeBrowser, IDLE_SHUTDOWN_MS);
  idleTimer.unref?.(); // don't keep the process alive for the timer
}

// Run renders one at a time. A page render briefly spikes Chromium's memory, so
// serializing keeps a burst of render commands from launching parallel pages.
let chain = Promise.resolve();
export function serialize(task) {
  const run = chain.then(task, task);
  chain = run.then(
    () => {},
    () => {}
  );
  return run;
}

/**
 * Serialized render helper: opens a fresh page, hands it to `fn`, and always
 * closes the page and (re)arms the idle-shutdown timer afterwards. `fn` returns
 * whatever the caller needs (typically a screenshot Buffer).
 *
 * @template T
 * @param {(page: import('puppeteer').Page) => Promise<T>} fn
 * @returns {Promise<T>}
 */
export function renderWithPage(fn) {
  return serialize(async () => {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      return await fn(page);
    } finally {
      await page.close().catch(() => {});
      scheduleIdleClose();
    }
  });
}
