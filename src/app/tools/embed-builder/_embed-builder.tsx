"use client";

/**
 * Visual Discord embed builder. Edit fields on the left, see a pixel-faithful
 * Discord embed preview on the right, then copy the JSON (embed object or full
 * webhook payload) or send a live test to a webhook URL (client-side fetch, so
 * the webhook URL never touches our server).
 */

import * as React from "react";
import Link from "next/link";
import { Check, Copy, Plus, Send, Trash2, Loader2, Code2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Field = { id: string; name: string; value: string; inline: boolean };

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const DISCORD_BLURPLE = "#5865f2";

/** hex "#5865f2" → Discord decimal color int. */
function hexToInt(hex: string): number {
  const h = hex.replace("#", "");
  return parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16) || 0;
}

function trimUndef<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    out[k] = v;
  }
  return out as Partial<T>;
}

export function EmbedBuilder() {
  const [author, setAuthor] = React.useState("");
  const [authorIcon, setAuthorIcon] = React.useState("");
  const [title, setTitle] = React.useState("Welcome to the server!");
  const [url, setUrl] = React.useState("");
  const [description, setDescription] = React.useState(
    "This embed was designed with the GuildLabs embed builder. Edit anything on the left and watch it update here."
  );
  const [color, setColor] = React.useState(DISCORD_BLURPLE);
  const [fields, setFields] = React.useState<Field[]>([
    { id: uid(), name: "Rules", value: "Be kind. No spam.", inline: true },
    { id: uid(), name: "Roles", value: "Pick yours in #roles", inline: true },
  ]);
  const [image, setImage] = React.useState("");
  const [thumbnail, setThumbnail] = React.useState("");
  const [footer, setFooter] = React.useState("GuildLabs");
  const [footerIcon, setFooterIcon] = React.useState("");
  const [withTimestamp, setWithTimestamp] = React.useState(true);
  const [username, setUsername] = React.useState("");

  const [showJson, setShowJson] = React.useState(false);
  const [copied, setCopied] = React.useState<"embed" | "payload" | null>(null);
  const [webhook, setWebhook] = React.useState("");
  const [sending, setSending] = React.useState(false);

  // Build the embed object Discord expects.
  const embed = React.useMemo(() => {
    return trimUndef({
      author: author ? trimUndef({ name: author, icon_url: authorIcon }) : undefined,
      title: title || undefined,
      url: url || undefined,
      description: description || undefined,
      color: hexToInt(color),
      fields: fields
        .filter((f) => f.name.trim() || f.value.trim())
        .map((f) => trimUndef({ name: f.name || "​", value: f.value || "​", inline: f.inline })),
      image: image ? { url: image } : undefined,
      thumbnail: thumbnail ? { url: thumbnail } : undefined,
      footer: footer ? trimUndef({ text: footer, icon_url: footerIcon }) : undefined,
      timestamp: withTimestamp ? "2024-01-01T00:00:00.000Z" : undefined,
    });
  }, [author, authorIcon, title, url, description, color, fields, image, thumbnail, footer, footerIcon, withTimestamp]);

  const payload = React.useMemo(
    () => trimUndef({ username: username || undefined, embeds: [embed] }),
    [username, embed]
  );

  async function copy(which: "embed" | "payload") {
    const text = JSON.stringify(which === "embed" ? embed : payload, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      toast.success("Copied JSON");
      setTimeout(() => setCopied(null), 1600);
    } catch {
      toast.error("Couldn't copy — select the JSON manually.");
    }
  }

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
        body: JSON.stringify({ ...payload, timestamp: undefined }),
      });
      if (res.ok || res.status === 204) {
        toast.success("Sent! Check your channel.");
      } else {
        toast.error(`Discord rejected it (${res.status}). Check the webhook URL.`);
      }
    } catch {
      toast.error("Couldn't reach the webhook from the browser. Copy the JSON instead.");
    } finally {
      setSending(false);
    }
  }

  function addField() {
    if (fields.length >= 25) return;
    setFields((f) => [...f, { id: uid(), name: "", value: "", inline: false }]);
  }
  function updateField(id: string, patch: Partial<Field>) {
    setFields((f) => f.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }
  function removeField(id: string) {
    setFields((f) => f.filter((x) => x.id !== id));
  }

  return (
    <main className="relative min-h-screen px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link href="/tools" className="text-sm text-muted-foreground hover:text-foreground">
            Tools
          </Link>
          <h1 className="mt-2 font-display text-4xl font-black tracking-tight sm:text-5xl">
            Discord Embed Builder
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            Design a rich embed visually, then copy the JSON or fire a live test to your webhook.
            Everything stays in your browser.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr,1fr]">
          {/* ── Editor ──────────────────────────────────────────────────── */}
          <div className="space-y-5">
            <Group title="Content">
              <Row>
                <TextInput label="Title" value={title} onChange={setTitle} placeholder="Embed title" />
                <TextInput label="Title URL" value={url} onChange={setUrl} placeholder="https://…" />
              </Row>
              <TextArea label="Description" value={description} onChange={setDescription} placeholder="Supports **markdown**, links, and line breaks." />
              <Row>
                <div>
                  <Label>Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-10 w-12 cursor-pointer rounded-lg border border-card-border bg-transparent"
                      aria-label="Embed color"
                    />
                    <input
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="glass-input w-28 rounded-xl px-3 py-2 font-mono text-sm uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Hex color"
                    />
                  </div>
                </div>
                <TextInput label="Webhook username (optional)" value={username} onChange={setUsername} placeholder="GuildLabs" />
              </Row>
            </Group>

            <Group title="Author & footer">
              <Row>
                <TextInput label="Author" value={author} onChange={setAuthor} placeholder="Author name" />
                <TextInput label="Author icon URL" value={authorIcon} onChange={setAuthorIcon} placeholder="https://…/icon.png" />
              </Row>
              <Row>
                <TextInput label="Footer" value={footer} onChange={setFooter} placeholder="Footer text" />
                <TextInput label="Footer icon URL" value={footerIcon} onChange={setFooterIcon} placeholder="https://…/icon.png" />
              </Row>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={withTimestamp} onChange={(e) => setWithTimestamp(e.target.checked)} className="size-4 accent-[var(--primary)]" />
                Show timestamp
              </label>
            </Group>

            <Group title="Media">
              <Row>
                <TextInput label="Image URL" value={image} onChange={setImage} placeholder="https://…/image.png" />
                <TextInput label="Thumbnail URL" value={thumbnail} onChange={setThumbnail} placeholder="https://…/thumb.png" />
              </Row>
            </Group>

            <Group
              title={`Fields (${fields.length}/25)`}
              action={
                <button onClick={addField} disabled={fields.length >= 25} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline disabled:opacity-40 cursor-pointer">
                  <Plus className="size-4" /> Add field
                </button>
              }
            >
              <div className="space-y-3">
                {fields.map((f) => (
                  <div key={f.id} className="rounded-2xl border border-card-border bg-muted/30 p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <input value={f.name} onChange={(e) => updateField(f.id, { name: e.target.value })} placeholder="Field name" className="glass-input w-full rounded-xl px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                        <input value={f.value} onChange={(e) => updateField(f.id, { value: e.target.value })} placeholder="Field value" className="glass-input w-full rounded-xl px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                      </div>
                      <button onClick={() => removeField(f.id)} className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer" aria-label="Remove field">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <label className="mt-2 flex w-fit cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                      <input type="checkbox" checked={f.inline} onChange={(e) => updateField(f.id, { inline: e.target.checked })} className="size-3.5 accent-[var(--primary)]" />
                      Inline
                    </label>
                  </div>
                ))}
                {fields.length === 0 && <p className="text-sm text-muted-foreground">No fields yet.</p>}
              </div>
            </Group>
          </div>

          {/* ── Preview + output ────────────────────────────────────────── */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Label>Live preview</Label>
            <div className="rounded-2xl bg-[#313338] p-4">
              <DiscordEmbedPreview
                embed={embed}
                color={color}
                fields={fields.filter((f) => f.name.trim() || f.value.trim())}
                title={title}
                url={url}
                description={description}
                author={author}
                authorIcon={authorIcon}
                image={image}
                thumbnail={thumbnail}
                footer={footer}
                footerIcon={footerIcon}
                withTimestamp={withTimestamp}
                username={username}
              />
            </div>

            {/* Webhook send */}
            <div className="mt-5 glass rounded-2xl p-4">
              <Label>Send a live test</Label>
              <div className="flex gap-2">
                <input
                  value={webhook}
                  onChange={(e) => setWebhook(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/…"
                  className="glass-input min-w-0 flex-1 rounded-xl px-3 py-2.5 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button onClick={sendTest} disabled={sending} size="default">
                  {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  Send
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Posts directly from your browser to Discord — the URL never reaches our servers.
              </p>
            </div>

            {/* JSON output */}
            <div className="mt-5 glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <button onClick={() => setShowJson((s) => !s)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary cursor-pointer">
                  <Code2 className="size-4" /> {showJson ? "Hide" : "Show"} JSON
                </button>
                <div className="flex gap-2">
                  <CopyBtn active={copied === "embed"} onClick={() => copy("embed")} label="Embed" />
                  <CopyBtn active={copied === "payload"} onClick={() => copy("payload")} label="Webhook payload" />
                </div>
              </div>
              {showJson && (
                <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-[#1e1f22] p-3 font-mono text-xs leading-relaxed text-white/80">
                  {JSON.stringify(payload, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ── Discord-faithful preview ──────────────────────────────────────────────────

function DiscordEmbedPreview(props: {
  embed: unknown;
  color: string;
  fields: Field[];
  title: string;
  url: string;
  description: string;
  author: string;
  authorIcon: string;
  image: string;
  thumbnail: string;
  footer: string;
  footerIcon: string;
  withTimestamp: boolean;
  username: string;
}) {
  const { color, fields, title, url, description, author, authorIcon, image, thumbnail, footer, footerIcon, withTimestamp, username } = props;
  const empty = !title && !description && !author && !footer && fields.length === 0 && !image && !thumbnail;

  return (
    <div className="flex gap-3">
      <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#5865f2] font-bold text-white">
        {(username || "G")[0].toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{username || "GuildLabs"}</span>
          <span className="rounded bg-[#5865f2] px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-white">Bot</span>
          <span className="text-xs text-white/40">today</span>
        </div>

        {empty ? (
          <div className="mt-1 rounded-md border-l-4 border-[#4f545c] bg-[#2b2d31] p-4 text-sm text-white/40">
            Your embed preview will appear here.
          </div>
        ) : (
          <div className="mt-1 max-w-md overflow-hidden rounded-md bg-[#2b2d31]" style={{ borderLeft: `4px solid ${color}` }}>
            <div className="flex gap-3 p-3">
              <div className="min-w-0 flex-1">
                {author && (
                  <div className="mb-1.5 flex items-center gap-1.5">
                    {authorIcon && <img src={authorIcon} alt="" className="size-5 rounded-full object-cover" />}
                    <span className="text-sm font-semibold text-white">{author}</span>
                  </div>
                )}
                {title &&
                  (url ? (
                    <a href={url} target="_blank" rel="noreferrer" className="text-base font-semibold text-[#00a8fc] hover:underline">
                      {title}
                    </a>
                  ) : (
                    <div className="text-base font-semibold text-white">{title}</div>
                  ))}
                {description && <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#dbdee1]">{description}</div>}

                {fields.length > 0 && (
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {fields.map((f) => (
                      <div key={f.id} className={f.inline ? "" : "sm:col-span-2"}>
                        <div className="text-xs font-bold text-white">{f.name || "​"}</div>
                        <div className="whitespace-pre-wrap text-sm text-[#dbdee1]">{f.value || "​"}</div>
                      </div>
                    ))}
                  </div>
                )}

                {image && <img src={image} alt="" className="mt-3 max-h-56 rounded-md object-cover" />}
              </div>
              {thumbnail && <img src={thumbnail} alt="" className="size-16 shrink-0 rounded-md object-cover" />}
            </div>

            {(footer || withTimestamp) && (
              <div className="flex items-center gap-1.5 px-3 pb-3 text-xs text-white/50">
                {footerIcon && <img src={footerIcon} alt="" className="size-4 rounded-full object-cover" />}
                {footer}
                {footer && withTimestamp && <span className="px-0.5">•</span>}
                {withTimestamp && <span>Today at 12:00 PM</span>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Small inputs ──────────────────────────────────────────────────────────────

function Group({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">{title}</h3>
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

function TextInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="glass-input w-full rounded-xl px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="mt-3">
      <Label>{label}</Label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={4} className="glass-input w-full resize-y rounded-xl px-3 py-2.5 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring" />
    </div>
  );
}

function CopyBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1 rounded-lg border border-card-border bg-muted/40 px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 cursor-pointer">
      {active ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      {label}
    </button>
  );
}
