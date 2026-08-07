import type { Metadata, Viewport } from "next";
import { GeistSans, GeistMono } from "geist/font";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Pulse — Practice with proof",
    template: "%s — Pulse",
  },
  description: "Evidence-linked public speaking feedback for every practice session.",
  applicationName: "Pulse",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f5f1",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
