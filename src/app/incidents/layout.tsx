import type { Metadata } from "next";

export const metadata: Metadata = {
    // A plain string here would drop the root template for the record pages below, so restate it.
    // The root template already brands this page's own default title.
    title: { default: "Incident Records", template: "%s | NATracker" },
    description: "Browse reported incidents with sources, reporting status and visible uncertainty.",
};

export default function IncidentsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
