import { describe, it, expect } from "vitest";
import { esc, escAttrUrl, paragraphs, formatNumber, sparkline } from "../src/lib/html.js";

describe("esc", () => {
  it("escapes the five HTML metacharacters", () => {
    expect(esc(`<a href="x" title='y'>&</a>`)).toBe("&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;");
  });
  it("tolerates null and numbers", () => {
    expect(esc(null)).toBe("");
    expect(esc(42)).toBe("42");
  });
});

describe("escAttrUrl", () => {
  it("allows http(s), mailto, and relative URLs", () => {
    expect(escAttrUrl("https://example.com/a?b=1&c=2")).toBe("https://example.com/a?b=1&amp;c=2");
    expect(escAttrUrl("/s/slug")).toBe("/s/slug");
    expect(escAttrUrl("mailto:a@b.c")).toBe("mailto:a@b.c");
  });
  it("neutralises javascript: and data: URLs", () => {
    expect(escAttrUrl("javascript:alert(1)")).toBe("#");
    expect(escAttrUrl("data:text/html,x")).toBe("#");
  });
});

describe("paragraphs", () => {
  it("splits on blank lines and keeps single line breaks", () => {
    expect(paragraphs("one\ntwo\n\nthree <b>")).toBe("<p>one<br>two</p><p>three &lt;b&gt;</p>");
  });
});

describe("formatNumber", () => {
  it("abbreviates thousands and millions", () => {
    expect(formatNumber(999)).toBe("999");
    expect(formatNumber(1500)).toBe("1.5k");
    expect(formatNumber(12_000)).toBe("12k");
    expect(formatNumber(2_400_000)).toBe("2.4M");
  });
});

describe("sparkline", () => {
  it("returns nothing for fewer than two points", () => {
    expect(sparkline([5])).toBe("");
  });
  it("renders an SVG path for a series", () => {
    const svg = sparkline([1, 3, 2, 5]);
    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain("<path");
    expect(svg).toContain("4 days");
  });
});
