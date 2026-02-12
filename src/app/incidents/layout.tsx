import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Incident Reports — NATracker",
    description: "Browse, search, and filter all tracked terrorist and insurgent attack incidents across Nigeria.",
};

export default function IncidentsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
