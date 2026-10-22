/**
 * Short-lived, in-memory state for multi-step interactions (the setup flow's
 * two tag menus + Continue button). Keyed per guild + user so two admins can
 * set up different servers at once without colliding.
 */
export function createSessions({ ttlMs = 15 * 60_000, now = () => Date.now() } = {}) {
  const map = new Map();

  function key(guildId, userId) {
    return `${guildId}:${userId}`;
  }

  function prune() {
    const t = now();
    for (const [k, v] of map) if (v.expires <= t) map.delete(k);
  }

  return {
    get(guildId, userId) {
      prune();
      const s = map.get(key(guildId, userId));
      return s && s.expires > now() ? s.data : null;
    },
    set(guildId, userId, data) {
      prune();
      map.set(key(guildId, userId), { data, expires: now() + ttlMs });
      return data;
    },
    update(guildId, userId, patch) {
      const current = this.get(guildId, userId) ?? {};
      return this.set(guildId, userId, { ...current, ...patch });
    },
    clear(guildId, userId) {
      map.delete(key(guildId, userId));
    },
  };
}

export const sessions = createSessions();
