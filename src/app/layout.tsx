import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import PWARegistration from "@/components/PWARegistration";

export const metadata: Metadata = {
  metadataBase: new URL("https://terrortracker.tryraisins.dev"),
  manifest: "/manifest.json",
  title: { default: "NATracker — Nigeria incident record", template: "%s | NATracker" },
  description: "A public-interest record of reported security incidents and human harm in Nigeria, with cited sources and visible uncertainty.",
  keywords: ["Nigeria security", "incident record", "terrorism Nigeria", "Boko Haram", "ISWAP", "banditry", "kidnapping"],
  authors: [{ name: "NATracker" }], creator: "NATracker", publisher: "NATracker",
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: { title: "NATracker — Nigeria incident record", description: "Reported incidents with sources and visible uncertainty.", url: "https://terrortracker.tryraisins.dev", siteName: "NATracker", locale: "en_NG", type: "website" },
  twitter: { card: "summary_large_image", title: "NATracker — Nigeria incident record", description: "Reported incidents with sources and visible uncertainty.", creator: "@NATracker" },
  robots: { index: true, follow: true }, alternates: { canonical: "/" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-theme="dark" suppressHydrationWarning><head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <meta name="theme-color" content="#111417" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <script dangerouslySetInnerHTML={{ __html: "try { document.documentElement.dataset.theme = localStorage.getItem('natracker-theme') === 'light' ? 'light' : 'dark'; } catch (_) {}" }} />
  </head><body><ThemeProvider>
    <a className="skip-link" href="#main-content">Skip to content</a><PWARegistration /><Navbar />
    <main id="main-content" className="app-main">{children}</main><Footer />
  </ThemeProvider></body></html>;
}
