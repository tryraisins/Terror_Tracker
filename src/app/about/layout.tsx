import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Methodology — NATracker",
    description: "How reported incidents become records, including evidence labels and known limitations.",
};

export default function AboutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
