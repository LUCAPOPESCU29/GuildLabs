"use client";

/**
 * Discord Embed Builder — a precision creator tool.
 *
 * Design: dark "OLED" precision-tool aesthetic (skill: Real-Time/Operations +
 * Dark Mode). Data-dense but scannable, status colors for live limit
 * validation, mono for JSON, faithful Discord preview with rendered markdown.
 *
 * Features: multiple embeds (up to 10), message content + webhook identity,
 * full embed fields incl. author link, color presets, drag-reorder fields,
 * markdown-rendered live preview, Discord limit validation, starter presets,
 * import JSON, export (embed / payload / curl / download), live webhook send,
 * autosave + shareable URL. Everything stays in the browser.
 */

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Check,
  Copy,
  Plus,
  Send,
  Trash2,
  Loader2,
  Code2,
  GripVertical,
  Shuffle,
  Download,
  Upload,
  Link2,
  Layers,
  X,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────
type Field = { id: string; name: string; value: string; inline: boolean };
type Embed = {
  id: string;
  author: string;
  authorUrl: string;
  authorIcon: string;
  title: string;
  url: string;
  description: string;
  color: string;
  fields: Field[];
  image: string;
  thumbnail: string;
  footer: string;
  footerIcon: string;
  timestamp: boolean;
};
type Message = { content: string; username: string; avatarUrl: string; embeds: Embed[] };

// ── Discord limits ────────────────────────────────────────────────────────────
const LIMITS = {
  content: 2000,
  username: 80,
  title: 256,
  description: 4096,
  fieldName: 256,
  fieldValue: 1024,
  footer: 2048,
  author: 256,
  fields: 25,
  embeds: 10,
  total: 6000,
};

const COLOR_PRESETS = [
  "#5865f2", "#57f287", "#fee75c", "#eb459e", "#ed4245",
  "#3498db", "#9b59b6", "#1abc9c", "#e67e22", "#f1c40f",
];

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function hexToInt(hex: string): number {
  const h = hex.replace("#", "");
  return parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16) || 0;
}

function emptyEmbed(): Embed {
  return {
    id: uid(),
    author: "", authorUrl: "", authorIcon: "",
    title: "", url: "", description: "",
    color: "#5865f2", fields: [],
    image: "", thumbnail: "", footer: "", footerIcon: "", timestamp: false,
  };
}

const DEFAULT_MESSAGE: Message = {
  content: "",
  username: "GuildLabs",
  avatarUrl: "",
  embeds: [
    {
      ...emptyEmbed(),
      title: "Welcome to the server! 🎉",
      description:
        "This embed was built with the **GuildLabs** embed builder.\nEdit anything on the left — the preview updates live.\n\n> Supports **bold**, *italic*, `code`, [links](https://guildlabs.fun) and more.",
      color: "#5865f2",
      fields: [
        { id: uid(), name: "📜 Rules", value: "Be kind. No spam.", inline: true },
        { id: uid(), name: "🎭 Roles", value: "Grab yours in #roles", inline: true },
      ],
      footer: "GuildLabs",
      timestamp: true,
    },
  ],
};

// ── Starter presets ───────────────────────────────────────────────────────────
const PRESETS: { name: string; emoji: string; make: () => Message }[] = [
  {
    name: "Welcome", emoji: "👋",
    make: () => ({ ...DEFAULT_MESSAGE, embeds: [{ ...DEFAULT_MESSAGE.embeds[0], id: uid(), fields: DEFAULT_MESSAGE.embeds[0].fields.map((f) => ({ ...f, id: uid() })) }] }),
  },
  {
    name: "Announcement", emoji: "📢",
    make: () => ({
      content: "@everyone", username: "GuildLabs", avatarUrl: "",
      embeds: [{ ...emptyEmbed(), title: "📢 Big news!", description: "We just shipped something new. Here's what changed and why it matters to you.", color: "#fee75c", footer: "Posted by the team", timestamp: true }],
    }),
  },
  {
    name: "Rules", emoji: "📜",
    make: () => ({
      content: "", username: "GuildLabs", avatarUrl: "",
      embeds: [{
        ...emptyEmbed(), title: "Server Rules", description: "Read these before posting. Breaking them may result in a timeout or ban.", color: "#ed4245",
        fields: [
          { id: uid(), name: "1 · Be respectful", value: "No harassment, hate, or personal attacks.", inline: false },
          { id: uid(), name: "2 · No spam", value: "Keep self-promo to the right channels.", inline: false },
          { id: uid(), name: "3 · Stay on topic", value: "Use the channel that fits your message.", inline: false },
        ],
        footer: "Thanks for keeping it friendly", timestamp: false,
      }],
    }),
  },
  {
    name: "Giveaway", emoji: "🎁",
    make: () => ({
      content: "🎉 **GIVEAWAY** 🎉", username: "GuildLabs", avatarUrl: "",
      embeds: [{
        ...emptyEmbed(), title: "🎁 Nitro Giveaway", description: "React with 🎉 to enter!\n\n**Prize:** 1 month of Nitro\n**Ends:** in 24 hours", color: "#eb459e",
        fields: [{ id: uid(), name: "Hosted by", value: "@mods", inline: true }, { id: uid(), name: "Winners", value: "1", inline: true }],
        footer: "Good luck!", timestamp: true,
      }],
    }),
  },
];

