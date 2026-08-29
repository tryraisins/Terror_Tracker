import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Incident Map — NATracker",
    description: "Geographic distribution of recorded incidents by Nigerian state. It does not predict safety or future events.",
};

export default function MapLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
