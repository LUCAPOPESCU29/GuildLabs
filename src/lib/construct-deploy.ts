/**
 * Converts an AI-generated Blueprint into the exact JSON the existing deploy
 * path (`/api/bot/deploy/{guildId}`) consumes — the same shape `toJSON()`
 * produces for the wizard, so the AI flow rides the unforked deploy pipeline.
 *
 * Client-safe (no server-only).
 */

import { permsToFlags, type Blueprint } from "./blueprint";

export type DeployJSON = {
  server: {
    name: string;
    types: string[];
    moderation: string;
    features: string[];
    advanced: string[];
  };
  categories: {
    name: string;
    /** Sent separately from the name; the bot composes them after sanitising. */
    emoji?: string;
    channels: {
      name: string;
      type: string;
      emoji?: string;
      topic?: string;
      slowmode?: number;
      nsfw?: boolean;
      userLimit?: number;
    }[];
  }[];
  roles: {
    name: string;
    color: string;
    hoist: boolean;
    mentionable: boolean;
    /** Explicit Discord permission flag names, applied verbatim by the bot. */
    permissions: string[];
    /** Human-readable summary for display/debugging. */
    permissionsLabel: string;
  }[];
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
    // Emoji stay in their own field rather than baked into the name: the bot
    // sanitises names (stripping non-alphanumerics) before composing, so a
    // pre-composed emoji would be scrubbed off.
    categories: bp.categories.map((c) => ({
      name: c.name,
      emoji: c.emoji,
      channels: c.channels.map((ch) => ({
        name: ch.name,
        type: ch.type,
        ...(ch.emoji ? { emoji: ch.emoji } : {}),
        ...(ch.topic ? { topic: ch.topic } : {}),
        ...(ch.slowmode ? { slowmode: ch.slowmode } : {}),
        ...(ch.nsfw ? { nsfw: true } : {}),
        ...(ch.userLimit ? { userLimit: ch.userLimit } : {}),
      })),
    })),
    roles: bp.roles.map((r) => ({
      name: r.name,
      color: r.color,
      hoist: r.hoist,
      mentionable: r.mentionable ?? false,
      permissions: permsToFlags(r.perms),
      permissionsLabel: r.perms,
    })),
    permissions: bp.permissions,
    source: "ai",
  };
}
