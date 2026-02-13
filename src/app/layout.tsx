import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navbar from "@/components/Navbar";
import BreakingTicker from "@/components/BreakingTicker";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "NATracker — Nigeria Attack Tracker",
  description:
    "Real-time tracking and analysis of terrorist and insurgent attacks across Nigeria. Data sourced from verified news outlets and security reports.",
  keywords: [
    "Nigeria",
    "terrorism",
    "attack tracker",
    "Boko Haram",
    "ISWAP",
    "security",
    "West Africa",
    "insurgency",
  ],
  openGraph: {
    title: "NATracker — Nigeria Attack Tracker",
    description:
      "Real-time tracking and analysis of terrorist attacks across Nigeria",
    type: "website",
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