// ── Serialization ─────────────────────────────────────────────────────────────
function trimUndef<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    out[k] = v;
  }
  return out as Partial<T>;
}

function embedToJson(e: Embed) {
  return trimUndef({
    author: e.author ? trimUndef({ name: e.author, url: e.authorUrl || undefined, icon_url: e.authorIcon || undefined }) : undefined,
    title: e.title || undefined,
    url: e.url || undefined,
    description: e.description || undefined,
    color: hexToInt(e.color),
    fields: e.fields.filter((f) => f.name.trim() || f.value.trim()).map((f) => trimUndef({ name: f.name || "​", value: f.value || "​", inline: f.inline })),
    image: e.image ? { url: e.image } : undefined,
    thumbnail: e.thumbnail ? { url: e.thumbnail } : undefined,
    footer: e.footer ? trimUndef({ text: e.footer, icon_url: e.footerIcon || undefined }) : undefined,
    timestamp: e.timestamp ? "2024-01-01T00:00:00.000Z" : undefined,
  });
}

function messageToPayload(m: Message) {
  return trimUndef({
    content: m.content || undefined,
    username: m.username || undefined,
    avatar_url: m.avatarUrl || undefined,
    embeds: m.embeds.map(embedToJson),
  });
}

function totalChars(m: Message): number {
  return m.embeds.reduce((sum, e) => {
    let n = e.title.length + e.description.length + e.author.length + e.footer.length;
    for (const f of e.fields) n += f.name.length + f.value.length;
    return sum + n;
  }, 0);
}

