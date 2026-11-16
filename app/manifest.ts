import type { MetadataRoute } from "next";

import { ICON_BACKGROUND } from "@/lib/pwa/icon-art";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daylog",
    short_name: "Daylog",
    description: "Track your habits and workouts every day.",
    start_url: "/today",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: ICON_BACKGROUND,
    theme_color: ICON_BACKGROUND,
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png" },
      {
        src: "/pwa-icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
