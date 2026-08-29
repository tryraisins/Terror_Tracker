import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BreakingTicker from "@/components/BreakingTicker";
import Footer from "@/components/Footer";
import UpdateNotifier from "@/components/UpdateNotifier";
import { ThemeProvider } from "@/components/ThemeProvider";
import PWARegistration from "@/components/PWARegistration";

export const metadata: Metadata = {
  metadataBase: new URL("https://terrortracker.tryraisins.dev"),
  manifest: "/manifest.json",
  title: {
    default: "NATracker — Nigeria Attack Tracker",
    template: "%s | NATracker",
  },
  description:
    "Real-time tracking and intelligence on terrorist attacks, banditry, and insurgency across Nigeria. Data sourced from verified news media and security reports.",
  keywords: [
    "Nigeria security",
    "attack tracker",
    "terrorism Nigeria",
    "Boko Haram",
    "ISWAP",
    "banditry",
    "kidnapping",
    "security intelligence",
    "insurgency data",
    "West Africa security",
  ],
  authors: [{ name: "NATracker Intelligence" }],
  creator: "NATracker",
  publisher: "NATracker",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "NATracker — Real-time Nigeria Security Intelligence",
    description:
      "Monitor terrorist attacks, bandit raids, and insurgent activities across Nigeria in real-time. Verified data from multiple sources.",
    url: "https://terrortracker.tryraisins.dev",
    siteName: "NATracker",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nigeria Attack Tracker Dashboard",
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NATracker — Nigeria Attack Tracker",
    description:
      "Real-time tracking of security incidents, terrorism, and banditry in Nigeria.",
    creator: "@NATracker",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#8b1a1a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-grain bg-dot-grid min-h-screen antialiased">
        <Script
          id="theme-preference"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const saved = localStorage.getItem('nat-theme'); const theme = saved === 'light' || saved === 'dark' ? saved : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); document.documentElement.dataset.theme = theme; } catch (_) {} })();`,
          }}
        />
        <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "vgnovfqjbc");
            `,
          }}
        />
          <ThemeProvider>
            <PWARegistration />
            <Navbar />
            <BreakingTicker />
            <main className="page-shell min-h-screen">
              {children}
            </main>
            <Footer />
            <UpdateNotifier />
          </ThemeProvider>
      </body>
    </html>
  );
}
