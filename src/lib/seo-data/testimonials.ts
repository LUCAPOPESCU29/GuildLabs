/**
 * Real testimonials only. This array is intentionally EMPTY until genuine
 * social proof exists — never seed it with invented quotes. The /wall page
 * renders a designed empty state while it's empty, and only emits Review
 * structured data once real entries are added.
 *
 * Shape for when real ones arrive (uncomment and fill in):
 *
 * {
 *   author: "Alex",
 *   handle: "@alex",
 *   source: "discord",
 *   quote: "ChartIt is the only chart bot our trading server actually uses.",
 *   serverName: "Some Trading Server",
 *   avatar: "/testimonials/alex.png",
 *   screenshot: "/testimonials/alex-screenshot.png",
 * }
 */

export type TestimonialSource = "discord" | "twitter" | "email";

export type Testimonial = {
  author: string;
  handle?: string;
  avatar?: string;
  source: TestimonialSource;
  quote: string;
  serverName?: string;
  screenshot?: string;
};

export const TESTIMONIALS: Testimonial[] = [];
