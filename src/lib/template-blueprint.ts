/**
 * Converts a ServerTemplate (SEO data) into a clean, deployable JSON blueprint
 * that mirrors the GuildLabs blueprint format and can be used directly with
 * Discord server creation tools or imported back into the builder.
 */
import { type ServerTemplate } from "./seo-data/templates";

export type BlueprintChannel = {
  name: string;
  type: "text" | "voice" | "forum" | "stage";
  purpose: string;
};

export type BlueprintRole = {
  name: string;
  color: string;
  hoist: boolean;
  purpose: string;
};

export type BlueprintBot = {
  name: string;
  purpose: string;
};

/** A grouped category of channels — the shape the deploy bot consumes. */
export type BlueprintCategory = {
  name: string;
  channels: BlueprintChannel[];
};

export type TemplateBlueprint = {
  schema_version: "1.0";
  template: string;
  /** Server name — read by the deploy bot for its status embed. */
  name: string;
  meta: {
    name: string;
    description: string;
    use_case: string;
    stats: {
      channels: number;
      roles: number;
      members: string;
    };
    source: string;
    generated_by: string;
  };
  /** Grouped channels — required by the GuildLabs deploy bot (`/setup`). */
  categories: BlueprintCategory[];
  /** Flat channel list retained for display / back-compat. */
  channels: BlueprintChannel[];
  roles: BlueprintRole[];
  bots: BlueprintBot[];
  features: string[];
};

/** Strip emoji prefix like "📋│" and return clean channel name */
function cleanName(raw: string): string {
  const idx = raw.indexOf("│");
  return idx >= 0 ? raw.slice(idx + 1).trim() : raw.trim();
}

/** Guess channel type from raw name emoji/slug */
function guessType(raw: string): BlueprintChannel["type"] {
  const lower = raw.toLowerCase();
  if (lower.includes("vc") || lower.includes("voice") || lower.includes("lounge") || lower.includes("lobby") || lower.includes("stage")) {
    return "voice";
  }
  if (lower.includes("forum") || lower.includes("questions")) return "forum";
  if (lower.includes("stage")) return "stage";
  return "text";
}

/** Map template slug → GuildLabs wizard type IDs */
export const TEMPLATE_WIZARD_TYPES: Record<string, string[]> = {
  "gaming-server":     ["gaming"],
  "study-group":       ["school"],
  "crypto-community":  ["crypto"],
  "anime-server":      ["community", "creative"],
  "music-server":      ["music"],
  "art-community":     ["creative"],
  "developer-server":  ["tech"],
  "business-server":   [],
  "roleplay-server":   ["creative"],
  "nft-community":     ["crypto", "creative"],
  "startup-community": ["tech", "community"],
  "book-club":         ["community"],
};

/** Build the query string for pre-filling the wizard */
export function wizardURL(slug: string, name: string): string {
  const types = TEMPLATE_WIZARD_TYPES[slug] ?? [];
  const params = new URLSearchParams();
  if (types.length) params.set("types", types.join(","));
  params.set("name", name);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

/** Convert a ServerTemplate to a downloadable JSON blueprint */
export function templateToBlueprint(t: ServerTemplate): TemplateBlueprint {
  const channels: BlueprintChannel[] = t.channels.map((ch) => ({
    name: cleanName(ch.name),
    type: guessType(ch.name),
    purpose: ch.purpose,
  }));

  const roles: BlueprintRole[] = t.roles.map((r) => ({
    name: r.name,
    color: r.color ?? "#99aab5",
    hoist: Boolean(r.color), // colored roles are hoisted by convention
    purpose: r.purpose,
  }));

  // Group channels into categories — the deploy bot's /setup requires a
  // top-level `categories` array of { name, channels[] }. Templates don't
  // encode sections, so we split text/forum from voice/stage into two
  // sensible categories.
  const textChannels = channels.filter((ch) => ch.type === "text" || ch.type === "forum");
  const voiceChannels = channels.filter((ch) => ch.type === "voice" || ch.type === "stage");
  const categories: BlueprintCategory[] = [
    { name: t.name, channels: textChannels },
    ...(voiceChannels.length ? [{ name: "Voice", channels: voiceChannels }] : []),
  ].filter((c) => c.channels.length > 0);

  return {
    schema_version: "1.0",
    template: t.slug,
    name: t.name,
    meta: {
      name: t.name,
      description: t.description,
      use_case: t.useCase,
      stats: {
        channels: t.stats.avgChannels,
        roles: t.stats.avgRoles,
        members: t.stats.avgMembers,
      },
      source: `https://www.guildlabs.fun/templates/${t.slug}`,
      generated_by: "GuildLabs Template Generator",
    },
    categories,
    channels,
    roles,
    bots: t.bots,
    features: t.features,
  };
}

/** Trigger a client-side download of the blueprint JSON */
export function downloadBlueprint(t: ServerTemplate): void {
  const data = templateToBlueprint(t);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${t.slug}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
