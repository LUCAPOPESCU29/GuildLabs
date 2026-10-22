import { dayOf } from "../lib/store.js";
import { ensureInvite } from "../lib/discord-data.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Once a day, confirm every stored invite still exists and recreate any that
 * were revoked — so a Join button never leads to "Invite Invalid".
 */
export async function runInviteJob(client) {
  const { store } = client.beacon;
  const today = dayOf();
  if (store.getMeta("invites_checked") === today) return;

  let checked = 0;
  let recreated = 0;
  for (const row of store.listAll()) {
    if (!row.invite_code || !client.guilds.cache.has(row.guild_id)) continue;
    try {
      const before = row.invite_code;
      const after = await ensureInvite(client, store, row);
      checked++;
      if (after.invite_code !== before) recreated++;
      await sleep(200);
    } catch (err) {
      console.warn(`[INVITE] ${row.guild_id}: ${err.message}`);
    }
  }
  store.setMeta("invites_checked", today);
  if (checked) console.log(`[INVITE] Checked ${checked} invite(s), recreated ${recreated}`);
}
