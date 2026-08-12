import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "About — NATracker",
    description: "Learn about the Nigeria Attack Tracker, our data pipeline, sources, and methodology.",
};

export default function AboutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
