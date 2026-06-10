import { SiteNav } from "@/components/site/site-nav";

/**
 * Marketing header. Thin wrapper around the unified <SiteNav> so every marketing
 * page shares one navbar (with the docked auth island and dropdown menus).
 */
export function SiteHeader() {
  return <SiteNav />;
}
