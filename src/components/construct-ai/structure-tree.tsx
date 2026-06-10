"use client";

/**
 * D3 tidy-tree of the blueprint: Server → Categories → Channels, plus a roles
 * cluster. Animated link/node draw-in, hover highlights ancestor path, and it
 * re-renders live when the blueprint is edited. Lazy-loaded (ssr:false) by the
 * result view so D3 never ships in the first-load bundle.
 */

import * as React from "react";
import * as d3 from "d3";
import type { Blueprint } from "@/lib/blueprint";

type NodeKind = "root" | "category" | "channel" | "rolesGroup" | "role";
type TreeDatum = {
  name: string;
  kind: NodeKind;
  color?: string;
  children?: TreeDatum[];
};

const trunc = (s: string, n = 20) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

function buildData(bp: Blueprint): TreeDatum {
  return {
    name: bp.name,
    kind: "root",
    children: [
      ...bp.categories.map<TreeDatum>((c) => ({
        name: `${c.emoji} ${c.name}`,
        kind: "category",
        children: c.channels.map<TreeDatum>((ch) => ({
          name: ch.type === "text" ? `#${ch.name}` : ch.name,
          kind: "channel",
        })),
      })),
      {
        name: "ROLES",
        kind: "rolesGroup",
        children: bp.roles.map<TreeDatum>((r) => ({
          name: r.name,
          kind: "role",
          color: r.color,
        })),
      },
    ],
  };
}

export default function StructureTree({ blueprint }: { blueprint: Blueprint }) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  // Only play the draw-in on first render; live edits redraw instantly.
  const firstRef = React.useRef(true);

  React.useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animate = !reduce && firstRef.current;
    firstRef.current = false;

    const data = buildData(blueprint);
    const root = d3.hierarchy<TreeDatum>(data);

    const dx = 20; // vertical gap between siblings
    const dy = 190; // horizontal gap between depths
    d3.tree<TreeDatum>().nodeSize([dx, dy])(root);

    let minX = Infinity,
      maxX = -Infinity,
      maxY = 0;
    root.each((d) => {
      const x = d.x ?? 0;
      const y = d.y ?? 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    });

    const margin = { top: 24, right: 140, bottom: 24, left: 90 };
    const width = maxY + margin.left + margin.right;
    const height = maxX - minX + margin.top + margin.bottom;

    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();
    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", width)
      .attr("height", height)
      .attr("role", "img")
      .attr(
        "aria-label",
        `Structure diagram: ${blueprint.stats.categories} categories, ${blueprint.stats.channels} channels, ${blueprint.stats.roles} roles.`
      );

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top - minX})`);

    const color = (kind: NodeKind, c?: string) => {
      if (c) return c;
      switch (kind) {
        case "root":
          return "var(--primary)";
        case "category":
          return "var(--secondary)";
        case "rolesGroup":
          return "var(--coral)";
        case "role":
          return "var(--accent)";
        default:
          return "var(--muted-foreground)";
      }
    };

    // ── links ──
    const linkGen = d3
      .linkHorizontal<d3.HierarchyPointLink<TreeDatum>, d3.HierarchyPointNode<TreeDatum>>()
      .x((d) => d.y ?? 0)
      .y((d) => d.x ?? 0);

    const link = g
      .append("g")
      .attr("fill", "none")
      .selectAll("path")
      .data(root.links() as d3.HierarchyPointLink<TreeDatum>[])
      .join("path")
      .attr("d", linkGen)
      .style("stroke", "var(--card-border)")
      .style("stroke-width", 1.5)
      .attr("class", "bp-link");

    if (animate) {
      link.each(function () {
        const total = (this as SVGPathElement).getTotalLength();
        d3.select(this)
          .attr("stroke-dasharray", `${total} ${total}`)
          .attr("stroke-dashoffset", total)
          .transition()
          .duration(700)
          .ease(d3.easeCubicOut)
          .attr("stroke-dashoffset", 0);
      });
    }

    // ── nodes ──
    const node = g
      .append("g")
      .selectAll<SVGGElement, d3.HierarchyPointNode<TreeDatum>>("g")
      .data(root.descendants() as d3.HierarchyPointNode<TreeDatum>[])
      .join("g")
      .attr("transform", (d) => `translate(${d.y ?? 0},${d.x ?? 0})`)
      .attr("class", "bp-node")
      .style("cursor", "default");

    node
      .append("circle")
      .attr("r", (d) => (d.data.kind === "root" ? 7 : d.data.kind === "channel" || d.data.kind === "role" ? 3.5 : 5))
      .style("fill", (d) => color(d.data.kind, d.data.color))
      .style("stroke", "var(--background)")
      .style("stroke-width", 1.5);

    node
      .append("text")
      .attr("dy", "0.32em")
      .attr("x", (d) => ((d.children?.length ?? 0) ? -9 : 9))
      .attr("text-anchor", (d) => ((d.children?.length ?? 0) ? "end" : "start"))
      .style("font-size", (d) => (d.data.kind === "root" ? "13px" : "11px"))
      .style("font-family", "var(--font-mono)")
      .style("font-weight", (d) =>
        d.data.kind === "root" || d.data.kind === "category" || d.data.kind === "rolesGroup" ? 700 : 400
      )
      .style("fill", "var(--foreground)")
      .style("paint-order", "stroke")
      .style("stroke", "var(--background)")
      .style("stroke-width", "3px")
      .text((d) => trunc(d.data.name));

    if (animate) {
      node
        .style("opacity", 0)
        .transition()
        .delay((d) => d.depth * 180)
        .duration(360)
        .style("opacity", 1);
    }

    // ── hover: highlight the ancestor path ──
    node
      .on("mouseenter", (_e, d) => {
        const ids = new Set(d.ancestors());
        node.style("opacity", (n) => (ids.has(n) ? 1 : 0.25));
        link.style("opacity", (l) => (ids.has(l.target) ? 1 : 0.12));
      })
      .on("mouseleave", () => {
        node.style("opacity", 1);
        link.style("opacity", 1);
      });

    return () => {
      svg.selectAll("*").remove();
    };
  }, [blueprint]);

  return (
    <div className="max-h-[28rem] overflow-auto rounded-2xl bg-background-deep/40 p-2">
      <svg ref={svgRef} className="min-w-full" />
    </div>
  );
}
