/**
 * repair-data-quality.ts
 *
 * One-off incident data repair for inflated monthly totals.
 *
 * What it fixes:
 * 1) Exact duplicate records (same incident date + same normalized title)
 * 2) Cross-state border duplicates (same date + same town + shared sources)
 * 3) Narrative month mismatch (e.g. April record describing a March incident)
 *
 * Usage:
 *   npx tsx scripts/repair-data-quality.ts            # dry run
 *   npx tsx scripts/repair-data-quality.ts --execute  # apply changes
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import mongoose from "mongoose";

interface IncidentDoc {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
  location?: {
    state?: string;
    lga?: string;
    town?: string;
  };
  casualties?: {
    killed?: number | null;
    injured?: number | null;
    kidnapped?: number | null;
    displaced?: number | null;
  };
  sources?: {
    url: string;
    title?: string;
    publisher?: string;
  }[];
  _deleted?: boolean;
  _deletedReason?: string;
}

const MONTH_NAME_TO_INDEX: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

function normalizeText(value: string): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTitle(value: string): string {
  return normalizeText(value)
    .replace(/\b(nigeria|nigerian|state)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(url: string): string {
  return String(url || "").trim().toLowerCase().replace(/\/$/, "");
}

function isKnownPlace(value: string | undefined): boolean {
  const v = String(value || "").trim().toLowerCase();
  return !!v && v !== "unknown" && v !== "n/a" && v !== "unspecified";
}

function inferNarrativeDate(description: string): Date | null {
  const text = String(description || "");
  const patterns = [
    /\b(?:On\s+)?(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?\s*(?:or|\/|-)\s*(\d{1,2})(?:st|nd|rd|th)?(?:,\s*|\s+)(20\d{2})\b/i,
    /\bOn\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,\s*|\s+)(20\d{2})\b/i,
    /\b(?:On\s+)?(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,\s*|\s+)(20\d{2})\b/i,
    /\b(?:On|Since)\s+(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)(?:,\s*|\s+)(20\d{2})\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;

    let day: number;
    let monthName: string;
    let year: number;

    if (match.length === 5) {
      monthName = match[1];
      day = Number(match[2]);
      year = Number(match[4]);
    } else if (Number.isNaN(Number(match[1]))) {
      monthName = match[1];
      day = Number(match[2]);
      year = Number(match[3]);
    } else {
      day = Number(match[1]);
      monthName = match[2];
      year = Number(match[3]);
    }

    const monthIndex = MONTH_NAME_TO_INDEX[monthName.toLowerCase()];
    if (monthIndex === undefined || !Number.isFinite(day) || !Number.isFinite(year)) continue;
    if (day < 1 || day > 31 || year < 2015 || year > new Date().getUTCFullYear() + 1) continue;

    const inferred = new Date(Date.UTC(year, monthIndex, day, 12, 0, 0, 0));
    if (!Number.isNaN(inferred.getTime())) return inferred;
  }

  return null;
}

function maxNullable(a: number | null | undefined, b: number | null | undefined): number | null {
  if (a == null && b == null) return null;
  return Math.max(a ?? 0, b ?? 0);
}

function mergeCasualties(a: IncidentDoc, b: IncidentDoc) {
  return {
    killed: maxNullable(a.casualties?.killed, b.casualties?.killed),
    injured: maxNullable(a.casualties?.injured, b.casualties?.injured),
    kidnapped: maxNullable(a.casualties?.kidnapped, b.casualties?.kidnapped),
    displaced: maxNullable(a.casualties?.displaced, b.casualties?.displaced),
  };
}

function mergeSources(a: IncidentDoc, b: IncidentDoc) {
  const sourceMap = new Map<string, { url: string; title?: string; publisher?: string }>();
  for (const source of [...(a.sources || []), ...(b.sources || [])]) {
    const key = normalizeUrl(source.url);
    if (!key) continue;
    if (!sourceMap.has(key)) sourceMap.set(key, source);
  }
  return Array.from(sourceMap.values());
}

function titleTokenOverlap(a: string, b: string): number {
  const stop = new Set(["attack", "attacks", "incident", "nigeria", "nigerian", "state", "in"]);
  const ta = new Set(normalizeTitle(a).split(" ").filter((w) => w.length > 3 && !stop.has(w)));
  const tb = new Set(normalizeTitle(b).split(" ").filter((w) => w.length > 3 && !stop.has(w)));
  if (ta.size === 0 || tb.size === 0) return 0;
  let overlap = 0;
  for (const token of ta) if (tb.has(token)) overlap++;
  return overlap / Math.min(ta.size, tb.size);
}

function pickPrimary(cluster: IncidentDoc[]): IncidentDoc {
  return [...cluster].sort((a, b) => {
    const aSources = (a.sources || []).length;
    const bSources = (b.sources || []).length;
    if (bSources !== aSources) return bSources - aSources;
    const aDesc = String(a.description || "").length;
    const bDesc = String(b.description || "").length;
    return bDesc - aDesc;
  })[0];
}

async function run() {
  const execute = process.argv.includes("--execute");
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not found in .env.local");

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  const col = mongoose.connection.collection("attacks");

  const aprilStart = new Date("2026-04-01T00:00:00.000Z");
  const mayStart = new Date("2026-05-01T00:00:00.000Z");

  const baseFilter = {
    _deleted: { $ne: true },
    date: { $gte: aprilStart, $lt: mayStart },
  };

  let docs = await col.find(baseFilter).toArray() as unknown as IncidentDoc[];
  console.log(`Loaded ${docs.length} active April records. Mode: ${execute ? "EXECUTE" : "DRY RUN"}`);

  // 1) Exact duplicate clusters: same date + normalized title
  const exactMap = new Map<string, IncidentDoc[]>();
  for (const doc of docs) {
    const key = `${doc.date.toISOString().slice(0, 10)}|${normalizeTitle(doc.title)}`;
    if (!exactMap.has(key)) exactMap.set(key, []);
    exactMap.get(key)!.push(doc);
  }
  const exactClusters = Array.from(exactMap.values()).filter((items) => items.length > 1);

  let mergedCount = 0;
  let deletedCount = 0;

  for (const cluster of exactClusters) {
    const primary = pickPrimary(cluster);
    const secondaries = cluster.filter((d) => String(d._id) !== String(primary._id));
    for (const secondary of secondaries) {
      const merged = {
        casualties: mergeCasualties(primary, secondary),
        sources: mergeSources(primary, secondary),
      };

      console.log(
        `[EXACT DUP] ${primary._id} <= ${secondary._id} | ${primary.title}`,
      );

      if (execute) {
        await col.updateOne(
          { _id: primary._id },
          {
            $set: {
              casualties: merged.casualties,
              sources: merged.sources,
              updatedAt: new Date(),
            },
          },
        );
        await col.updateOne(
          { _id: secondary._id },
          {
            $set: {
              _deleted: true,
              _deletedReason: `Exact duplicate of ${primary._id}`,
              updatedAt: new Date(),
            },
          },
        );
      }
      mergedCount++;
      deletedCount++;
    }
  }

  if (execute) {
    docs = await col.find(baseFilter).toArray() as unknown as IncidentDoc[];
  }

  // 2) Cross-state duplicates: same day + same town + shared source(s)
  const seen = new Set<string>();
  for (let i = 0; i < docs.length; i++) {
    for (let j = i + 1; j < docs.length; j++) {
      const a = docs[i];
      const b = docs[j];
      if (!a.location || !b.location) continue;
      if (!isKnownPlace(a.location.town) || !isKnownPlace(b.location.town)) continue;
      if (normalizeText(a.location.town || "") !== normalizeText(b.location.town || "")) continue;
      if (normalizeText(a.location.state || "") === normalizeText(b.location.state || "")) continue;
      if (a.date.toISOString().slice(0, 10) !== b.date.toISOString().slice(0, 10)) continue;

      const key = [String(a._id), String(b._id)].sort().join(":");
      if (seen.has(key)) continue;
      seen.add(key);

      const sourcesA = new Set((a.sources || []).map((s) => normalizeUrl(s.url)).filter(Boolean));
      const sourcesB = new Set((b.sources || []).map((s) => normalizeUrl(s.url)).filter(Boolean));
      let shared = 0;
      for (const url of sourcesA) if (sourcesB.has(url)) shared++;

      const overlap = titleTokenOverlap(a.title, b.title);
      const ak = a.casualties?.killed ?? 0;
      const bk = b.casualties?.killed ?? 0;
      const highCasualtyMatch = ak >= 100 && bk >= 100;

      if (shared < 1 && !highCasualtyMatch && overlap < 0.7) continue;

      const primary = pickPrimary([a, b]);
      const secondary = String(primary._id) === String(a._id) ? b : a;
      const merged = {
        casualties: mergeCasualties(primary, secondary),
        sources: mergeSources(primary, secondary),
      };

      console.log(
        `[CROSS-STATE DUP] ${primary._id} <= ${secondary._id} | ${primary.title} | ${primary.location?.state} <-> ${secondary.location?.state} | sharedSources=${shared} | titleOverlap=${overlap.toFixed(2)}`,
      );

      if (execute) {
        await col.updateOne(
          { _id: primary._id },
          {
            $set: {
              casualties: merged.casualties,
              sources: merged.sources,
              updatedAt: new Date(),
            },
          },
        );
        await col.updateOne(
          { _id: secondary._id },
          {
            $set: {
              _deleted: true,
              _deletedReason: `Cross-state duplicate of ${primary._id}`,
              updatedAt: new Date(),
            },
          },
        );
      }
      mergedCount++;
      deletedCount++;
    }
  }

  // 3) Narrative date correction (month mismatch drift)
  const refreshed = execute
    ? await col.find(baseFilter).toArray() as unknown as IncidentDoc[]
    : docs;

  let dateFixes = 0;
  for (const doc of refreshed) {
    const inferred = inferNarrativeDate(doc.description || "");
    if (!inferred) continue;

    const current = new Date(doc.date);
    if (Number.isNaN(current.getTime())) continue;

    const diffDays = Math.abs(inferred.getTime() - current.getTime()) / (24 * 60 * 60 * 1000);
    const inferredMonth = inferred.getUTCMonth();
    const currentMonth = current.getUTCMonth();
    if (diffDays < 7 || diffDays > 60 || inferredMonth === currentMonth) continue;

    console.log(
      `[DATE FIX] ${doc._id} | ${current.toISOString().slice(0, 10)} -> ${inferred.toISOString().slice(0, 10)} | ${doc.title}`,
    );

    if (execute) {
      await col.updateOne(
        { _id: doc._id },
        { $set: { date: inferred, updatedAt: new Date() } },
      );
    }
    dateFixes++;
  }

  const monthly = await col.aggregate([
    { $match: { _deleted: { $ne: true }, date: { $gte: new Date("2026-01-01T00:00:00.000Z"), $lt: new Date("2027-01-01T00:00:00.000Z") } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
        incidents: { $sum: 1 },
        killed: { $sum: { $ifNull: ["$casualties.killed", 0] } },
        kidnapped: { $sum: { $ifNull: ["$casualties.kidnapped", 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]).toArray();

  console.log("\nSummary:");
  console.log(`- Exact duplicate merges: ${mergedCount}`);
  console.log(`- Soft-deleted duplicates: ${deletedCount}`);
  console.log(`- Date corrections: ${dateFixes}`);
  console.log("- Monthly totals after repair:");
  for (const row of monthly) {
    console.log(`  ${row._id}: incidents=${row.incidents}, killed=${row.killed}, kidnapped=${row.kidnapped}`);
  }

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("repair-data-quality failed:", err);
  try {
    await mongoose.disconnect();
  } catch {
    // no-op
  }
  process.exit(1);
});
