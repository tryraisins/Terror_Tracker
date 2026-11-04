import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { connection } from "next/server";
import { headers } from "next/headers";
import "./globals.css";
import AppShell from "@/components/AppShell";
import PWARegistration from "@/components/PWARegistration";

// Plus Jakarta Sans is the one catalogue face whose served file carries the Yoruba and Igbo
// dot-below letters and combining marks; the vietnamese subset holds those letters.
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin", "latin-ext", "vietnamese"], variable: "--font-sans", display: "swap" });

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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // CSP nonces are request-specific. Dynamic rendering lets Next.js read the
  // forwarded CSP and nonce every time it emits framework or inline scripts.
  await connection();
  const nonce = (await headers()).get("x-nonce");

  return <html lang="en" className={jakarta.variable}><head>
    {nonce ? <meta name="csp-nonce" content={nonce} /> : null}
    <meta name="theme-color" content="#111312" />
    <meta name="color-scheme" content="dark" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
  </head><body>
    <a className="skip-link" href="#main-content">Skip to content</a><PWARegistration />
    <AppShell>{children}</AppShell>
  </body></html>;
}
