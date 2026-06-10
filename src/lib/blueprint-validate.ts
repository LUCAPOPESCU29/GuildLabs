/**
 * Server-side validation + repair for AI-generated blueprints.
 *
 * The model is helpful but fallible, so nothing it returns is trusted into the
 * deploy path raw. A Yup schema coerces the shape and repairs-in-place where it
 * is safe to do so (unknown channel types → "text", unknown perm presets →
 * "member", bad colors → palette), then a deterministic pass dedupes, caps
 * counts, guarantees a sane role hierarchy, and computes the stats ourselves.
 *
 * Server-only: imported by the route handlers.
 */

import "server-only";
import * as yup from "yup";
import {
  PERM_PRESETS,
  ROLE_PALETTE,
  type Blueprint,
  type Category,
  type Channel,
  type Role,
  type PermPreset,
} from "./blueprint";
import { CAPS, CHANNEL_TYPES, PERM_KEYS } from "./construct-ai";

const HEX = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Intermediate, fully-coerced shape (perms still as a preset key). */
type NormChannel = { name: string; type: Channel["type"] };
type NormCategory = { name: string; emoji: string; channels: NormChannel[] };
type NormRole = { name: string; color: string; hoist: boolean; perms: PermPreset };
type Norm = {
  name: string;
  summary: string;
  mixNote: string;
  categories: NormCategory[];
  roles: NormRole[];
  permissions: string[];
};

const channelSchema: yup.ObjectSchema<NormChannel> = yup.object({
  name: yup
    .string()
    .transform((v) => str(v).slice(0, 24))
    .default(""),
  type: yup
    .mixed<Channel["type"]>()
    .transform((v) =>
      (CHANNEL_TYPES as readonly string[]).includes(v) ? v : "text"
    )
    .default("text"),
});

const categorySchema: yup.ObjectSchema<NormCategory> = yup.object({
  name: yup
    .string()
    .transform((v) => str(v).slice(0, 24) || "GENERAL")
    .default("GENERAL"),
  emoji: yup
    .string()
    .transform((v) => str(v) || "📁")
    .default("📁"),
  channels: yup.array().of(channelSchema).ensure().default([]),
});

const roleSchema: yup.ObjectSchema<NormRole> = yup.object({
  name: yup
    .string()
    .transform((v) => str(v).slice(0, 24))
    .default(""),
  color: yup
    .string()
    .transform((v) => (HEX.test(str(v)) ? str(v) : ""))
    .default(""),
  hoist: yup.boolean().transform((v) => v === true).default(false),
  perms: yup
    .mixed<PermPreset>()
    .transform((v) => (PERM_KEYS.includes(v) ? v : "member"))
    .default("member"),
});

const blueprintSchema: yup.ObjectSchema<Norm> = yup.object({
  name: yup
    .string()
    .transform((v) => str(v).slice(0, 60) || "My Server")
    .default("My Server"),
  summary: yup
    .string()
    .transform((v) => str(v).slice(0, 240))
    .default(""),
  mixNote: yup
    .string()
    .transform((v) => str(v).slice(0, 240))
    .default(""),
  categories: yup.array().of(categorySchema).ensure().default([]),
  roles: yup.array().of(roleSchema).ensure().default([]),
  permissions: yup
    .array()
    .of(yup.string().transform((v) => str(v).slice(0, 200)).defined())
    .ensure()
    .default([]),
});

export class BlueprintInvalid extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlueprintInvalid";
  }
}

function dedupeChannels(channels: NormChannel[]): Channel[] {
  const seen = new Set<string>();
  const out: Channel[] = [];
  for (const c of channels) {
    const name = c.name.trim();
    if (!name) continue;
    const k = `${c.type}:${name.toLowerCase()}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ name, type: c.type });
    if (out.length >= CAPS.channelsPerCategory) break;
  }
  return out;
}

/**
 * Coerce + repair raw model output into a deploy-ready Blueprint. Throws
 * `BlueprintInvalid` only when the structure can't be salvaged into something
 * meaningful (no categories with channels).
 */
export function validateBlueprint(raw: unknown): Blueprint {
  let norm: Norm;
  try {
    norm = blueprintSchema.cast(raw, { stripUnknown: true }) as Norm;
  } catch (e) {
    throw new BlueprintInvalid(
      e instanceof Error ? e.message : "Blueprint failed to parse."
    );
  }

  // ── Categories: drop empties, dedupe channels, cap counts ──
  const seenCat = new Set<string>();
  const categories: Category[] = [];
  for (const c of norm.categories) {
    const channels = dedupeChannels(c.channels);
    if (channels.length === 0) continue;
    const key = c.name.toLowerCase();
    if (seenCat.has(key)) continue;
    seenCat.add(key);
    categories.push({ name: c.name, emoji: c.emoji, channels });
    if (categories.length >= CAPS.categories) break;
  }

  if (categories.length === 0) {
    throw new BlueprintInvalid("The blueprint had no usable channels.");
  }

  // ── Roles: dedupe, map preset → perm string, ensure colors & an admin ──
  const seenRole = new Set<string>();
  const roles: Role[] = [];
  let hasAdmin = false;
  for (const r of norm.roles) {
    const name = r.name.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seenRole.has(key)) continue;
    seenRole.add(key);
    if (r.perms === "admin") hasAdmin = true;
    roles.push({
      name,
      color: r.color || ROLE_PALETTE[roles.length % ROLE_PALETTE.length],
      hoist: r.hoist,
      perms: PERM_PRESETS[r.perms],
    });
    if (roles.length >= CAPS.roles) break;
  }
  if (roles.length === 0) {
    roles.push({
      name: "Admin",
      color: ROLE_PALETTE[0],
      hoist: true,
      perms: PERM_PRESETS.admin,
    });
    roles.push({
      name: "Member",
      color: ROLE_PALETTE[7],
      hoist: false,
      perms: PERM_PRESETS.member,
    });
    hasAdmin = true;
  }
  if (!hasAdmin) {
    roles.unshift({
      name: "Admin",
      color: ROLE_PALETTE[0],
      hoist: true,
      perms: PERM_PRESETS.admin,
    });
  }

  const allChannels = categories.flatMap((c) => c.channels);
  const voice = allChannels.filter(
    (c) => c.type === "voice" || c.type === "stage"
  ).length;

  const permissions = norm.permissions
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 8);

  return {
    name: norm.name,
    summary:
      norm.summary ||
      `A Discord server with ${categories.length} categories and ${roles.length} roles.`,
    mixNote: norm.mixNote || "Tailored from your description.",
    categories,
    roles,
    permissions,
    stats: {
      categories: categories.length,
      channels: allChannels.length,
      voice,
      roles: roles.length,
    },
  };
}
