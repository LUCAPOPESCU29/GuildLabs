/**
 * Converts an AI-generated Blueprint into the exact JSON the existing deploy
 * path (`/api/bot/deploy/{guildId}`) consumes — the same shape `toJSON()`
 * produces for the wizard, so the AI flow rides the unforked deploy pipeline.
 *
 * Client-safe (no server-only).
 */

import type { Blueprint } from "./blueprint";

export type DeployJSON = {
  server: {
    name: string;
    types: string[];
    moderation: string;
    features: string[];
    advanced: string[];
  };
  categories: { name: string; channels: { name: string; type: string }[] }[];
  roles: { name: string; color: string; hoist: boolean; permissions: string }[];
  permissions: string[];
  source: "ai";
};

export function aiBlueprintToDeployJSON(bp: Blueprint): DeployJSON {
  const hasVoice = bp.stats.voice > 0;
  return {
    server: {
      name: bp.name,
      types: [],
      moderation: "balanced",
      features: hasVoice ? ["voice"] : [],
      advanced: [],
    },
    categories: bp.categories.map((c) => ({
      name: c.name,
      channels: c.channels.map((ch) => ({ name: ch.name, type: ch.type })),
    })),
    roles: bp.roles.map((r) => ({
      name: r.name,
      color: r.color,
      hoist: r.hoist,
      permissions: r.perms,
    })),
    permissions: bp.permissions,
    source: "ai",
  };
}
