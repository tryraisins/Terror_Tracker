import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navbar from "@/components/Navbar";
import BreakingTicker from "@/components/BreakingTicker";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://terrortracker.tryraisins.dev"),
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-grain bg-dot-grid min-h-screen antialiased">
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
          <Navbar />
          <BreakingTicker />
          <main className="pt-32 min-h-screen">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
