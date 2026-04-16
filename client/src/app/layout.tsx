import type { Metadata } from "next";
import { GeistSans, GeistMono } from "geist/font";
import "./globals.css";
import RootLayoutClient from "./RootLayoutClient";

export const metadata: Metadata = {
  title: "Benzard Sports Management",
  description:
    "Building champions from grassroots to glory in Liberia through football scouting, training, and management.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/favicon.png",
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  themeColor: "#03045e", // Updated to secondary brand color
  viewport: "width=device-width, initial-scale=1",
  keywords: [
    "Benzard Sports Management",
    "BSM",
    "Liberia",
    "Football",
    "Soccer",
    "Athlete Development",
    "Youth Empowerment",
    "Sports Management",
    "FIFA",
    "CAF",
  ],
  authors: [{ name: "Benzard Sports Management" }],
  openGraph: {
    title: "Benzard Sports Management",
    description:
      "Building champions from grassroots to glory in Liberia through football scouting, training, and management.",
    url: "https://benzardsportsmanagement.com", // Updated to a placeholder domain
    siteName: "Benzard Sports Management",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Benzard Sports Management - Football in Liberia",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Benzard Sports Management",
    description:
      "Building champions from grassroots to glory in Liberia through football scouting, training, and management.",
    creator: "@benzardsports", // Updated to a placeholder Twitter handle
    images: ["/og-image.jpg"],
  },
};

// This is a Server Component by default
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
