import {
  Gamepad2,
  GraduationCap,
  Globe2,
  Coins,
  Music,
  Cpu,
  Palette,
  Lock,
  Scale,
  Leaf,
  TrendingUp,
  Volume2,
  CalendarDays,
  Banknote,
  LifeBuoy,
  UserCog,
  Crown,
  Briefcase,
  ShieldCheck,
  Bot,
  Sparkles,
  HandHeart,
  DoorOpen,
  type LucideIcon,
} from "lucide-react";

export type Option = {
  id: string;
  label: string;
  desc: string;
  icon: LucideIcon;
};

/* STEP 1 — server types (multi) */
export const SERVER_TYPES: Option[] = [
  { id: "gaming", label: "Gaming", desc: "Clips, LFG, squads", icon: Gamepad2 },
  { id: "school", label: "School", desc: "Study + classes", icon: GraduationCap },
  { id: "community", label: "Community", desc: "Hang out & chat", icon: Globe2 },
  { id: "crypto", label: "Crypto", desc: "Markets & alpha", icon: Coins },
  { id: "music", label: "Music", desc: "Listening & jams", icon: Music },
  { id: "tech", label: "Tech", desc: "Dev & support", icon: Cpu },
  { id: "creative", label: "Creative", desc: "Art & showcase", icon: Palette },
];

/* STEP 2 — moderation (single) */
export const MODERATION: Option[] = [
  { id: "strict", label: "Strict", desc: "Verified users only", icon: Lock },
  { id: "balanced", label: "Balanced", desc: "Sensible guardrails", icon: Scale },
  { id: "casual", label: "Casual", desc: "Open & relaxed", icon: Leaf },
];

/* STEP 2 — features (multi) */
export const FEATURES: Option[] = [
  { id: "leveling", label: "Leveling", desc: "XP & ranks", icon: TrendingUp },
  { id: "voice", label: "Voice channels", desc: "Talk live", icon: Volume2 },
  { id: "events", label: "Events", desc: "Scheduled hangs", icon: CalendarDays },
  { id: "economy", label: "Economy", desc: "Currency & shop", icon: Banknote },
  { id: "tickets", label: "Ticket support", desc: "Private help", icon: LifeBuoy },
  { id: "selfroles", label: "Self-roles", desc: "Pick your tags", icon: UserCog },
];

/* STEP 3 — channel groups (multi toggle) */
export const CHANNEL_GROUPS: Option[] = [
  { id: "INFO", label: "Info", desc: "Rules, announce", icon: Globe2 },
  { id: "CHAT", label: "Chat", desc: "Text channels", icon: Sparkles },
  { id: "VOICE", label: "Voice", desc: "Voice lounges", icon: Volume2 },
  { id: "EVENTS", label: "Events", desc: "Event hub", icon: CalendarDays },
  { id: "SUPPORT", label: "Support", desc: "Help & tickets", icon: LifeBuoy },
  { id: "FUN", label: "Fun", desc: "Memes & games", icon: Gamepad2 },
  { id: "STAFF", label: "Staff", desc: "Team only", icon: ShieldCheck },
];

/* STEP 4 — role packs (multi) */
export const ROLE_PACKS: Option[] = [
  { id: "basic", label: "Basic", desc: "Admin · Mod · Member", icon: Crown },
  { id: "gaming", label: "Gaming", desc: "Gamer · Team A/B", icon: Gamepad2 },
  { id: "school", label: "School", desc: "Student · Teacher", icon: GraduationCap },
  { id: "business", label: "Business", desc: "Owner · Staff · Client", icon: Briefcase },
];

/* STEP 5 — advanced (checkbox) */
export const ADVANCED: Option[] = [
  { id: "welcome", label: "Auto welcome", desc: "Greet new joiners", icon: HandHeart },
  { id: "verification", label: "Verification", desc: "Gate the entrance", icon: ShieldCheck },
  { id: "antiraid", label: "Anti-raid", desc: "Block raid waves", icon: ShieldCheck },
  { id: "tickets", label: "Ticket system", desc: "Support threads", icon: LifeBuoy },
  { id: "leveling", label: "Leveling", desc: "Reward activity", icon: TrendingUp },
  { id: "autorole", label: "Auto role", desc: "Role on join", icon: DoorOpen },
  { id: "aimod", label: "AI moderation", desc: "Smart filtering", icon: Bot },
];

export const STEPS = [
  { id: 1, key: "type", title: "Server type", hint: "Pick every vibe that fits — mix freely." },
  { id: 2, key: "style", title: "Style & features", hint: "Set the tone and switch on systems." },
  { id: 3, key: "channels", title: "Channels", hint: "Toggle the categories you want." },
  { id: 4, key: "roles", title: "Roles", hint: "Choose role packs, then customize." },
  { id: 5, key: "advanced", title: "Advanced", hint: "Layer on protection & automation." },
  { id: 6, key: "preview", title: "Preview", hint: "Review the blueprint, then deploy." },
] as const;
