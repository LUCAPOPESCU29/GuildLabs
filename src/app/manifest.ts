import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GuildLabs",
    short_name: "GuildLabs",
    description: "Discord tools, done right — live charts, server setup, and more.",
    start_url: "/",
    display: "standalone",
    background_color: "#15131e",
    theme_color: "#8b93ff",
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
