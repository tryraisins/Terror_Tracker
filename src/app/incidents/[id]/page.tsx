import type { Metadata } from "next";
import { notFound } from "next/navigation";
import IncidentDetailClient from "./IncidentDetailClient";
import { getIncidentMetadata, getPublicIncident } from "@/lib/incident-public";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return getIncidentMetadata(id);
}

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let incident = null;
  try {
    incident = await getPublicIncident(id);
  } catch (error) {
    // A database failure is not a missing record. Keep the client error state and
    // its retry affordance instead of claiming the record never existed.
    console.error("Unable to load incident page:", error);
    return <IncidentDetailClient id={id} initialRecord={null} />;
  }
  // Every id that reaches this point is either malformed or points at nothing.
  // Both are a 404; a rendered "not found" body with a 200 tells search engines
  // the page exists.
  if (!incident) notFound();
  return <IncidentDetailClient id={id} initialRecord={incident} />;
}
