import { MessageCircle } from "lucide-react";

const DISCORD_PROFILE = "https://discord.com/users/1060616694189527160";

export function DiscordHelpCard({
  title = "Need a hand?",
  body = "Stuck on something? Message me directly on Discord and I'll help you get set up.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6">
      <div className="min-w-0">
        <h3 className="font-display text-lg font-black">{title}</h3>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">{body}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Maker of GuildLabs — member since Jan 2023.
        </p>
      </div>
      <a
        href={DISCORD_PROFILE}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.03]"
      >
        <MessageCircle className="size-4" aria-hidden />
        @Lucaaa on Discord
      </a>
    </div>
  );
}
