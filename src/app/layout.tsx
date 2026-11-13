import type { Metadata } from "next";
import "./globals.css";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export const metadata: Metadata = {
  title: "ComicVerse — Discover your next world",
  description:
    "A reader-first place to discover manga, manhwa and webtoons, and build your personal reading library.",
  applicationName: "ComicVerse",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
        <MobileBottomNav />
      </body>
    </html>
  );
}