import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Threat Map — NATracker",
    description: "Geographic visualization of terrorist and insurgent attacks across Nigerian states.",
};

export default function MapLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
