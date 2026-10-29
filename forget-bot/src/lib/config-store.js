import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || join(__dirname, "../../data");
mkdirSync(DATA_DIR, { recursive: true });
const STORE_PATH = join(DATA_DIR, "config.json");

let store = {};
if (existsSync(STORE_PATH)) {
  try { store = JSON.parse(readFileSync(STORE_PATH, "utf8")); } catch {}
}
const save = () => writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));

export const Config = {
  get: (g) => store[g] ?? {},
  set(g, k, v) { (store[g] ??= {})[k] = v; save(); },
  getKey: (g, k, fallback = null) => store[g]?.[k] ?? fallback,
};
