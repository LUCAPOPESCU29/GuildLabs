import {
  Gamepad2,
  GraduationCap,
  Coins,
  Star,
  Music,
  Palette,
  Code2,
  Briefcase,
  Wand2,
  Gem,
  Rocket,
  BookOpen,
  type LucideProps,
} from "lucide-react";
import { cn } from "@/lib/utils";

type IconComponent = React.ComponentType<LucideProps>;

const ICONS: Record<string, IconComponent> = {
  "gaming-server": Gamepad2,
  "study-group": GraduationCap,
  "crypto-community": Coins,
  "anime-server": Star,
  "music-server": Music,
  "art-community": Palette,
  "developer-server": Code2,
  "business-server": Briefcase,
  "roleplay-server": Wand2,
  "nft-community": Gem,
  "startup-community": Rocket,
  "book-club": BookOpen,
};

export const TEMPLATE_COLORS: Record<string, { start: string; end: string; glow: string }> = {
  "gaming-server":    { start: "#ef4444", end: "#f97316", glow: "rgba(239,68,68,0.14)" },
  "study-group":      { start: "#10b981", end: "#06b6d4", glow: "rgba(16,185,129,0.14)" },
  "crypto-community": { start: "#f59e0b", end: "#f97316", glow: "rgba(245,158,11,0.14)" },
  "anime-server":     { start: "#ec4899", end: "#a855f7", glow: "rgba(236,72,153,0.14)" },
  "music-server":     { start: "#8b5cf6", end: "#6366f1", glow: "rgba(139,92,246,0.14)" },
  "art-community":    { start: "#f97316", end: "#ec4899", glow: "rgba(249,115,22,0.14)" },
  "developer-server": { start: "#3b82f6", end: "#06b6d4", glow: "rgba(59,130,246,0.14)" },
  "business-server":  { start: "#6366f1", end: "#3b82f6", glow: "rgba(99,102,241,0.14)" },
  "roleplay-server":  { start: "#a855f7", end: "#ec4899", glow: "rgba(168,85,247,0.14)" },
  "nft-community":    { start: "#06b6d4", end: "#3b82f6", glow: "rgba(6,182,212,0.14)" },
  "startup-community":{ start: "#f59e0b", end: "#84cc16", glow: "rgba(245,158,11,0.14)" },
  "book-club":        { start: "#84cc16", end: "#10b981", glow: "rgba(132,204,22,0.14)" },
};

export function TemplateIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = ICONS[slug] ?? Gamepad2;
  return <Icon className={className} />;
}

export function TemplateIconBadge({
  slug,
  size = "md",
}: {
  slug: string;
  size?: "sm" | "md" | "lg";
}) {
  const colors = TEMPLATE_COLORS[slug] ?? { start: "#5865f2", end: "#7289da" };

  const outerSize = { sm: "size-11", md: "size-14", lg: "size-20" }[size];
  const outerRadius = { sm: "rounded-xl", md: "rounded-2xl", lg: "rounded-3xl" }[size];
  const innerRadius = { sm: "rounded-[10px]", md: "rounded-[14px]", lg: "rounded-[22px]" }[size];
  const iconSize = { sm: "size-4.5", md: "size-6", lg: "size-9" }[size];

  return (
    <div
      className={cn("relative shrink-0 p-px", outerSize, outerRadius)}
      style={{ background: `linear-gradient(135deg, ${colors.start}, ${colors.end})` }}
    >
      <div className={cn("flex size-full items-center justify-center bg-card", innerRadius)}>
        <TemplateIcon slug={slug} className={cn("text-foreground", iconSize)} />
      </div>
    </div>
  );
}
