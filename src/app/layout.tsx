import "@/styles/globals.css";
import Kbar from "@/app/mail/components/kbar";
import { ClerkProvider } from "@clerk/nextjs";

import { GeistSans } from "geist/font/sans";
import { type Metadata, type Viewport } from "next";

import { TRPCReactProvider } from "@/trpc/react";
import { ThemeProvider } from "@/components/theme-provider";
import { SmoothScroll } from "@/components/smooth-scroll";
import { ThemedToaster } from "@/components/themed-toaster";
import { StaleActionRecovery } from "@/components/stale-action-recovery";

export const metadata: Metadata = {
  title: {
    default: "CerePost — AI Email Client",
    template: "%s · CerePost",
  },
  description:
    "CerePost is an AI-native email client with natural language search, instant drafting, thread triage, and keyboard-first navigation.",
  applicationName: "CerePost",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://cerepost.app"),
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "CerePost — AI Email Client",
    description:
      "Email rebuilt for speed, intelligence, and zero clutter. Ask AI, draft faster, and reach inbox zero.",
    siteName: "CerePost",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "CerePost" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CerePost — AI Email Client",
    description:
      "Email rebuilt for speed, intelligence, and zero clutter. Ask AI, draft faster, and reach inbox zero.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0518" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      signInForceRedirectUrl="/mail"
      signUpForceRedirectUrl="/mail"
      signInFallbackRedirectUrl="/mail"
      signUpFallbackRedirectUrl="/mail"
    >
      <html lang="en" className={`${GeistSans.variable}`} suppressHydrationWarning>
        <body>
          <ThemeProvider attribute='class' defaultTheme='dark' enableSystem={false} disableTransitionOnChange>
            <SmoothScroll>
              <StaleActionRecovery />
              <TRPCReactProvider>
                <Kbar>
                {children}
                </Kbar>
              </TRPCReactProvider>
            </SmoothScroll>
            <ThemedToaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}