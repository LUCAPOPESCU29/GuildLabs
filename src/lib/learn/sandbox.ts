"use client";

/**
 * Runs a learner's JavaScript in a sandboxed Web Worker and returns the
 * captured console output. The worker is isolated from the page and is
 * terminated after a timeout so an infinite loop can't freeze the tab.
 *
 * This is a learning sandbox for the user's own code in their own browser — not
 * a security boundary against hostile input.
 */

export type RunResult = { logs: string[]; error?: string };

const WORKER_SRC = `
self.onmessage = async (e) => {
  const logs = [];
  const fmt = (a) => {
    if (typeof a === "string") return a;
    try { return JSON.stringify(a); } catch { return String(a); }
  };
  const sandboxConsole = {
    log: (...a) => logs.push(a.map(fmt).join(" ")),
    info: (...a) => logs.push(a.map(fmt).join(" ")),
    warn: (...a) => logs.push(a.map(fmt).join(" ")),
    error: (...a) => logs.push(a.map(fmt).join(" ")),
  };
  try {
    const fn = new Function("console", "return (async () => {\\n" + e.data + "\\n})();");
    await fn(sandboxConsole);
    self.postMessage({ logs });
  } catch (err) {
    self.postMessage({ logs, error: (err && err.message) ? String(err.message) : String(err) });
  }
};
`;

export function runCode(code: string, timeoutMs = 2500): Promise<RunResult> {
  return new Promise((resolve) => {
    let worker: Worker | null = null;
    let url: string | null = null;
    let done = false;

    const finish = (r: RunResult) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      worker?.terminate();
      if (url) URL.revokeObjectURL(url);
      resolve(r);
    };

    const timer = setTimeout(
      () => finish({ logs: [], error: "Your code took too long — check for an infinite loop." }),
      timeoutMs
    );

    try {
      const blob = new Blob([WORKER_SRC], { type: "application/javascript" });
      url = URL.createObjectURL(blob);
      worker = new Worker(url);
      worker.onmessage = (ev: MessageEvent<RunResult>) => finish(ev.data);
      worker.onerror = (ev) => finish({ logs: [], error: ev.message || "Something went wrong running your code." });
      worker.postMessage(code);
    } catch {
      finish({ logs: [], error: "Couldn't start the sandbox in this browser." });
    }
  });
}
