/**
 * Promote a held review lead into an incident record.
 *
 * The ingest queue holds a candidate when it looks similar to an existing
 * record. Some of those are genuinely separate events that were never recorded,
 * and nothing in the app can insert them afterwards. This tool does that one
 * job, from the evidence the review row already captured.
 *
 *   npx tsx scripts/promote-review-lead.ts --review <id>            # dry run
 *   npx tsx scripts/promote-review-lead.ts --review <id> --apply
 *
 * Sibling rows for the same source URL and settlement are resolved with it.
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import type { LocationPrecision } from "../src/lib/incident-uncertainty";
import { hashFor } from "../src/lib/search-led-discovery";
import { lgaCompatible, placesPlausiblySame } from "../src/lib/location-identity";

dotenv.config({ path: ".env.local" });

const ACTOR = "review-promotion";

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const reviewId = arg("review");
  const apply = process.argv.includes("--apply");
  if (!reviewId) {
    console.error("Usage: npx tsx scripts/promote-review-lead.ts --review <id> [--apply]");
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not found in .env.local");
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000, bufferCommands: false });
  const db = mongoose.connection.db!;
  const reviews = db.collection("incident_reviews");
  const attacks = db.collection("attacks");
  const { ObjectId } = mongoose.Types;

  const row = await reviews.findOne({ _id: new ObjectId(reviewId) });
  if (!row) throw new Error(`Review ${reviewId} not found`);
  if (row.kind !== "duplicate") throw new Error(`Review ${reviewId} is kind "${row.kind}", not a duplicate hold`);
  if (row.status !== "pending") throw new Error(`Review ${reviewId} is already ${row.status}`);
  if (row.sourceEvidence?.candidateId) throw new Error(`Review ${reviewId} compares two stored records; adjudicate it, do not promote it`);

  const candidate = row.candidates?.[0];
  if (!candidate) throw new Error(`Review ${reviewId} has no captured candidate`);

  const date = new Date(candidate.date);
  if (Number.isNaN(date.getTime())) throw new Error("Candidate has no valid event date");
  if (!candidate.location?.state || !candidate.location?.town) throw new Error("Candidate has no usable location");
  if (/^(?:unknown|unspecified|n\/?a)$/i.test(candidate.location.town)) throw new Error(`Candidate town "${candidate.location.town}" is a placeholder`);
  if (candidate.datePrecision === "date_range" && !(candidate.dateRange?.start && candidate.dateRange?.end)) {
    throw new Error("Candidate declares a date range without range bounds");
  }

  const source = {
    url: row.sourceUrl,
    title: row.title || candidate.title,
    publisher: row.publisher || "",
    publishedAt: row.publishedAt ? new Date(row.publishedAt) : null,
  };
  const doc = {
    title: candidate.title,
    description: candidate.description || candidate.title,
    date,
    datePrecision: candidate.datePrecision || "exact_day",
    dateRange: candidate.dateRange || undefined,
    dateEvidence: candidate.dateEvidence || "",
    location: {
      state: candidate.location.state,
      lga: candidate.location.lga || "Unknown",
      town: candidate.location.town,
      precision: (candidate.location.precision || "approximate_lga") as LocationPrecision,
      notes: candidate.location.notes || "",
    },
    group: candidate.group || "Unknown",
    casualties: candidate.casualties || { killed: null, injured: null, kidnapped: null, displaced: null },
    casualtyMeta: candidate.casualtyMeta || {},
    sources: [source],
    status: "developing" as const,
    tags: [...new Set([...(candidate.tags || []), "review-promoted"])],
    hash: hashFor({ ...candidate, date: date.toISOString(), sources: [source] } as never),
    _deleted: false,
    _deletedReason: "",
    _deletedAt: null,
    _deletedBy: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Guard: never add a second active record for the same identity.
  const sameHash = await attacks.findOne({ hash: doc.hash, _deleted: { $ne: true } });
  if (sameHash) throw new Error(`An active record already has this identity: ${String(sameHash._id)}`);
  // Compare places with the same rules as ingest, so a spelling variant cannot
  // slip past a naive exact-town check.
  const nearby = await attacks.find({
    _deleted: { $ne: true },
    "location.state": doc.location.state,
    date: { $gte: new Date(date.getTime() - 86400000), $lte: new Date(date.getTime() + 86400000) },
  }).project({ _id: 1, title: 1, location: 1, date: 1, casualties: 1 }).toArray();
  const samePlace = nearby.find((record) =>
    placesPlausiblySame(record.location?.town || "", doc.location.town)
    && lgaCompatible(record.location?.lga || "", doc.location.lga));
  if (samePlace) throw new Error(`Nearby active record already covers this place and date: ${String(samePlace._id)} "${samePlace.title}"`);

  console.log(`Mode: ${apply ? "APPLY" : "DRY RUN"}`);
  console.log(JSON.stringify({ reviewId, source: source.url, doc }, null, 2));

  if (!apply) {
    await mongoose.disconnect();
    return;
  }

  const inserted = await attacks.insertOne(doc);
  const siblings = await reviews.updateMany(
    {
      sourceUrl: row.sourceUrl,
      kind: "duplicate",
      status: "pending",
      "sourceEvidence.candidateId": { $exists: false },
      "candidates.date": date,
      "candidates.location.town": candidate.location.town,
      "candidates.location.lga": candidate.location.lga,
    },
    { $set: {
      status: "resolved",
      reviewedAt: new Date(),
      reviewedBy: ACTOR,
      dispositionNote: `Promoted to incident ${String(inserted.insertedId)}: a separate event that the duplicate gate had held.`,
      nextRetryAt: null,
      retryable: false,
      updatedAt: new Date(),
    } },
  );
  console.log(`Inserted ${String(inserted.insertedId)} and resolved ${siblings.modifiedCount} review row(s).`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
