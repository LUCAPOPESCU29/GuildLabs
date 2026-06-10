import type { Metadata } from "next";
import { BotsExplorer } from "./_explorer";

export const metadata: Metadata = {
  title: "Discord Bots",
  description:
    "Explore every Discord bot built by GuildLabs. Each bot does one thing exceptionally — from AI Q&A surfacing to server automation. Free and open source.",
  keywords: ["Discord bots", "GuildLabs bots", "AI Discord bot", "free Discord bots"],
  openGraph: {
    title: "Discord Bots — GuildLabs",
    description: "Explore every Discord bot built by GuildLabs. Free and open source.",
    url: "https://www.guildlabs.fun/bots",
  },
};

export default function BotsIndex() {
  return <BotsExplorer />;
}
