import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bronze Snake Xmas Party",
  description: "Sat 5 Dec · 7–11pm. Invite only.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "BS Xmas", statusBarStyle: "black" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#121f0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
