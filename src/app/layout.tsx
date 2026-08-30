import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PWARegistration from "@/components/PWARegistration";

export const metadata: Metadata = {
  metadataBase: new URL("https://terrortracker.tryraisins.dev"),
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, title: "NATracker", statusBarStyle: "black-translucent" },
  title: { default: "NATracker — Nigeria Security Incident Tracker", template: "%s | NATracker" },
  description: "A public-interest record of reported security incidents and human harm in Nigeria, with cited sources and visible uncertainty.",
  keywords: ["Nigeria security", "incident record", "terrorism Nigeria", "Boko Haram", "ISWAP", "banditry", "kidnapping"],
  authors: [{ name: "NATracker" }], creator: "NATracker", publisher: "NATracker",
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: { title: "NATracker — Nigeria Security Incident Tracker", description: "Reported incidents with sources and visible uncertainty.", url: "https://terrortracker.tryraisins.dev", siteName: "NATracker", locale: "en_NG", type: "website" },
  twitter: { card: "summary_large_image", title: "NATracker — Nigeria Security Incident Tracker", description: "Reported incidents with sources and visible uncertainty.", creator: "@NATracker" },
  robots: { index: true, follow: true }, alternates: { canonical: "/" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <meta name="theme-color" content="#0b0c0f" />
    <meta name="color-scheme" content="dark" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
  </head><body>
    <a className="skip-link" href="#main-content">Skip to content</a><PWARegistration /><Navbar />
    <main id="main-content" className="app-main">{children}</main><Footer />
  </body></html>;
}
