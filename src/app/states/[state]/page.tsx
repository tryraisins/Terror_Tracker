import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StateClient from "./StateClient";
import { NIGERIA_STATES } from "@/lib/filter-options";
import { SITE_URL } from "@/lib/site-config";
import { stateSlug } from "@/lib/summary";

const fromSlug = (slug: string) => NIGERIA_STATES.find(({ value }) => stateSlug(value) === slug.toLowerCase())?.value;

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const state = fromSlug((await params).state);
  if (!state) return { title: "State not found", robots: { index: false, follow: true } };
  const url = `${SITE_URL}/states/${stateSlug(state)}`;
  const description = `Reported attacks, deaths and abductions in ${state === "FCT" ? "the FCT" : `${state} State`} this year, with every incident and its sources.`;
  return { title: state === "FCT" ? "FCT" : `${state} State`, description, alternates: { canonical: url }, openGraph: { url, title: `${state}: attacks this year | NATracker`, description, siteName: "NATracker", locale: "en_NG", type: "website" } };
}

export default async function StatePage({ params }: { params: Promise<{ state: string }> }) {
  const state = fromSlug((await params).state);
  if (!state) notFound();
  return <StateClient state={state} />;
}
