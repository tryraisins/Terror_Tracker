import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Incident Records — NATracker",
    description: "Browse reported incidents with sources, reporting status and visible uncertainty.",
};

export default function IncidentsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
