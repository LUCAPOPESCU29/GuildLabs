import type { Metadata } from "next";
import { Playground } from "./_playground";

export const metadata: Metadata = {
  title: "Playground — chat with the GuildLabs bot",
  description:
    "A Discord-style playground: type slash commands and the GuildLabs bot responds inline — /build a server with Construct, /chart a ticker with ChartIt, or /ask Maven anything.",
};

export default function PlaygroundPage() {
  return <Playground />;
}
