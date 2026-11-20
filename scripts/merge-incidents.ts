/**
 * Merge confirmed duplicate incidents into a canonical record.
 *
 * The duplicate gates now merge at ingest, but records that already split need
 * a guarded, repeatable repair. This tool takes an explicit pair list: it never
 * guesses which records are duplicates, because that decision needs source
 * evidence and belongs in review.
 *
 *   npx tsx scripts/merge-incidents.ts --pairs scratch/<run>/pairs.json
 *   npx tsx scripts/merge-incidents.ts --pairs scratch/<run>/pairs.json --apply
 *
 * Default mode is a dry run. `--apply` runs one transaction per pair, writes
 * before/after snapshots, and validates the collection afterwards.
 *
 * Pair entry:
 * {
 *   "keep": "<id>",
 *   "absorb": ["<id>", ...],
 *   "reason": "why these describe one event",
 *   "set": { ...optional field overrides on the survivor },
 *   "retargetTombstones": ["<previously absorbed id>"],
 *   "addSources": [{ "url", "title", "publisher", "publishedAt" }],
 *   "dropSources": ["<url>"]
 * }
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import type { LocationPrecision } from "../src/lib/incident-uncertainty";
import { assertActiveAttackDateIntegrity, parseIncidentDate } from "../src/lib/attack-data-integrity";
import { INCIDENT_DATE_PRECISION_VALUES } from "../src/lib/incident-date";
import { hashFor } from "../src/lib/search-led-discovery";

dotenv.config({ path: ".env.local" });

type Source = { url: string; title?: string; publisher?: string; publishedAt?: Date | string | null };
type Casualties = { killed: number | null; injured: number | null; kidnapped: number | null; displaced: number | null };
type CasualtyMeta = Record<string, { precision?: string; min?: number | null; max?: number | null; estimate?: number | null; sourceText?: string | null; note?: string | null }>;

type MergePair = {
  keep: string;
  absorb: string[];
  reason: string;
  set?: Partial<Record<"title" | "description" | "date" | "datePrecision" | "dateRange" | "dateEvidence" | "location" | "group" | "casualties" | "casualtyMeta" | "status" | "tags" | "sources", unknown>>;
  addSources?: Source[];
  dropSources?: string[];
  retargetTombstones?: string[];
};

const CASUALTY_FIELDS = ["killed", "injured", "kidnapped", "displaced"] as const;
const ACTOR = "duplicate-reconciliation";
const ALLOWED_SET_KEYS = new Set([
  "title", "description", "date", "datePrecision", "dateRange", "dateEvidence",
  "location", "group", "casualties", "casualtyMeta", "status", "tags", "sources",
]);

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function normalizeUrl(value: string): string {
  try {
    const url = new URL(String(value || "").trim());
    url.hash = "";
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_.+|fbclid|gclid|mc_cid|mc_eid|ref|source)$/i.test(key)) url.searchParams.delete(key);
    }
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return String(value || "").trim().replace(/\/+$/, "").toLowerCase();
  }
}

function unionSources(base: Source[], incoming: Source[], drop: Set<string>): Source[] {
  const seen = new Set<string>();
  const out: Source[] = [];
  for (const source of [...base, ...incoming]) {
    const key = normalizeUrl(source?.url || "");
    if (!key || seen.has(key) || drop.has(key)) continue;
    seen.add(key);
    const publishedAt = source.publishedAt ? new Date(source.publishedAt) : null;
    if (publishedAt && Number.isNaN(publishedAt.getTime())) throw new Error(`Invalid source publication date for ${source.url}`);
    out.push({
      url: source.url,
      title: source.title || "",
      publisher: source.publisher || "",
      publishedAt,
    });
  }
  return out;
}

function mergeCasualties(docs: Record<string, any>[]): { casualties: Casualties; casualtyMeta: CasualtyMeta } {
  const casualties = {} as Casualties;
  const casualtyMeta: CasualtyMeta = {};
  for (const field of CASUALTY_FIELDS) {
    const candidates = docs
      .map((doc) => ({ value: doc.casualties?.[field] ?? null, meta: doc.casualtyMeta?.[field] }))
      .filter((entry) => entry.value != null) as Array<{ value: number; meta?: CasualtyMeta[string] }>;
    if (!candidates.length) {
      casualties[field] = null;
      continue;
    }
    candidates.sort((a, b) => b.value - a.value);
    casualties[field] = candidates[0].value;
    // Metadata must describe the value that was actually kept. Borrowing a
    // quote from a different figure would publish the wrong evidence.
    if (candidates[0].meta) casualtyMeta[field] = candidates[0].meta;
  }
  return { casualties, casualtyMeta };
}

async function main() {
  const pairsPath = arg("pairs");
  const apply = process.argv.includes("--apply");
  if (!pairsPath) {
    console.error("Usage: npx tsx scripts/merge-incidents.ts --pairs <pairs.json> [--apply] [--artifacts <dir>]");
    process.exit(1);
  }
  const pairs = JSON.parse(fs.readFileSync(pairsPath, "utf8")) as MergePair[];
  if (!Array.isArray(pairs) || pairs.length === 0) throw new Error("Pair list is empty");

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const artifacts = path.join(arg("artifacts") || path.join("scratch", `duplicate-reconciliation-${stamp}`), `run-${runId}`);
  fs.mkdirSync(artifacts, { recursive: true });

  // One record cannot survive in one pair and be absorbed in another, and a
  // repeated id would let a later plan overwrite an earlier merge.
  const seenIds = new Set<string>();
  for (const pair of pairs) {
    for (const id of [pair.keep, ...pair.absorb, ...(pair.retargetTombstones || [])]) {
      if (seenIds.has(id)) throw new Error(`Record ${id} appears in more than one pair entry`);
      seenIds.add(id);
    }
  }

  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not found in .env.local");
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000, bufferCommands: false });
  const attacks = mongoose.connection.db!.collection("attacks");
  const { ObjectId } = mongoose.Types;

  const activeBefore = await attacks.countDocuments({ _deleted: { $ne: true } });
  console.log(`Mode: ${apply ? "APPLY" : "DRY RUN"}`);
  console.log(`Active records before: ${activeBefore}`);
  console.log(`Artifacts: ${artifacts}`);

  const touchedIds = new Set<string>();
  for (const pair of pairs) {
    touchedIds.add(pair.keep);
    for (const id of pair.absorb) touchedIds.add(id);
    for (const id of pair.retargetTombstones || []) touchedIds.add(id);
  }
  const snapshotBefore = await attacks
    .find({ _id: { $in: [...touchedIds].map((id) => new ObjectId(id)) } })
    .toArray();
  fs.writeFileSync(path.join(artifacts, "snapshot-before.json"), JSON.stringify(snapshotBefore, null, 2));

  const plans = [];
  const problems: string[] = [];

  for (const pair of pairs) {
    const keepId = new ObjectId(pair.keep);
    const absorbIds = pair.absorb.map((id) => new ObjectId(id));
    const keep = await attacks.findOne({ _id: keepId });
    if (!keep) { problems.push(`${pair.keep}: survivor not found`); continue; }
    const absorbDocs = await attacks.find({ _id: { $in: absorbIds } }).toArray();
    if (absorbDocs.length !== absorbIds.length) {
      problems.push(`${pair.keep}: ${absorbIds.length - absorbDocs.length} absorbed record(s) not found`);
      continue;
    }
    // A rerun may follow a partial application. Only records already absorbed
    // into THIS survivor are safely skipped; anything deleted into a different
    // record is an inconsistent request.
    const alreadyAbsorbed = absorbDocs.filter((doc) => doc._deleted === true
      && String(doc._deletedReason || "").startsWith(`Duplicate of ${pair.keep}`));
    const conflicting = absorbDocs.filter((doc) => doc._deleted === true && !alreadyAbsorbed.includes(doc));
    if (conflicting.length) {
      problems.push(`${pair.keep}: ${conflicting.map((doc) => String(doc._id)).join(", ")} already absorbed by another survivor`);
      continue;
    }
    const pendingAbsorb = absorbDocs.filter((doc) => doc._deleted !== true);
    if (pair.absorb.length > 0 && !pendingAbsorb.length) {
      console.log(`SKIP ${pair.keep}: every absorbed record is already merged into this survivor (idempotent rerun)`);
      continue;
    }
    if (!pair.absorb.length && !pair.set && !pair.addSources && !pair.dropSources && !pair.retargetTombstones?.length) {
      console.log(`SKIP ${pair.keep}: no absorbed record and no field override`);
      continue;
    }
    if (alreadyAbsorbed.length) {
      console.log(`RESUME ${pair.keep}: ${alreadyAbsorbed.length} absorbed record(s) already merged, ${pendingAbsorb.length} remaining`);
    }
    for (const key of Object.keys(pair.set || {})) {
      if (!ALLOWED_SET_KEYS.has(key)) problems.push(`${pair.keep}: unsupported override "${key}"`);
    }
    if (pair.set?.datePrecision !== undefined &&
        pair.set.datePrecision !== "unknown" && !INCIDENT_DATE_PRECISION_VALUES.some((value) => value === pair.set?.datePrecision)) {
      problems.push(`${pair.keep}: invalid date precision "${String(pair.set.datePrecision)}"`);
    }
    const location = pair.set?.location as { precision?: string } | undefined;
    if (location?.precision && !["exact", "surrounding_area", "approximate_lga", "approximate_state", "unknown"].includes(location.precision)) {
      problems.push(`${pair.keep}: invalid location precision "${location.precision}"`);
    }

    const absorbed = pendingAbsorb.map((doc) => JSON.parse(JSON.stringify(doc)));
    const keepDoc = JSON.parse(JSON.stringify(keep));
    const tombstones: Array<{ id: mongoose.Types.ObjectId; reason: string; priorTarget: string; chain: Array<{ id: mongoose.Types.ObjectId; reason: string }> }> = [];
    for (const id of pair.retargetTombstones || []) {
      const seen = new Set<string>([id]);
      let doc = await attacks.findOne({ _id: new ObjectId(id) });
      if (!doc || doc._deleted !== true) throw new Error(`${id}: retarget requires a deleted incident`);
      const originalReason = String(doc._deletedReason || "");
      const chain: Array<{ id: mongoose.Types.ObjectId; reason: string }> = [];
      const first = /^Duplicate of ([a-f0-9]{24})\./.exec(originalReason);
      if (!first) throw new Error(`${id}: missing duplicate target`);
      let target = first[1];
      while (target !== pair.keep) {
        if (seen.has(target)) throw new Error(`${id}: duplicate ancestry contains a cycle`);
        seen.add(target);
        doc = await attacks.findOne({ _id: new ObjectId(target) });
        const next = doc?._deleted === true && /^Duplicate of ([a-f0-9]{24})\./.exec(String(doc._deletedReason || ""));
        if (!next) throw new Error(`${id}: duplicate ancestry does not reach ${pair.keep}`);
        chain.push({ id: doc._id as mongoose.Types.ObjectId, reason: String(doc._deletedReason) });
        target = next[1];
      }
      if (first[1] !== pair.keep) tombstones.push({ id: new ObjectId(id), reason: originalReason, priorTarget: first[1], chain });
    }
    if (pair.set?.sources !== undefined) {
      if (!Array.isArray(pair.set.sources)) throw new Error(`${pair.keep}: sources override must be an array`);
      const original = new Set((keepDoc.sources || []).map((source: Source) => normalizeUrl(source.url)));
      const replacement = new Set((pair.set.sources as Source[]).map((source) => normalizeUrl(source?.url || "")));
      if (original.size !== replacement.size || [...original].some((url) => !url || !replacement.has(url))) {
        throw new Error(`${pair.keep}: sources override must preserve all existing source URLs`);
      }
    }
    const drop = new Set((pair.dropSources || []).map(normalizeUrl));
    const sources = unionSources(
      (pair.set?.sources as Source[] | undefined) || (keepDoc.sources || []),
      [...absorbed.flatMap((doc) => doc.sources || []), ...(pair.addSources || [])],
      drop,
    );
    const { casualties, casualtyMeta } = mergeCasualties([keepDoc, ...absorbed]);
    const explicitCasualties = (pair.set?.casualties as Partial<Casualties>) || {};
    const explicitMeta = (pair.set?.casualtyMeta as CasualtyMeta) || {};
    for (const field of CASUALTY_FIELDS) {
      if (explicitCasualties[field] !== undefined && casualtyMeta[field] && !explicitMeta[field]) {
        // The figure changed but its quote did not, so the quote is now wrong.
        delete casualtyMeta[field];
        console.log(`  note: ${field} overridden without new evidence text; stale quote dropped`);
      }
    }

    const update: Record<string, unknown> = {
      sources,
      tags: [...new Set([...(keepDoc.tags || []), ...absorbed.flatMap((doc) => doc.tags || []), "merged-duplicate"])],
      casualties: { ...casualties, ...explicitCasualties },
      casualtyMeta: { ...casualtyMeta, ...explicitMeta },
      status: pair.set?.status ?? (absorbed.some((doc) => doc.status === "confirmed") || keepDoc.status === "confirmed" ? "confirmed" : keepDoc.status),
      updatedAt: new Date(),
    };
    for (const [key, value] of Object.entries(pair.set || {})) {
      if (key === "sources" || key === "casualties" || key === "casualtyMeta") continue;
      if (key === "date") {
        update[key] = parseIncidentDate(value, `${pair.keep} date`);
      } else if (key === "dateRange" && value !== null) {
        if (typeof value !== "object" || Array.isArray(value)) throw new Error(`${pair.keep}: invalid dateRange`);
        const range = value as Record<string, unknown>;
        const start = range.start == null ? null : parseIncidentDate(range.start, `${pair.keep} dateRange.start`);
        const end = range.end == null ? null : parseIncidentDate(range.end, `${pair.keep} dateRange.end`);
        if (start && end && start > end) throw new Error(`${pair.keep}: dateRange start is after end`);
        update[key] = { start, end };
      } else {
        update[key] = value;
      }
    }

    // Identity hash covers title, date and location, so it must follow them.
    const identityChanged = ["title", "date", "datePrecision", "location"].some((key) => key in update);
    const next = { ...keepDoc, ...update };
    if (identityChanged) update.hash = hashFor(next as never);
    if (next.location) {
      const precision = next.location.precision as LocationPrecision | undefined;
      if (!precision) next.location.precision = next.location.town && !/^unknown$/i.test(next.location.town) ? "exact" : "approximate_state";
    }

    const plan = {
      keep: pair.keep,
      absorb: pair.absorb,
      reason: pair.reason,
      identityChanged,
      before: {
        title: keepDoc.title,
        date: keepDoc.date,
        location: keepDoc.location,
        casualties: keepDoc.casualties,
        status: keepDoc.status,
        sourceCount: (keepDoc.sources || []).length,
      },
      after: {
        title: next.title,
        date: next.date,
        location: next.location,
        casualties: next.casualties,
        status: next.status,
        sourceCount: sources.length,
        hash: update.hash || keepDoc.hash,
      },
      absorbedTitles: absorbed.map((doc) => doc.title),
      retargetTombstones: tombstones.map((doc) => ({ id: String(doc.id), priorTarget: doc.priorTarget })),
    };
    plans.push({ pair, keepId, absorbDocs: pendingAbsorb, tombstones, update, plan });
    console.log(`\n${pair.keep} <- ${pair.absorb.join(", ")}`);
    console.log(`  reason: ${pair.reason}`);
    console.log(`  title: ${keepDoc.title}`);
    console.log(`    ->  ${next.title}`);
    console.log(`  location: ${JSON.stringify(keepDoc.location)}`);
    console.log(`    ->  ${JSON.stringify(next.location)}`);
    console.log(`  casualties: ${JSON.stringify(keepDoc.casualties)} -> ${JSON.stringify(next.casualties)}`);
    console.log(`  status: ${keepDoc.status} -> ${next.status} | sources: ${(keepDoc.sources || []).length} -> ${sources.length}`);
  }

  fs.writeFileSync(path.join(artifacts, "plan.json"), JSON.stringify(plans.map((entry) => entry.plan), null, 2));

  if (problems.length) {
    console.error("\nAborting. Problems:");
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }

  let activeAfter = activeBefore;
  if (apply) {
    for (const { pair, keepId, absorbDocs, tombstones, update } of plans) {
      // A recomputed identity hash can equal the absorbed record's existing
      // hash, because the merge may adopt its location spelling. The unique
      // hash index covers soft-deleted rows too, so the absorbed hash is
      // rewritten before the survivor takes it.
      const rewrittenHashes = new Map<string, string>();
      if (typeof update.hash === "string") {
        for (const doc of absorbDocs) {
          if (doc.hash === update.hash) {
            rewrittenHashes.set(String(doc._id), createHash("sha256").update(`${doc.hash}|merged-into:${pair.keep}`).digest("hex"));
          }
        }
      }
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          if (!await attacks.findOne({ _id: keepId, _deleted: { $ne: true } }, { session })) throw new Error(`${pair.keep}: survivor is no longer active`);
          for (const doc of absorbDocs) {
            const rewritten = rewrittenHashes.get(String(doc._id));
            await attacks.updateOne({ _id: doc._id, _deleted: { $ne: true } }, {
              $set: {
                _deleted: true,
                _deletedReason: `Duplicate of ${pair.keep}. ${pair.reason}${rewritten ? ` Original hash: ${doc.hash}.` : ""}`,
                _deletedAt: new Date(),
                _deletedBy: ACTOR,
                updatedAt: new Date(),
                ...(rewritten ? { hash: rewritten } : {}),
              },
            }, { session });
          }
          for (const doc of tombstones) {
            for (const link of doc.chain) {
              if (!await attacks.findOne({ _id: link.id, _deleted: true, _deletedReason: link.reason }, { session })) throw new Error(`${String(link.id)}: duplicate ancestry changed during retarget`);
            }
            const result = await attacks.updateOne({ _id: doc.id, _deleted: true, _deletedReason: doc.reason }, {
              $set: { _deletedReason: `Duplicate of ${pair.keep}. Previously merged through ${doc.priorTarget}. ${doc.reason}`, updatedAt: new Date() },
            }, { session });
            if (result.modifiedCount !== 1) throw new Error(`${String(doc.id)}: tombstone changed during retarget`);
          }
          await attacks.updateOne({ _id: keepId, _deleted: { $ne: true } }, { $set: update }, { session });
        });
      } finally {
        await session.endSession();
      }
      if (rewrittenHashes.size) console.log(`  rewrote ${rewrittenHashes.size} absorbed hash(es) to free the survivor identity`);
      activeAfter -= absorbDocs.filter((doc) => doc._deleted !== true).length;
      console.log(`APPLIED ${pair.keep} (absorbed ${absorbDocs.length})`);
    }
  }

  if (apply) {
    const absorbMap = new Map<string, string>();
    for (const entry of plans) {
      for (const doc of entry.absorbDocs) absorbMap.set(String(doc._id), entry.pair.keep);
    }
    if (absorbMap.size) {
      const reviews = mongoose.connection.db!.collection("incident_reviews");
      const now = new Date();
      let resolvedPairs = 0;
      let retargeted = 0;
      for (const [absorbedId, survivorId] of absorbMap) {
        // Only the exact pair being merged is settled, in either orientation.
        // A review comparing the absorbed record with a third incident is not.
        const resolved = await reviews.updateMany(
          { kind: "duplicate", status: "pending", $or: [
            { "sourceEvidence.existingId": survivorId, "sourceEvidence.candidateId": absorbedId },
            { "sourceEvidence.existingId": absorbedId, "sourceEvidence.candidateId": survivorId },
          ] },
          { $set: {
            status: "resolved",
            reviewedAt: now,
            reviewedBy: ACTOR,
            dispositionNote: `Resolved by the merge of ${absorbedId} into ${survivorId}.`,
            nextRetryAt: null,
            retryable: false,
            updatedAt: now,
          } },
        );
        resolvedPairs += resolved.modifiedCount;
        // Retarget every remaining pending reference, including held leads
        // with a missing or null candidate ID and stored pairs with a third
        // incident. Their identity has not been adjudicated by this merge.
        const existingRetarget = await reviews.updateMany(
          { kind: "duplicate", status: "pending", "sourceEvidence.existingId": absorbedId },
          { $set: { "sourceEvidence.existingId": survivorId, updatedAt: now } },
        );
        const candidateRetarget = await reviews.updateMany(
          { kind: "duplicate", status: "pending", "sourceEvidence.candidateId": absorbedId },
          { $set: { "sourceEvidence.candidateId": survivorId, updatedAt: now } },
        );
        retargeted += existingRetarget.modifiedCount + candidateRetarget.modifiedCount;
      }
      console.log(`Resolved ${resolvedPairs} settled pair review row(s); retargeted ${retargeted} held candidate(s) to their survivor.`);
    }
  }

  const snapshotAfter = await attacks
    .find({ _id: { $in: [...touchedIds].map((id) => new ObjectId(id)) } })
    .toArray();
  fs.writeFileSync(path.join(artifacts, "snapshot-after.json"), JSON.stringify(snapshotAfter, null, 2));

  const actualActive = await attacks.countDocuments({ _deleted: { $ne: true } });
  const validation: string[] = [];
  for (const pair of pairs) {
    const keep = await attacks.findOne({ _id: new ObjectId(pair.keep) });
    const absorbDocs = await attacks.find({ _id: { $in: pair.absorb.map((id) => new ObjectId(id)) } }).toArray();
    if (!keep || keep._deleted === true) validation.push(`${pair.keep}: survivor is missing or soft-deleted`);
    if (apply) {
      for (const doc of absorbDocs) {
        if (doc._deleted !== true) validation.push(`${String(doc._id)}: not soft-deleted`);
        else if (!doc._deletedReason) validation.push(`${String(doc._id)}: missing _deletedReason`);
      }
    }
  }
  const duplicateHashes = await attacks.aggregate([
    { $match: { _deleted: { $ne: true } } },
    { $group: { _id: "$hash", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]).toArray();
  if (duplicateHashes.length) validation.push(`${duplicateHashes.length} active hash collision(s)`);
  if (apply && actualActive !== activeAfter) validation.push(`active count ${actualActive}, expected ${activeAfter}`);

  if (apply) {
    try {
      await assertActiveAttackDateIntegrity("Duplicate reconciliation");
      validation.push("date integrity: PASS");
    } catch (error) {
      validation.push(`date integrity: FAIL ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const summary = {
    mode: apply ? "apply" : "dry-run",
    artifacts,
    activeBefore,
    activeAfter: actualActive,
    pairs: plans.map((entry) => entry.plan),
    validation,
  };
  fs.writeFileSync(path.join(artifacts, "summary.json"), JSON.stringify(summary, null, 2));
  console.log(`\nActive records ${apply ? "after" : "(dry run)"}: ${actualActive}`);
  console.log(`Validation: ${validation.length ? validation.join("; ") : "PASS"}`);

  await mongoose.disconnect();
  if (validation.some((entry) => !entry.endsWith("PASS") && !entry.includes("PASS"))) process.exit(1);
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
