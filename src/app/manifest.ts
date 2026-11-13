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
                src: "/newapp-logo.png",
                sizes: "773x772",
                type: "image/png",
            },
        ],
    }
}
