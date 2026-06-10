/**
 * Maven's embedder — wraps Xenova/transformers.js (ONNX in pure JS).
 *
 * Model:        Xenova/all-MiniLM-L6-v2 (~22MB quantized)
 * Dimensions:   384 floats per embedding (L2-normalized → cosine == dot product)
 * Throughput:   ~50-100 sentences/sec on shared CPU. First inference takes
 *               ~5 seconds while the ONNX runtime materializes the weights;
 *               we warm it up at boot so real interactions land fast.
 *
 * No API keys. No per-token charges. No data leaves the bot's machine.
 *
 * Cache:        Small LRU on input strings — back-to-back queries (e.g. a
 *               passive surface-check followed by an indexing pass on the
 *               same message) only embed once.
 */

let pipelinePromise = null;

async function getPipeline() {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const { pipeline, env } = await import("@xenova/transformers");
      // Persist the model cache on the data volume so reboots don't re-download.
      env.cacheDir = process.env.MODEL_CACHE_DIR
        ?? `${process.env.DATA_DIR ?? "./data"}/models`;
      env.allowRemoteModels = true;
      env.allowLocalModels = true;
      console.log("[EMBED] loading Xenova/all-MiniLM-L6-v2…");
      const t = Date.now();
      const p = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
        quantized: true,
      });
      console.log(`[EMBED] model ready in ${Date.now() - t}ms`);
      return p;
    })();
  }
  return pipelinePromise;
}

// ── Tiny LRU cache for repeated inputs ──────────────────────────────────────
// We keep the cache small because embeddings are bulky (~1.5KB each).
const CACHE_CAP = 256;
const cache = new Map(); // key (normalized text) → vector

function cacheKey(text) {
  // Whitespace-collapse + lowercase. Doesn't change meaning but increases hits.
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function cacheGet(text) {
  const k = cacheKey(text);
  const v = cache.get(k);
  if (v === undefined) return null;
  // Move-to-front: re-set to mark as recently used
  cache.delete(k);
  cache.set(k, v);
  return v;
}

function cacheSet(text, vector) {
  const k = cacheKey(text);
  cache.set(k, vector);
  if (cache.size > CACHE_CAP) {
    // Evict oldest (first entry in insertion order)
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
}

/**
 * Generate a normalized 384-dim embedding for a single piece of text.
 * Returns a plain Array<number> for JSON-friendly storage.
 */
export async function embed(text) {
  const cached = cacheGet(text);
  if (cached) return cached;
  const extractor = await getPipeline();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  const vector = Array.from(output.data);
  cacheSet(text, vector);
  return vector;
}

/** Batched embed — pays one model overhead for many texts. */
export async function embedBatch(texts) {
  if (texts.length === 0) return [];
  const extractor = await getPipeline();
  const result = await extractor(texts, { pooling: "mean", normalize: true });
  const dim = result.dims[result.dims.length - 1];
  const flat = Array.from(result.data);
  const out = [];
  for (let i = 0; i < flat.length; i += dim) out.push(flat.slice(i, i + dim));
  // Also populate cache for these
  for (let i = 0; i < texts.length; i++) cacheSet(texts[i], out[i]);
  return out;
}

/**
 * Cosine similarity. Both inputs are L2-normalized so dot product suffices.
 * No length check: caller guarantees same dimensionality.
 */
export function cosine(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

/** Pre-warm the model so the first real query doesn't pay the 5s cold start. */
export async function warmupEmbedder() {
  await embed("warmup");
}
