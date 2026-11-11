import "@/styles/globals.css";
import Kbar from "@/app/mail/components/kbar";
import { ClerkProvider } from "@clerk/nextjs";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "@/trpc/react";
import { ThemeProvider } from "@/components/theme-provider";
import { SmoothScroll } from "@/components/smooth-scroll";
import { ThemedToaster } from "@/components/themed-toaster";
import { StaleActionRecovery } from "@/components/stale-action-recovery";

export const metadata: Metadata = {
  title: "CerePost",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
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