"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A small emoji picker built for naming Discord channels.
 *
 * Deliberately curated rather than exhaustive: a full Unicode set is thousands
 * of emoji, almost none of which belong in a channel name. Each entry carries
 * search keywords so "chat" finds 💬 even though its Unicode name is
 * "speech balloon".
 */

type Entry = [emoji: string, keywords: string];

const GROUPS: { label: string; emoji: Entry[] }[] = [
  {
    label: "Server",
    emoji: [
      ["📌", "rules pin important"], ["📢", "announce news broadcast"], ["📣", "announce shout"],
      ["👋", "welcome hello intro greet"], ["✅", "verify check approved"], ["🎫", "ticket support help"],
      ["🛡", "mod staff shield security"], ["⚙", "settings config admin"], ["🔒", "locked private staff"],
      ["📋", "info board list"], ["🗂", "category folder archive"], ["🏠", "home lobby main"],
      ["❓", "faq question help"], ["📖", "guide docs read wiki"], ["⚖", "rules law legal"],
      ["🚨", "alert report urgent"], ["🔔", "notify alerts ping"], ["📝", "form apply application"],
    ],
  },
  {
    label: "Chat",
    emoji: [
      ["💬", "general chat talk text"], ["🗨", "chat talk discussion"], ["💭", "thoughts ideas"],
      ["🎲", "off-topic random misc"], ["😂", "memes funny lol"], ["🖼", "media images pics gallery"],
      ["📷", "photos camera pics"], ["🎬", "clips video media"], ["🎵", "music song audio"],
      ["🔊", "voice call talk audio"], ["🎙", "stage podcast mic speak"], ["🧵", "forum thread topic"],
      ["🗳", "polls vote survey"], ["💡", "ideas suggestions feedback"], ["🌱", "intro new starter"],
      ["🎉", "celebrate party events"], ["📅", "events calendar schedule"], ["🏆", "wins achievements"],
    ],
  },
  {
    label: "Gaming",
    emoji: [
      ["🎮", "gaming games play"], ["🕹", "arcade retro game"], ["🎯", "aim target goal"],
      ["⚔", "pvp combat battle fight"], ["🛠", "build craft tools"], ["🧩", "puzzle coop"],
      ["🏅", "rank tier competitive"], ["👑", "vip king elite"], ["💀", "hardcore death"],
      ["🔥", "hot streak fire"], ["⚡", "fast power energy"], ["🚀", "launch boost"],
      ["🎰", "gacha luck rng"], ["🥇", "first winner tournament"], ["🤝", "lfg team squad party"],
    ],
  },
  {
    label: "Work",
    emoji: [
      ["💻", "dev code programming"], ["🐛", "bugs issues"], ["📊", "stats analytics data"],
      ["📈", "growth trading charts"], ["💰", "money finance economy"], ["🪙", "crypto coin token"],
      ["🛒", "shop store market"], ["📦", "orders products releases"], ["🧪", "testing beta lab"],
      ["🔧", "support fix maintenance"], ["📚", "resources library learn"], ["🎓", "education class study"],
      ["🗓", "planning roadmap"], ["✍", "writing blog content"], ["🎨", "design art creative"],
    ],
  },
  {
    label: "Symbols",
    emoji: [
      ["⭐", "star favourite"], ["✨", "sparkle new shiny"], ["❤", "heart love"],
      ["🔹", "blue dot bullet"], ["🔸", "orange dot bullet"], ["▪", "square dot"],
      ["➤", "arrow point"], ["🌐", "global world web"], ["🌙", "night moon"],
      ["☀", "day sun"], ["🌍", "world region global"], ["🇬🇧", "uk english flag"],
      ["🇺🇸", "us usa english flag"], ["🇪🇸", "spain spanish flag"], ["🇩🇪", "germany german flag"],
    ],
  },
];

const ALL = GROUPS.flatMap((g) => g.emoji);

export function EmojiPicker({
  value,
  onChange,
  onClose,
  className,
}: {
  value?: string;
  onChange: (emoji: string) => void;
  onClose?: () => void;
  className?: string;
}) {
  const [q, setQ] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);

  // Close on outside click / Escape so the popover behaves like a menu.
  React.useEffect(() => {
    if (!onClose) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const needle = q.trim().toLowerCase();
  const results = needle
    ? ALL.filter(([e, k]) => k.includes(needle) || e === needle)
    : null;

  return (
    <div
      ref={ref}
      className={cn(
        "z-50 w-64 rounded-2xl border border-card-border bg-card p-2 shadow-xl",
        className
      )}
      role="dialog"
      aria-label="Choose an emoji"
    >
      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          autoFocus
          aria-label="Search emoji"
          className="w-full rounded-lg border border-card-border bg-background py-1.5 pl-8 pr-7 text-sm outline-none focus:border-primary/60"
        />
        {value && (
          <button
            onClick={() => { onChange(""); onClose?.(); }}
            className="absolute right-1.5 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:text-foreground"
            aria-label="Clear emoji"
            type="button"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="max-h-56 overflow-y-auto pr-0.5">
        {results ? (
          results.length ? (
            <Grid entries={results} value={value} onPick={(e) => { onChange(e); onClose?.(); }} />
          ) : (
            <p className="px-1 py-6 text-center text-xs text-muted-foreground">
              Nothing matches “{q}”.
            </p>
          )
        ) : (
          GROUPS.map((g) => (
            <div key={g.label} className="mb-2">
              <div className="px-1 pb-1 text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground">
                {g.label}
              </div>
              <Grid entries={g.emoji} value={value} onPick={(e) => { onChange(e); onClose?.(); }} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Grid({
  entries, value, onPick,
}: { entries: Entry[]; value?: string; onPick: (e: string) => void }) {
  return (
    <div className="grid grid-cols-8 gap-0.5">
      {entries.map(([e, k]) => (
        <button
          key={e}
          type="button"
          onClick={() => onPick(e)}
          title={k.split(" ")[0]}
          aria-label={k.split(" ")[0]}
          className={cn(
            "grid aspect-square place-items-center rounded-lg text-lg transition-colors hover:bg-primary/10",
            value === e && "bg-primary/20 ring-1 ring-primary/50"
          )}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

/** A compact button that opens the picker inline. */
export function EmojiButton({
  value,
  onChange,
  label,
  fallback = "＋",
}: {
  value?: string;
  onChange: (emoji: string) => void;
  label: string;
  fallback?: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        aria-expanded={open}
        className={cn(
          "grid size-8 place-items-center rounded-lg border border-card-border bg-background text-base transition-colors hover:border-primary/50",
          !value && "text-muted-foreground"
        )}
      >
        {value || fallback}
      </button>
      {open && (
        <div className="absolute left-0 top-9">
          <EmojiPicker value={value} onChange={onChange} onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