// base64 url-safe encode/decode for share links
function encodeShare(m: Message): string {
  return btoa(encodeURIComponent(JSON.stringify(m))).replace(/=+$/, "");
}
function decodeShare(s: string): Message | null {
  try {
    const m = JSON.parse(decodeURIComponent(atob(s))) as Message;
    if (!m || !Array.isArray(m.embeds)) return null;
    // ensure ids exist
    m.embeds = m.embeds.map((e) => ({ ...emptyEmbed(), ...e, id: uid(), fields: (e.fields ?? []).map((f) => ({ ...f, id: uid() })) }));
    return m;
  } catch {
    return null;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export function EmbedBuilder() {
  const reduce = useReducedMotion();
  const [msg, setMsg] = React.useState<Message>(DEFAULT_MESSAGE);
  const [active, setActive] = React.useState(0);
  const [showJson, setShowJson] = React.useState(false);
  const [copied, setCopied] = React.useState<string | null>(null);
  const [webhook, setWebhook] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const hydrated = React.useRef(false);

  // Load from share hash or localStorage once.
  React.useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    try {
      const hash = window.location.hash.match(/[#&]s=([^&]+)/)?.[1];
      const loaded = hash ? decodeShare(hash) : null;
      /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from URL/localStorage */
      if (loaded) {
        setMsg(loaded);
        return;
      }
      const saved = localStorage.getItem("guildlabs:embed");
      if (saved) {
        const m = decodeShare(saved);
        if (m) setMsg(m);
      }
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {
      /* ignore */
    }
  }, []);

  // Autosave.
  React.useEffect(() => {
    try {
      localStorage.setItem("guildlabs:embed", encodeShare(msg));
    } catch {
      /* ignore */
    }
  }, [msg]);

  const embed = msg.embeds[active] ?? msg.embeds[0];
  const payload = React.useMemo(() => messageToPayload(msg), [msg]);
  const total = totalChars(msg);

  // ── Mutators ────────────────────────────────────────────────────────────────
  const patchEmbed = (patch: Partial<Embed>) =>
    setMsg((m) => ({ ...m, embeds: m.embeds.map((e, i) => (i === active ? { ...e, ...patch } : e)) }));
  const patchField = (fid: string, patch: Partial<Field>) =>
    patchEmbed({ fields: embed.fields.map((f) => (f.id === fid ? { ...f, ...patch } : f)) });
  const addField = () => embed.fields.length < LIMITS.fields && patchEmbed({ fields: [...embed.fields, { id: uid(), name: "", value: "", inline: false }] });
  const removeField = (fid: string) => patchEmbed({ fields: embed.fields.filter((f) => f.id !== fid) });

  const addEmbed = () => {
    if (msg.embeds.length >= LIMITS.embeds) return;
    setMsg((m) => ({ ...m, embeds: [...m.embeds, { ...emptyEmbed(), color: COLOR_PRESETS[m.embeds.length % COLOR_PRESETS.length] }] }));
    setActive(msg.embeds.length);
  };
  const removeEmbed = (i: number) => {
    if (msg.embeds.length <= 1) return;
    setMsg((m) => ({ ...m, embeds: m.embeds.filter((_, idx) => idx !== i) }));
    setActive((a) => Math.max(0, a >= i ? a - 1 : a));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  function onDragEnd(e: DragEndEvent) {
    const { active: a, over } = e;
    if (!over || a.id === over.id) return;
    const oldI = embed.fields.findIndex((f) => f.id === a.id);
    const newI = embed.fields.findIndex((f) => f.id === over.id);
    if (oldI >= 0 && newI >= 0) patchEmbed({ fields: arrayMove(embed.fields, oldI, newI) });
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      toast.success("Copied");
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Couldn't copy — copy it manually.");
    }
  }
  function download() {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "embed.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  function shareLink() {
    const url = `${window.location.origin}/tools/embed-builder#s=${encodeShare(msg)}`;
    copy("share", url);
    try {
      history.replaceState(null, "", `#s=${encodeShare(msg)}`);
    } catch {
      /* ignore */
    }
  }
  const curl = `curl -X POST "WEBHOOK_URL" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(payload)}'`;

  async function sendTest() {
    const wh = webhook.trim();
    if (!/^https:\/\/(discord|discordapp)\.com\/api\/webhooks\//.test(wh)) {
      toast.error("Paste a valid Discord webhook URL.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(wh, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, embeds: payload.embeds?.map((e) => ({ ...e, timestamp: new Date().toISOString() })) }),
      });
      if (res.ok || res.status === 204) toast.success("Sent! Check your channel.");
      else toast.error(`Discord rejected it (${res.status}).`);
    } catch {
      toast.error("Browser couldn't reach the webhook. Copy the JSON instead.");
    } finally {
      setSending(false);
    }
  }

  function loadPreset(make: () => Message) {
    setMsg(make());
    setActive(0);
    toast.success("Preset loaded");
  }

  const overBudget = total > LIMITS.total;

  return (
    <main className="relative min-h-screen">
      {/* Animated header band */}
      <div className="relative overflow-hidden border-b border-card-border">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{ background: "radial-gradient(60% 120% at 20% 0%, color-mix(in oklab, var(--primary) 30%, transparent), transparent 60%), radial-gradient(50% 120% at 90% 0%, color-mix(in oklab, var(--secondary) 28%, transparent), transparent 60%)" }}
          animate={reduce ? undefined : { backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-10">
          <Link href="/tools" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            ← Free tools
          </Link>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl font-black tracking-tight sm:text-5xl">Embed Builder</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Design rich Discord embeds with a live preview. Copy the JSON, send a live test, or share an editable link — all in your browser.
              </p>
            </div>
            {/* Presets */}
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button key={p.name} onClick={() => loadPreset(p.make)} className="inline-flex items-center gap-1.5 rounded-full border border-card-border bg-card/60 px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/10 cursor-pointer">
                  <span aria-hidden>{p.emoji}</span> {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
        {/* ── Editor ──────────────────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Embed tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <Layers className="size-4 text-muted-foreground" />
            {msg.embeds.map((e, i) => (
              <button
                key={e.id}
                onClick={() => setActive(i)}
                className={`group/tab inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-semibold transition-colors cursor-pointer ${i === active ? "border-primary/50 bg-primary/10 text-foreground" : "border-card-border bg-card/40 text-muted-foreground hover:text-foreground"}`}
              >
                <span className="size-2.5 rounded-full" style={{ background: e.color }} />
                Embed {i + 1}
                {msg.embeds.length > 1 && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(ev) => { ev.stopPropagation(); removeEmbed(i); }}
                    onKeyDown={(ev) => { if (ev.key === "Enter") { ev.stopPropagation(); removeEmbed(i); } }}
                    className="-mr-1 grid size-4 place-items-center rounded text-muted-foreground hover:text-destructive"
                    aria-label={`Remove embed ${i + 1}`}
                  >
                    <X className="size-3" />
                  </span>
                )}
              </button>
            ))}
            {msg.embeds.length < LIMITS.embeds && (
              <button onClick={addEmbed} className="inline-flex items-center gap-1 rounded-xl border border-dashed border-card-border px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground cursor-pointer">
                <Plus className="size-4" /> Embed
              </button>
            )}
          </div>

          <Group title="Message" hint="Sent with the embed via webhook">
            <TextArea label="Message content" value={msg.content} onChange={(v) => setMsg((m) => ({ ...m, content: v }))} placeholder="Text shown above the embed (optional)" rows={2} max={LIMITS.content} />
            <Row>
              <TextInput label="Webhook username" value={msg.username} onChange={(v) => setMsg((m) => ({ ...m, username: v }))} placeholder="GuildLabs" max={LIMITS.username} />
              <TextInput label="Webhook avatar URL" value={msg.avatarUrl} onChange={(v) => setMsg((m) => ({ ...m, avatarUrl: v }))} placeholder="https://…/avatar.png" />
            </Row>
          </Group>

          <Group title="Content">
            <Row>
              <TextInput label="Title" value={embed.title} onChange={(v) => patchEmbed({ title: v })} placeholder="Embed title" max={LIMITS.title} />
              <TextInput label="Title URL" value={embed.url} onChange={(v) => patchEmbed({ url: v })} placeholder="https://…" />
            </Row>
            <TextArea label="Description" value={embed.description} onChange={(v) => patchEmbed({ description: v })} placeholder="Markdown supported: **bold**, *italic*, `code`, > quote, - list, [links](url)" max={LIMITS.description} />
            <div className="mt-3">
              <Label>Color</Label>
              <div className="flex flex-wrap items-center gap-2">
                <input type="color" value={embed.color} onChange={(e) => patchEmbed({ color: e.target.value })} className="h-10 w-12 cursor-pointer rounded-lg border border-card-border bg-transparent" aria-label="Embed color" />
                <input value={embed.color} onChange={(e) => patchEmbed({ color: e.target.value })} className="glass-input w-28 rounded-xl px-3 py-2 font-mono text-sm uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Hex color" />
                <button onClick={() => patchEmbed({ color: COLOR_PRESETS[Math.floor((Date.now() / 7) % COLOR_PRESETS.length)] })} className="inline-flex items-center gap-1 rounded-lg border border-card-border bg-card/40 px-2.5 py-2 text-xs font-semibold transition-colors hover:bg-primary/10 cursor-pointer" title="Random color">
                  <Shuffle className="size-3.5" /> Random
                </button>
                <div className="flex gap-1">
                  {COLOR_PRESETS.slice(0, 8).map((c) => (
                    <button key={c} onClick={() => patchEmbed({ color: c })} className="size-6 rounded-md ring-1 ring-inset ring-black/20 transition-transform hover:scale-110 cursor-pointer" style={{ background: c }} aria-label={`Use ${c}`} />
                  ))}
                </div>
              </div>
            </div>
          </Group>

          <Group title="Author">
            <Row>
              <TextInput label="Author name" value={embed.author} onChange={(v) => patchEmbed({ author: v })} placeholder="Author name" max={LIMITS.author} />
              <TextInput label="Author URL" value={embed.authorUrl} onChange={(v) => patchEmbed({ authorUrl: v })} placeholder="https://…" />
            </Row>
            <TextInput label="Author icon URL" value={embed.authorIcon} onChange={(v) => patchEmbed({ authorIcon: v })} placeholder="https://…/icon.png" />
          </Group>

          <Group
            title={`Fields (${embed.fields.length}/${LIMITS.fields})`}
            action={
              <button onClick={addField} disabled={embed.fields.length >= LIMITS.fields} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline disabled:opacity-40 cursor-pointer">
                <Plus className="size-4" /> Add field
              </button>
            }
          >
            {embed.fields.length === 0 ? (
              <p className="text-sm text-muted-foreground">No fields yet. Fields show as labelled columns inside the embed.</p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={embed.fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {embed.fields.map((f) => (
                      <SortableFieldRow key={f.id} field={f} onChange={(patch) => patchField(f.id, patch)} onRemove={() => removeField(f.id)} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </Group>

          <Group title="Media & footer">
            <Row>
              <TextInput label="Image URL" value={embed.image} onChange={(v) => patchEmbed({ image: v })} placeholder="https://…/image.png" />
              <TextInput label="Thumbnail URL" value={embed.thumbnail} onChange={(v) => patchEmbed({ thumbnail: v })} placeholder="https://…/thumb.png" />
            </Row>
            <Row>
              <TextInput label="Footer" value={embed.footer} onChange={(v) => patchEmbed({ footer: v })} placeholder="Footer text" max={LIMITS.footer} />
              <TextInput label="Footer icon URL" value={embed.footerIcon} onChange={(v) => patchEmbed({ footerIcon: v })} placeholder="https://…/icon.png" />
            </Row>
            <label className="mt-1 flex w-fit cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={embed.timestamp} onChange={(e) => patchEmbed({ timestamp: e.target.checked })} className="size-4 accent-[var(--primary)]" />
              Show timestamp
            </label>
          </Group>
        </div>

        {/* ── Preview + output ────────────────────────────────────────────── */}
        <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Live preview</Label>
              <BudgetMeter total={total} max={LIMITS.total} over={overBudget} />
            </div>
            <DiscordWindow>
              <MessagePreview msg={msg} />
            </DiscordWindow>
          </div>

          {/* Webhook send */}
          <div className="glass rounded-2xl p-4">
            <Label>Send a live test</Label>
            <div className="flex gap-2">
              <input value={webhook} onChange={(e) => setWebhook(e.target.value)} placeholder="https://discord.com/api/webhooks/…" className="glass-input min-w-0 flex-1 rounded-xl px-3 py-2.5 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              <Button onClick={sendTest} disabled={sending || overBudget}>
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Posts straight from your browser to Discord — the URL never reaches our servers.</p>
          </div>

          {/* Export dock */}
          <div className="glass rounded-2xl p-4">
            <div className="flex flex-wrap items-center gap-2">
              <OutBtn icon={copied === "payload" ? Check : Copy} label="Copy payload" onClick={() => copy("payload", JSON.stringify(payload, null, 2))} active={copied === "payload"} />
              <OutBtn icon={copied === "embed" ? Check : Copy} label="Copy embed" onClick={() => copy("embed", JSON.stringify(embedToJson(embed), null, 2))} active={copied === "embed"} />
              <OutBtn icon={copied === "curl" ? Check : Terminal} label="Copy cURL" onClick={() => copy("curl", curl)} active={copied === "curl"} />
              <OutBtn icon={Download} label="Download" onClick={download} />
              <OutBtn icon={copied === "share" ? Check : Link2} label="Share link" onClick={shareLink} active={copied === "share"} />
              <OutBtn icon={Upload} label="Import" onClick={() => setImportOpen(true)} />
            </div>
            <button onClick={() => setShowJson((s) => !s)} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground transition-colors hover:text-primary cursor-pointer">
              <Code2 className="size-4" /> {showJson ? "Hide" : "Show"} JSON
            </button>
            {showJson && (
              <pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-[#0b0c10] p-3 font-mono text-xs leading-relaxed text-emerald-200/90 ring-1 ring-white/5">
                {JSON.stringify(payload, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>

      {importOpen && (
        <ImportModal
          onClose={() => setImportOpen(false)}
          onImport={(m) => {
            setMsg(m);
            setActive(0);
            setImportOpen(false);
            toast.success("Imported");
          }}
        />
      )}
    </main>
  );
}

// ── Sortable field row ────────────────────────────────────────────────────────
function SortableFieldRow({ field, onChange, onRemove }: { field: Field; onChange: (p: Partial<Field>) => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const style = { transform: CSS.Translate.toString(transform), transition, zIndex: isDragging ? 50 : undefined };
  return (
    <div ref={setNodeRef} style={style} className={`rounded-2xl border border-card-border bg-card/40 p-3 ${isDragging ? "opacity-80 shadow-xl ring-2 ring-primary/40" : ""}`}>
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="mt-1 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing" aria-label="Drag to reorder">
          <GripVertical className="size-5" />
        </button>
        <div className="flex-1 space-y-2">
          <input value={field.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="Field name" maxLength={LIMITS.fieldName} className="glass-input w-full rounded-xl px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          <input value={field.value} onChange={(e) => onChange({ value: e.target.value })} placeholder="Field value (markdown ok)" maxLength={LIMITS.fieldValue} className="glass-input w-full rounded-xl px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
        <button onClick={onRemove} className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer" aria-label="Remove field">
          <Trash2 className="size-4" />
        </button>
      </div>
      <label className="mt-2 flex w-fit cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
        <input type="checkbox" checked={field.inline} onChange={(e) => onChange({ inline: e.target.checked })} className="size-3.5 accent-[var(--primary)]" />
        Inline
      </label>
    </div>
  );
}

// ── Discord preview ───────────────────────────────────────────────────────────
function DiscordWindow({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-black/40">
      <div className="flex items-center gap-2 bg-[#1e1f22] px-4 py-2.5">
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
        <span className="ml-2 font-mono text-xs text-white/40"># general</span>
      </div>
      <div className="bg-[#313338] p-4">{children}</div>
    </div>
  );
}

function MessagePreview({ msg }: { msg: Message }) {
  const empty = !msg.content && msg.embeds.every((e) => !e.title && !e.description && !e.author && !e.footer && e.fields.length === 0 && !e.image && !e.thumbnail);
  return (
    <div className="flex gap-3">
      {msg.avatarUrl ? (
        <img src={msg.avatarUrl} alt="" className="size-10 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#5865f2] font-bold text-white">{(msg.username || "G")[0].toUpperCase()}</div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{msg.username || "GuildLabs"}</span>
          <span className="rounded bg-[#5865f2] px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-white">Bot</span>
          <span className="text-xs text-white/40">today at 12:00 PM</span>
        </div>

        {msg.content && <div className="mt-1 whitespace-pre-wrap text-[0.95rem] leading-relaxed text-[#dbdee1]"><Markdown text={msg.content} /></div>}

        {empty && !msg.content ? (
          <div className="mt-1 rounded-md border-l-4 border-[#4f545c] bg-[#2b2d31] p-4 text-sm text-white/40">Your embed preview appears here.</div>
        ) : (
          <div className="mt-1 space-y-2">
            {msg.embeds.map((e) => (
              <EmbedCard key={e.id} e={e} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmbedCard({ e }: { e: Embed }) {
  const hasContent = e.title || e.description || e.author || e.footer || e.fields.length > 0 || e.image || e.thumbnail;
  if (!hasContent) return null;
  return (
    <div className="max-w-md overflow-hidden rounded-md bg-[#2b2d31]" style={{ borderLeft: `4px solid ${e.color}` }}>
      <div className="flex gap-3 p-3">
        <div className="min-w-0 flex-1">
          {e.author && (
            <div className="mb-1.5 flex items-center gap-1.5">
              {e.authorIcon && <img src={e.authorIcon} alt="" className="size-5 rounded-full object-cover" />}
              {e.authorUrl ? (
                <a href={e.authorUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-white hover:underline">{e.author}</a>
              ) : (
                <span className="text-sm font-semibold text-white">{e.author}</span>
              )}
            </div>
          )}
          {e.title &&
            (e.url ? (
              <a href={e.url} target="_blank" rel="noreferrer" className="text-base font-semibold text-[#00a8fc] hover:underline">{e.title}</a>
            ) : (
              <div className="text-base font-semibold text-white">{e.title}</div>
            ))}
          {e.description && <div className="mt-1 text-sm leading-relaxed text-[#dbdee1]"><Markdown text={e.description} /></div>}

          {e.fields.length > 0 && (
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {e.fields.filter((f) => f.name.trim() || f.value.trim()).map((f) => (
                <div key={f.id} className={f.inline ? "" : "sm:col-span-2"}>
                  <div className="text-xs font-bold text-white">{f.name || "​"}</div>
                  <div className="text-sm text-[#dbdee1]"><Markdown text={f.value || "​"} /></div>
                </div>
              ))}
            </div>
          )}

          {e.image && <img src={e.image} alt="" className="mt-3 max-h-56 rounded-md object-cover" />}
        </div>
        {e.thumbnail && <img src={e.thumbnail} alt="" className="size-16 shrink-0 rounded-md object-cover" />}
      </div>
      {(e.footer || e.timestamp) && (
        <div className="flex items-center gap-1.5 px-3 pb-3 text-xs text-white/50">
          {e.footerIcon && <img src={e.footerIcon} alt="" className="size-4 rounded-full object-cover" />}
          {e.footer}
          {e.footer && e.timestamp && <span className="px-0.5">•</span>}
          {e.timestamp && <span>Today at 12:00 PM</span>}
        </div>
      )}
    </div>
  );
}

// ── Minimal Discord-markdown renderer (builds React nodes — no innerHTML) ──────
function Markdown({ text }: { text: string }) {
  return <>{renderBlocks(text)}</>;
}

function renderBlocks(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let i = 0;
  let k = 0;
  while (i < lines.length) {
    const line = lines[i];
    // fenced code block
    if (/^```/.test(line)) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++; // closing fence
      out.push(<pre key={k++} className="my-1 overflow-x-auto rounded bg-[#1e1f22] p-2 font-mono text-xs text-[#dbdee1]">{buf.join("\n")}</pre>);
      continue;
    }
    // blockquote (consecutive)
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ""));
      out.push(
        <div key={k++} className="my-0.5 border-l-4 border-white/20 pl-2 text-[#dbdee1]">
          {buf.map((b, j) => <div key={j}>{renderInline(b)}</div>)}
        </div>
      );
      continue;
    }
    // list (consecutive - or *)
    if (/^[-*]\s+/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) buf.push(lines[i++].replace(/^[-*]\s+/, ""));
      out.push(
        <ul key={k++} className="my-0.5 ml-4 list-disc space-y-0.5">
          {buf.map((b, j) => <li key={j}>{renderInline(b)}</li>)}
        </ul>
      );
      continue;
    }
    // headers
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      const size = h[1].length === 1 ? "text-lg" : h[1].length === 2 ? "text-base" : "text-sm";
      out.push(<div key={k++} className={`mt-1 font-bold text-white ${size}`}>{renderInline(h[2])}</div>);
      i++;
      continue;
    }
    if (line === "") {
      out.push(<div key={k++} className="h-2" />);
      i++;
      continue;
    }
    out.push(<div key={k++}>{renderInline(line)}</div>);
    i++;
  }
  return out;
}

const INLINE_RULES: { re: RegExp; render: (m: RegExpExecArray, key: number) => React.ReactNode }[] = [
  { re: /`([^`]+?)`/, render: (m, key) => <code key={key} className="rounded bg-[#1e1f22] px-1 py-0.5 font-mono text-[0.85em] text-[#dbdee1]">{m[1]}</code> },
  { re: /\*\*([\s\S]+?)\*\*/, render: (m, key) => <strong key={key} className="font-bold text-white">{renderInline(m[1])}</strong> },
  { re: /__([\s\S]+?)__/, render: (m, key) => <span key={key} className="underline">{renderInline(m[1])}</span> },
  { re: /~~([\s\S]+?)~~/, render: (m, key) => <span key={key} className="line-through opacity-80">{renderInline(m[1])}</span> },
  { re: /\*([\s\S]+?)\*/, render: (m, key) => <em key={key} className="italic">{renderInline(m[1])}</em> },
  { re: /_([\s\S]+?)_/, render: (m, key) => <em key={key} className="italic">{renderInline(m[1])}</em> },
  { re: /\[([^\]]+?)\]\((https?:\/\/[^)\s]+)\)/, render: (m, key) => <a key={key} href={m[2]} target="_blank" rel="noreferrer" className="text-[#00a8fc] hover:underline">{m[1]}</a> },
  { re: /(https?:\/\/[^\s]+)/, render: (m, key) => <a key={key} href={m[1]} target="_blank" rel="noreferrer" className="text-[#00a8fc] hover:underline">{m[1]}</a> },
];

let inlineKey = 0;
function renderInline(text: string): React.ReactNode {
  if (!text) return null;
  let earliest: { idx: number; len: number; node: React.ReactNode; rest: string; before: string } | null = null;
  for (const rule of INLINE_RULES) {
    const m = rule.re.exec(text);
    if (m && (earliest === null || m.index < earliest.idx)) {
      earliest = { idx: m.index, len: m[0].length, node: rule.render(m, inlineKey++), before: text.slice(0, m.index), rest: text.slice(m.index + m[0].length) };
    }
  }
  if (!earliest) return text;
  return (
    <>
      {earliest.before}
      {earliest.node}
      {renderInline(earliest.rest)}
    </>
  );
}

// ── Import modal ──────────────────────────────────────────────────────────────
function ImportModal({ onClose, onImport }: { onClose: () => void; onImport: (m: Message) => void }) {
  const [raw, setRaw] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  function doImport() {
    try {
      const parsed = JSON.parse(raw);
      // Accept: full webhook payload {embeds}, a single embed, or an array of embeds.
      const embedsRaw: unknown[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.embeds)
          ? parsed.embeds
          : parsed?.title || parsed?.description || parsed?.fields
            ? [parsed]
            : [];
      if (!embedsRaw.length) throw new Error("No embeds found");
      const embeds: Embed[] = embedsRaw.slice(0, LIMITS.embeds).map((e) => {
        const obj = e as Record<string, unknown>;
        const author = (obj.author ?? {}) as Record<string, unknown>;
        const footer = (obj.footer ?? {}) as Record<string, unknown>;
        const image = (obj.image ?? {}) as Record<string, unknown>;
        const thumb = (obj.thumbnail ?? {}) as Record<string, unknown>;
        const colorInt = typeof obj.color === "number" ? obj.color : 0x5865f2;
        return {
          ...emptyEmbed(),
          title: String(obj.title ?? ""),
          url: String(obj.url ?? ""),
          description: String(obj.description ?? ""),
          color: `#${colorInt.toString(16).padStart(6, "0")}`,
          author: String(author.name ?? ""),
          authorUrl: String(author.url ?? ""),
          authorIcon: String(author.icon_url ?? ""),
          footer: String(footer.text ?? ""),
          footerIcon: String(footer.icon_url ?? ""),
          image: String(image.url ?? ""),
          thumbnail: String(thumb.url ?? ""),
          timestamp: Boolean(obj.timestamp),
          fields: (Array.isArray(obj.fields) ? obj.fields : []).slice(0, LIMITS.fields).map((f) => {
            const fo = f as Record<string, unknown>;
            return { id: uid(), name: String(fo.name ?? ""), value: String(fo.value ?? ""), inline: Boolean(fo.inline) };
          }),
        };
      });
      const content = !Array.isArray(parsed) && typeof parsed?.content === "string" ? parsed.content : "";
      const username = !Array.isArray(parsed) && typeof parsed?.username === "string" ? parsed.username : "GuildLabs";
      onImport({ content, username, avatarUrl: "", embeds });
    } catch {
      setError("That isn't valid embed JSON. Paste a Discord embed, an array of embeds, or a full webhook payload.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
      <div className="glass-strong relative w-full max-w-lg rounded-3xl p-6 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-muted/60 text-muted-foreground hover:text-foreground cursor-pointer" aria-label="Close">
          <X className="size-4" />
        </button>
        <h2 className="font-display text-2xl font-black">Import embed JSON</h2>
        <p className="mt-1 text-sm text-muted-foreground">Paste a Discord embed object, an array of embeds, or a full webhook payload.</p>
        <textarea value={raw} onChange={(e) => { setRaw(e.target.value); setError(null); }} rows={9} placeholder='{ "embeds": [ { "title": "…", "description": "…" } ] }' className="glass-input mt-4 w-full resize-y rounded-2xl px-3 py-3 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        {error && <p className="mt-2 rounded-xl bg-destructive/10 p-2.5 text-xs text-destructive">{error}</p>}
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="lg" onClick={onClose} className="flex-1">Cancel</Button>
          <Button size="lg" onClick={doImport} disabled={!raw.trim()} className="flex-1">Import</Button>
        </div>
      </div>
    </div>
  );
}

// ── Small UI primitives ───────────────────────────────────────────────────────
function Group({ title, hint, action, children }: { title: string; hint?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">{title}</h3>
          {hint && <p className="text-xs text-muted-foreground/70">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}
function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">{children}</label>;
}
function Counter({ n, max }: { n: number; max: number }) {
  const ratio = n / max;
  const tone = ratio > 1 ? "text-destructive" : ratio > 0.85 ? "text-amber-500" : "text-muted-foreground/60";
  return <span className={`font-mono text-[0.65rem] tabular-nums ${tone}`}>{n}/{max}</span>;
}
function TextInput({ label, value, onChange, placeholder, max }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; max?: number }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {max && <Counter n={value.length} max={max} />}
      </div>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="glass-input w-full rounded-xl px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
    </div>
  );
}
function TextArea({ label, value, onChange, placeholder, max, rows = 4 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; max?: number; rows?: number }) {
  return (
    <div className="mt-3 first:mt-0">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {max && <Counter n={value.length} max={max} />}
      </div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="glass-input w-full resize-y rounded-xl px-3 py-2.5 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring" />
    </div>
  );
}
function OutBtn({ icon: Icon, label, onClick, active }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-lg border border-card-border bg-card/40 px-2.5 py-1.5 text-xs font-semibold transition-colors hover:border-primary/40 hover:bg-primary/10 cursor-pointer">
      <Icon className={`size-3.5 ${active ? "text-success" : ""}`} /> {label}
    </button>
  );
}
function BudgetMeter({ total, max, over }: { total: number; max: number; over: boolean }) {
  const pct = Math.min(100, (total / max) * 100);
  const tone = over ? "var(--destructive)" : pct > 85 ? "#f59e0b" : "var(--primary)";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: tone }} />
      </div>
      <span className={`font-mono text-[0.65rem] tabular-nums ${over ? "text-destructive" : "text-muted-foreground"}`}>{total}/{max}</span>
    </div>
  );
}
