import type { Metadata } from "next";
import mongoose from "mongoose";
import { cache } from "react";
import Attack from "@/lib/models/Attack";
import connectDB from "@/lib/db";
import { impactParts, incidentDateLabel, locationLabel, type IncidentRecord } from "@/lib/incident-view";
import { SITE_URL } from "@/lib/site-config";

export const getPublicIncident = cache(async (id: string): Promise<IncidentRecord | null> => {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectDB();
  const value = await Attack.findOne({ _id: id, _deleted: { $ne: true } }).lean();
  if (!value) return null;

  return {
    _id: String(value._id),
    title: value.title,
    description: value.description,
    date: new Date(value.date).toISOString(),
    datePrecision: value.datePrecision,
    dateRange: value.dateRange ? {
      start: value.dateRange.start ? new Date(value.dateRange.start).toISOString() : null,
      end: value.dateRange.end ? new Date(value.dateRange.end).toISOString() : null,
    } : undefined,
    location: value.location,
    group: value.group,
    casualties: value.casualties,
    casualtyMeta: value.casualtyMeta,
    sources: value.sources,
    status: value.status,
    tags: value.tags,
    createdAt: value.createdAt ? new Date(value.createdAt).toISOString() : undefined,
    updatedAt: value.updatedAt ? new Date(value.updatedAt).toISOString() : undefined,
  };
});

export function incidentShareDescription(record: IncidentRecord) {
  const impact = impactParts(record.casualties, record.casualtyMeta);
  const context = [locationLabel(record.location, true), incidentDateLabel(record)].filter(Boolean).join(" · ");
  const details = impact.length ? ` Reported impact: ${impact.join(", ")}.` : " Casualty figures are not reported in this record.";
  return `${context}. ${record.status === "confirmed" ? "Confirmed" : record.status === "developing" ? "Developing" : "Unconfirmed"} incident record with cited sources and visible uncertainty.${details}`.slice(0, 300);
}

export async function getIncidentMetadata(id: string): Promise<Metadata> {
  try {
    const record = await getPublicIncident(id);
    if (!record) return { title: "Incident record not found", robots: { index: false, follow: true } };
    const url = `${SITE_URL}/incidents/${record._id}`;
    const description = incidentShareDescription(record);
    return {
      title: record.title,
      description,
      alternates: { canonical: url },
      openGraph: {
        type: "article",
        url,
        title: record.title,
        description,
        siteName: "NATracker",
        locale: "en_NG",
        modifiedTime: record.updatedAt,
        images: [{ url: `${url}/opengraph-image`, width: 1200, height: 630, alt: `NATracker incident record: ${record.title}` }],
      },
      twitter: {
        card: "summary_large_image",
        title: record.title,
        description,
        images: [{ url: `${url}/opengraph-image`, alt: `NATracker incident record: ${record.title}` }],
      },
    };
  } catch (error) {
    console.error("Unable to generate incident metadata:", error);
    return { title: "Nigeria incident record", description: "Reported incidents with cited sources and visible uncertainty." };
  }
}
