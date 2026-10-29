"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
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
import {
  GripVertical,
  Hash,
  Volume2,
  Radio,
  MessageSquare,
  Plus,
  Trash2,
  ShieldCheck, SlidersHorizontal } from "lucide-react";
import {
  PERM_PRESETS,
  PERM_PRESET_LABELS,
  PERM_PRESET_ORDER,
  ROLE_PALETTE,
  type Blueprint,
  type Channel,
  type PermPreset,
  DEFAULT_CHANNEL_EMOJI,
  MAX_USER_LIMIT,
} from "@/lib/blueprint";
import { CHANNEL_TYPES } from "@/lib/construct-ai";
import { EmojiButton } from "@/components/ui/emoji-picker";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ── Internal editable model (Blueprint has no ids; we add stable ones) ────────
type EChannel = {
  id: string;
  name: string;
  type: Channel["type"];
  emoji: string;
  topic: string;
  slowmode: number;
  nsfw: boolean;
  userLimit: number;
};
type ECategory = { id: string; name: string; emoji: string; channels: EChannel[] };
type ERole = { id: string; name: string; color: string; hoist: boolean; perms: PermPreset };
type EditModel = { categories: ECategory[]; roles: ERole[] };

let _seq = 0;
const uid = (p: string) => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${p}:${crypto.randomUUID()}`;
  return `${p}:${Date.now()}-${_seq++}`;
};

const PERM_BY_STRING: Record<string, PermPreset> = Object.fromEntries(
  (Object.keys(PERM_PRESETS) as PermPreset[]).map((k) => [PERM_PRESETS[k], k])
);

function toModel(bp: Blueprint): EditModel {
  return {
    categories: bp.categories.map((c) => ({
      id: uid("cat"),
      name: c.name,
      emoji: c.emoji,
      channels: c.channels.map((ch) => ({
        id: uid("chn"),
        name: ch.name,
        type: ch.type,
        emoji: ch.emoji ?? "",
        topic: ch.topic ?? "",
        slowmode: ch.slowmode ?? 0,
        nsfw: ch.nsfw ?? false,
        userLimit: ch.userLimit ?? 0,
      })),
    })),
    roles: bp.roles.map((r) => ({
      id: uid("rol"),
      name: r.name,
      color: r.color,
      hoist: r.hoist,
      perms: PERM_BY_STRING[r.perms] ?? "member",
    })),
  };
}

function serialize(name: string, model: EditModel, base: Blueprint): Blueprint {
  const categories = model.categories.map((c) => ({
    name: c.name.trim() || "GENERAL",
    emoji: c.emoji || "📁",
    // Mirror the validator: only emit options the channel kind supports, and
    // drop zero values so the deploy payload stays clean.
    channels: c.channels.map((ch) => {
      const isVoice = ch.type === "voice" || ch.type === "stage";
      return {
        name: ch.name.trim() || "channel",
        type: ch.type,
        ...(ch.emoji ? { emoji: ch.emoji } : {}),
        ...(!isVoice && ch.topic.trim() ? { topic: ch.topic.trim() } : {}),
        ...(!isVoice && ch.slowmode > 0 ? { slowmode: ch.slowmode } : {}),
        ...(!isVoice && ch.nsfw ? { nsfw: true } : {}),
        ...(isVoice && ch.userLimit > 0 ? { userLimit: ch.userLimit } : {}),
      };
    }),
  }));
  const roles = model.roles.map((r) => ({
    name: r.name.trim() || "Role",
    color: r.color,
    hoist: r.hoist,
    perms: PERM_PRESETS[r.perms],
  }));
  const allChannels = categories.flatMap((c) => c.channels);
  return {
    ...base,
    name: name.trim() || "My Server",
    categories,
    roles,
    stats: {
      categories: categories.length,
      channels: allChannels.length,
      voice: allChannels.filter((c) => c.type === "voice" || c.type === "stage").length,
      roles: roles.length,
    },
  };
}

const channelIcon = (t: string) =>
  t === "voice" ? Volume2 : t === "stage" ? Radio : t === "forum" ? MessageSquare : Hash;

/** Stable component (declared outside render) for a channel's type glyph. */
function ChannelTypeIcon({ type, className }: { type: string; className?: string }) {
  return React.createElement(channelIcon(type), { className });
}

// ── Editor ────────────────────────────────────────────────────────────────────
export function BlueprintEditor({
  blueprint,
  onChange,
}: {
  blueprint: Blueprint;
  /** Fires the edited blueprint upward (for deploy + live viz). */
  onChange: (bp: Blueprint) => void;
}) {
  // Uncontrolled-after-mount: the editor owns the model so drag ids stay stable.
  const baseRef = React.useRef(blueprint);
  const [name, setName] = React.useState(blueprint.name);
  const [model, setModel] = React.useState<EditModel>(() => toModel(blueprint));
  const [activeId, setActiveId] = React.useState<string | null>(null);

  // Push every change upward.
  const commit = React.useCallback(
    (nextName: string, next: EditModel) => {
      setModel(next);
      setName(nextName);
      onChange(serialize(nextName, next, baseRef.current));
    },
    [onChange]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const containerOf = (id: string): string | null => {
    if (model.categories.some((c) => c.id === id)) return id; // dropped on the category itself
    const cat = model.categories.find((c) => c.channels.some((ch) => ch.id === id));
    return cat?.id ?? null;
  };

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  // Move channels between categories live as you hover.
  function onDragOver(e: DragOverEvent) {
    const activeIdStr = String(e.active.id);
    if (!activeIdStr.startsWith("chn:")) return;
    const overId = e.over ? String(e.over.id) : null;
    if (!overId) return;

    const from = containerOf(activeIdStr);
    const to = containerOf(overId);
    if (!from || !to || from === to) return;

    setModel((m) => {
      const fromCat = m.categories.find((c) => c.id === from)!;
      const toCat = m.categories.find((c) => c.id === to)!;
      const moving = fromCat.channels.find((ch) => ch.id === activeIdStr);
      if (!moving) return m;

      const overIndex = toCat.channels.findIndex((ch) => ch.id === overId);
      const insertAt = overIndex >= 0 ? overIndex : toCat.channels.length;

      return {
        ...m,
        categories: m.categories.map((c) => {
          if (c.id === from) return { ...c, channels: c.channels.filter((ch) => ch.id !== activeIdStr) };
          if (c.id === to) {
            const next = [...c.channels];
            next.splice(insertAt, 0, moving);
            return { ...c, channels: next };
          }
          return c;
        }),
      };
    });
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const a = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId || a === overId) {
      // still commit in case onDragOver moved things across containers
      commit(name, model);
      return;
    }

    if (a.startsWith("cat:")) {
      const oldI = model.categories.findIndex((c) => c.id === a);
      const newI = model.categories.findIndex((c) => c.id === overId);
      if (oldI >= 0 && newI >= 0) commit(name, { ...model, categories: arrayMove(model.categories, oldI, newI) });
      return;
    }

    if (a.startsWith("rol:")) {
      const oldI = model.roles.findIndex((r) => r.id === a);
      const newI = model.roles.findIndex((r) => r.id === overId);
      if (oldI >= 0 && newI >= 0) commit(name, { ...model, roles: arrayMove(model.roles, oldI, newI) });
      return;
    }

    if (a.startsWith("chn:")) {
      const cat = containerOf(a);
      if (!cat) return commit(name, model);
      const c = model.categories.find((x) => x.id === cat)!;
      const oldI = c.channels.findIndex((ch) => ch.id === a);
      const newI = c.channels.findIndex((ch) => ch.id === overId);
      if (oldI >= 0 && newI >= 0 && oldI !== newI) {
        commit(name, {
          ...model,
          categories: model.categories.map((x) =>
            x.id === cat ? { ...x, channels: arrayMove(x.channels, oldI, newI) } : x
          ),
        });
      } else {
        commit(name, model);
      }
    }
  }

  // ── mutations ──
  const editChannel = (catId: string, chId: string, patch: Partial<EChannel>) =>
    commit(name, {
      ...model,
      categories: model.categories.map((c) =>
        c.id === catId
          ? { ...c, channels: c.channels.map((ch) => (ch.id === chId ? { ...ch, ...patch } : ch)) }
          : c
      ),
    });

  const removeChannel = (catId: string, chId: string) =>
    commit(name, {
      ...model,
      categories: model.categories.map((c) =>
        c.id === catId ? { ...c, channels: c.channels.filter((ch) => ch.id !== chId) } : c
      ),
    });

  const addChannel = (catId: string) =>
    commit(name, {
      ...model,
      categories: model.categories.map((c) =>
        c.id === catId
          ? { ...c, channels: [...c.channels, {
                id: uid("chn"),
                name: "new-channel",
                type: "text" as const,
                emoji: DEFAULT_CHANNEL_EMOJI.text,
                topic: "",
                slowmode: 0,
                nsfw: false,
                userLimit: 0,
              }] }
          : c
      ),
    });

  const editCategory = (catId: string, patch: Partial<ECategory>) =>
    commit(name, {
      ...model,
      categories: model.categories.map((c) => (c.id === catId ? { ...c, ...patch } : c)),
    });

  const removeCategory = (catId: string) =>
    commit(name, { ...model, categories: model.categories.filter((c) => c.id !== catId) });

  const addCategory = () =>
    commit(name, {
      ...model,
      categories: [...model.categories, { id: uid("cat"), name: "NEW", emoji: "📁", channels: [] }],
    });

  const editRole = (roleId: string, patch: Partial<ERole>) =>
    commit(name, { ...model, roles: model.roles.map((r) => (r.id === roleId ? { ...r, ...patch } : r)) });

  const removeRole = (roleId: string) =>
    commit(name, { ...model, roles: model.roles.filter((r) => r.id !== roleId) });

  const addRole = () =>
    commit(name, {
      ...model,
      roles: [
        ...model.roles,
        {
          id: uid("rol"),
          name: "New role",
          color: ROLE_PALETTE[model.roles.length % ROLE_PALETTE.length],
          hoist: false,
          perms: "member" as PermPreset,
        },
      ],
    });

  const activeChannel = activeId?.startsWith("chn:")
    ? model.categories.flatMap((c) => c.channels).find((ch) => ch.id === activeId)
    : null;

  return (
    <div className="space-y-6">
      {/* server name */}
      <div>
        <label htmlFor="bp-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Server name
        </label>
        <input
          id="bp-name"
          value={name}
          onChange={(e) => commit(e.target.value, model)}
          className="glass-input w-full rounded-2xl px-4 py-3 font-display text-lg tracking-wide outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        {/* categories + channels */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Categories &amp; channels
            </h4>
            <button onClick={addCategory} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline cursor-pointer">
              <Plus className="size-4" /> Category
            </button>
          </div>
          <SortableContext items={model.categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {model.categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  cat={cat}
                  onEditCategory={(p) => editCategory(cat.id, p)}
                  onRemoveCategory={() => removeCategory(cat.id)}
                  onAddChannel={() => addChannel(cat.id)}
                  onEditChannel={(chId, p) => editChannel(cat.id, chId, p)}
                  onRemoveChannel={(chId) => removeChannel(cat.id, chId)}
                />
              ))}
            </div>
          </SortableContext>
        </div>

        {/* roles */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Roles
            </h4>
            <button onClick={addRole} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline cursor-pointer">
              <Plus className="size-4" /> Role
            </button>
          </div>
          <SortableContext items={model.roles.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {model.roles.map((role) => (
                <RoleRow
                  key={role.id}
                  role={role}
                  onEdit={(p) => editRole(role.id, p)}
                  onRemove={() => removeRole(role.id)}
                />
              ))}
            </div>
          </SortableContext>
        </div>

        <DragOverlay>
          {activeChannel ? (
            <div className="glass flex items-center gap-2 rounded-xl px-3 py-2 text-sm shadow-lg">
              <ChannelTypeIcon type={activeChannel.type} className="size-3.5 text-muted-foreground" />
              {activeChannel.name}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// ── Category card ──────────────────────────────────────────────────────────────
function CategoryCard({
  cat,
  onEditCategory,
  onRemoveCategory,
  onAddChannel,
  onEditChannel,
  onRemoveChannel,
}: {
  cat: ECategory;
  onEditCategory: (p: Partial<ECategory>) => void;
  onRemoveCategory: () => void;
  onAddChannel: () => void;
  onEditChannel: (chId: string, p: Partial<EChannel>) => void;
  onRemoveChannel: (chId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });
  const style = { transform: CSS.Translate.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("glass rounded-2xl p-3", isDragging && "opacity-50 ring-2 ring-primary/40")}
    >
      <div className="flex items-center gap-2">
        <Tooltip content="Drag to reorder" side="left">
          <button
            {...attributes}
            {...listeners}
            aria-label={`Reorder category ${cat.name}`}
            className="grid size-7 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
          >
            <GripVertical className="size-4" />
          </button>
        </Tooltip>
        <input
          value={cat.emoji}
          onChange={(e) => onEditCategory({ emoji: e.target.value.slice(0, 4) })}
          aria-label={`Emoji for ${cat.name}`}
          className="glass-input w-11 rounded-lg px-2 py-1.5 text-center text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <input
          value={cat.name}
          onChange={(e) => onEditCategory({ name: e.target.value })}
          aria-label="Category name"
          className="glass-input min-w-0 flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold uppercase tracking-wider outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          onClick={onRemoveCategory}
          aria-label={`Remove category ${cat.name}`}
          className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <SortableContext items={cat.channels.map((ch) => ch.id)} strategy={verticalListSortingStrategy}>
        <ul className="mt-2 space-y-1.5 pl-2">
          {cat.channels.map((ch) => (
            <ChannelRow key={ch.id} ch={ch} onEdit={(p) => onEditChannel(ch.id, p)} onRemove={() => onRemoveChannel(ch.id)} />
          ))}
          {cat.channels.length === 0 && (
            <li className="rounded-lg border border-dashed border-card-border px-3 py-2 text-xs text-muted-foreground">
              Drag a channel here, or add one.
            </li>
          )}
        </ul>
      </SortableContext>

      <button
        onClick={onAddChannel}
        className="mt-2 ml-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary cursor-pointer"
      >
        <Plus className="size-3.5" /> Add channel
      </button>
    </div>
  );
}

// ── Channel row ────────────────────────────────────────────────────────────────
function ChannelRow({
  ch,
  onEdit,
  onRemove,
}: {
  ch: EChannel;
  onEdit: (p: Partial<EChannel>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ch.id });
  const style = { transform: CSS.Translate.toString(transform), transition };
  const [open, setOpen] = React.useState(false);
  const isVoice = ch.type === "voice" || ch.type === "stage";
  // Count only the options that apply to this channel kind, so a voice channel
  // never advertises a slowmode it can't have.
  const activeCount =
    (isVoice ? 0 : (ch.topic.trim() ? 1 : 0) + (ch.slowmode > 0 ? 1 : 0) + (ch.nsfw ? 1 : 0)) +
    (isVoice && ch.userLimit > 0 ? 1 : 0);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg bg-muted/40 px-1.5 py-1",
        isDragging && "opacity-40"
      )}
    >
     <div className="flex items-center gap-1.5">
      <Tooltip content="Drag to reorder or move" side="left">
        <button
          {...attributes}
          {...listeners}
          aria-label={`Reorder channel ${ch.name}`}
          className="grid size-6 shrink-0 cursor-grab touch-none place-items-center rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
        >
          <GripVertical className="size-3.5" />
        </button>
      </Tooltip>
      <ChannelTypeIcon type={ch.type} className="size-3.5 shrink-0 text-muted-foreground" />
      <EmojiButton
        value={ch.emoji}
        onChange={(emoji) => onEdit({ emoji })}
        label={`Emoji for ${ch.name}`}
      />
      <input
        value={ch.name}
        onChange={(e) => onEdit({ name: e.target.value })}
        aria-label="Channel name"
        className="min-w-0 flex-1 rounded bg-transparent px-1 py-0.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <label className="sr-only" htmlFor={`type-${ch.id}`}>
        Channel type for {ch.name}
      </label>
      <select
        id={`type-${ch.id}`}
        value={ch.type}
        onChange={(e) => onEdit({ type: e.target.value as Channel["type"] })}
        className="glass-input shrink-0 rounded-md px-1.5 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
      >
        {CHANNEL_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <Tooltip content="Channel options" side="top">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={`Options for ${ch.name}`}
          aria-expanded={open}
          className={cn(
            "relative grid size-6 shrink-0 place-items-center rounded text-muted-foreground hover:bg-primary/15 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
            open && "bg-primary/15 text-primary"
          )}
        >
          <SlidersHorizontal className="size-3.5" />
          {activeCount > 0 && !open && (
            <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-primary" />
          )}
        </button>
      </Tooltip>
      <button
        onClick={onRemove}
        aria-label={`Remove channel ${ch.name}`}
        className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground hover:bg-destructive/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
      >
        <Trash2 className="size-3.5" />
      </button>
     </div>

      {open && (
        <div className="mt-1.5 space-y-2 rounded-lg border border-card-border bg-background/60 p-2.5">
          {isVoice ? (
            <label className="flex items-center justify-between gap-3 text-xs">
              <span className="text-muted-foreground">User limit</span>
              <span className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={MAX_USER_LIMIT}
                  value={ch.userLimit}
                  onChange={(e) =>
                    onEdit({ userLimit: Math.max(0, Math.min(MAX_USER_LIMIT, Number(e.target.value) || 0)) })
                  }
                  className="w-16 rounded border border-card-border bg-background px-1.5 py-1 text-right tabular-nums outline-none focus:border-primary/60"
                />
                <span className="w-12 text-muted-foreground">
                  {ch.userLimit === 0 ? "∞" : "users"}
                </span>
              </span>
            </label>
          ) : (
            <>
              <label className="block text-xs">
                <span className="text-muted-foreground">Topic</span>
                <input
                  value={ch.topic}
                  onChange={(e) => onEdit({ topic: e.target.value.slice(0, 140) })}
                  placeholder="What is this channel for?"
                  className="mt-1 w-full rounded border border-card-border bg-background px-2 py-1 outline-none focus:border-primary/60"
                />
              </label>
              <label className="flex items-center justify-between gap-3 text-xs">
                <span className="text-muted-foreground">Slowmode</span>
                <select
                  value={ch.slowmode}
                  onChange={(e) => onEdit({ slowmode: Number(e.target.value) })}
                  className="rounded border border-card-border bg-background px-1.5 py-1 outline-none focus:border-primary/60 cursor-pointer"
                >
                  {SLOWMODE_STEPS.map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3 text-xs">
                <span className="text-muted-foreground">Age-restricted (NSFW)</span>
                <input
                  type="checkbox"
                  checked={ch.nsfw}
                  onChange={(e) => onEdit({ nsfw: e.target.checked })}
                  className="size-4 cursor-pointer accent-[var(--primary)]"
                />
              </label>
            </>
          )}
        </div>
      )}
    </li>
  );
}

/** Discord only accepts these exact slowmode values in its own UI. */
const SLOWMODE_STEPS: [number, string][] = [
  [0, "Off"], [5, "5s"], [10, "10s"], [15, "15s"], [30, "30s"],
  [60, "1m"], [120, "2m"], [300, "5m"], [600, "10m"], [900, "15m"],
  [1800, "30m"], [3600, "1h"], [7200, "2h"], [21600, "6h"],
];

// ── Role row ───────────────────────────────────────────────────────────────────
function RoleRow({
  role,
  onEdit,
  onRemove,
}: {
  role: ERole;
  onEdit: (p: Partial<ERole>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: role.id });
  const style = { transform: CSS.Translate.toString(transform), transition };
  const label = role.name.trim() || "Untitled role";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("glass rounded-2xl p-3", isDragging && "opacity-50 ring-2 ring-primary/40")}
    >
      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
        <Tooltip content="Drag to reorder" side="left">
          <button
            {...attributes}
            {...listeners}
            aria-label={`Reorder role ${label}`}
            className="grid size-7 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
          >
            <GripVertical className="size-4" />
          </button>
        </Tooltip>
        <label className="relative shrink-0 cursor-pointer" aria-label={`Color for ${label}`}>
          <span
            className="block size-9 rounded-xl ring-1 ring-white/15"
            style={{ background: role.color, boxShadow: `0 0 12px ${role.color}66` }}
          />
          <input
            type="color"
            value={role.color}
            onChange={(e) => onEdit({ color: e.target.value })}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
            aria-label={`Pick a color for ${label}`}
          />
        </label>
        <input
          value={role.name}
          onChange={(e) => onEdit({ name: e.target.value })}
          aria-label="Role name"
          placeholder="Role name…"
          className="glass-input min-w-0 flex-1 rounded-xl px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <div
          className="flex flex-wrap gap-1 rounded-xl bg-muted/40 p-1"
          role="radiogroup"
          aria-label={`Permission level for ${label}`}
        >
          {PERM_PRESET_ORDER.map((preset) => {
            const active = role.perms === preset;
            return (
              <button
                key={preset}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onEdit({ perms: preset })}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {PERM_PRESET_LABELS[preset]}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={role.hoist}
          aria-label={`Display ${label} separately in the member list`}
          onClick={() => onEdit({ hoist: !role.hoist })}
          className={cn(
            "flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            role.hoist ? "bg-secondary/15 text-foreground" : "bg-muted/40 text-muted-foreground"
          )}
        >
          <span className={cn("relative h-4 w-7 shrink-0 rounded-full p-0.5 transition-colors", role.hoist ? "bg-primary" : "bg-muted")}>
            <span className={cn("block size-3 rounded-full bg-white shadow transition-all", role.hoist ? "ml-auto" : "ml-0")} />
          </span>
          Hoist
        </button>
        <span className="ml-auto inline-flex items-center gap-1 truncate text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-secondary" />
          {PERM_PRESETS[role.perms]}
        </span>
      </div>
    </div>
  );
}
