import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bronze Snake Xmas Party",
    short_name: "BS Xmas",
    start_url: "/",
    display: "standalone",
    background_color: "#121f0b",
    theme_color: "#121f0b",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
