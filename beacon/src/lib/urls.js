/** Absolute URLs for a guild's public page and assets on this instance. */

export function pageUrl(config, row) {
  return `${config.publicUrl}/s/${row.slug}`;
}

export function joinUrl(config, row) {
  return `${pageUrl(config, row)}/join`;
}

/** Uploaded banner → served from /uploads; otherwise Discord's banner/splash; otherwise null. */
export function bannerUrl(config, row) {
  if (row.banner_path) return `${config.publicUrl}/uploads/${row.banner_path}`;
  return row.banner_url || null;
}

export function tagUrl(config, tag) {
  return `${config.publicUrl}/servers/${tag}`;
}
