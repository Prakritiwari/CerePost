import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "CerePost — AI Email Client",
        short_name: "CerePost",
        description:
            "An AI-native email client with natural language search, instant drafting, and keyboard-first navigation.",
        start_url: "/mail",
        display: "standalone",
        background_color: "#0B0518",
        theme_color: "#0B0518",
        icons: [
            {
                src: "/icon-192.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: "/icon-512.png",
                sizes: "512x512",
                type: "image/png",
            },
            {
                src: "/icon.svg",
                sizes: "any",
                type: "image/svg+xml",
            },
        ],
    }
}
