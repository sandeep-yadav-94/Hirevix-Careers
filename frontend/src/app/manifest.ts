import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hirevix Careers",
    short_name: "Hirevix-Careers",
    description: "Find your next career opportunity with Hirevix.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    icons: [
      { src: "/icons/hirevix-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/hirevix-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
