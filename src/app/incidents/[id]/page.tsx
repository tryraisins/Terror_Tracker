import type { Metadata } from "next";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
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
    console.error("Unable to load incident page:", error);
  }
  if (!incident && !mongoose.isValidObjectId(id)) notFound();
  return <IncidentDetailClient id={id} initialRecord={incident} />;
}
