import type { Metadata } from "next";

export const metadata: Metadata = {
  // Restated so the state pages below keep the site template.
  title: { default: "States", template: "%s | NATracker" },
  description: "Reported attacks, deaths and abductions in each Nigerian state and the FCT this year.",
};

export default function StatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
