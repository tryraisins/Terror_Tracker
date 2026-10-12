import type { Metadata } from "next";
import { Noto_Sans, Noto_Serif } from "next/font/google";
import { connection } from "next/server";
import { headers } from "next/headers";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PWARegistration from "@/components/PWARegistration";

// Noto covers Yoruba (ẹ ọ ṣ), Hausa (ɓ ɗ ƙ ƴ) and Igbo (ị ụ ṅ) place names without
// glyph fallback. Serif carries headings and figures; sans carries text and data.
const notoSans = Noto_Sans({ subsets: ["latin", "latin-ext", "vietnamese"], variable: "--font-sans", display: "swap" });
const notoSerif = Noto_Serif({ subsets: ["latin", "latin-ext", "vietnamese"], variable: "--font-serif", display: "swap" });

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

  return <html lang="en" className={`${notoSans.variable} ${notoSerif.variable}`}><head>
    {nonce ? <meta name="csp-nonce" content={nonce} /> : null}
    <meta name="theme-color" content="#0d0c0b" />
    <meta name="color-scheme" content="dark" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
  </head><body>
    <a className="skip-link" href="#main-content">Skip to content</a><PWARegistration /><Navbar />
    <main id="main-content" className="app-main">{children}</main><Footer />
  </body></html>;
}
