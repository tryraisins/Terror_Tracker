/**
 * Apply adjudicated backfill decisions. Dry run by default.
 *
 * Pair decisions produce a `merge-incidents` pair file; this script never
 * merges records itself.
 *
 * Held decisions do one of two things:
 *   - same_event: attach the candidate's source URL to the surviving record, so
 *     the corroboration is not lost, and leave the identity and toll untouched;
 *   - promote: create the review row that `promote-review-lead.ts` expects, so
 *     the insertion still goes through that audited path (hash uniqueness and
 *     the nearby place/date guard both run there).
 *
 * Usage:
 *   npx tsx scripts/apply-backfill-decisions.ts --pairs scratch/.../pairs.jsonl --out scratch/.../merge-pairs.json
 *   npx tsx scripts/apply-backfill-decisions.ts --held scratch/.../held.jsonl --held-data scratch/backfill/held/held.json --out scratch/.../promotions.json          # dry run
 *   npx tsx scripts/apply-backfill-decisions.ts --held ... --apply
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

function arg(name: string, fallback?: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function readJsonl(file: string): Array<Record<string, any>> {
  return fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function normUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) if (/^(utm_|fbclid|gclid|ref|output|amp)/i.test(key)) url.searchParams.delete(key);
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch { return String(value || "").trim().replace(/\/$/, "").toLowerCase(); }
}

async function main() {
  const pairsFile = arg("pairs");
  const heldFile = arg("held");
  const out = arg("out");
  const apply = process.argv.includes("--apply");
  if (!out) throw new Error("--out is required");

  if (pairsFile) {
    const decisions = readJsonl(pairsFile);
    const merges = decisions.filter((row) => row.verdict === "merge");
    // Merge gate, tightened after review: a claim link must include a full
    // person name, and both sides must not state materially different tolls.
    // A single common first name and a 7-vs-2 casualty gap are not identity.
    const eligible: Array<Record<string, any>> = [];
    const excluded = new Set(String(arg("exclude", "") || "").split(",").map((value) => value.trim()).filter(Boolean));
    const downgraded: Array<{ id: string; reason: string }> = [];
    for (const row of merges) {
      if (excluded.has(row.id)) { downgraded.push({ id: row.id, reason: "excluded by reviewer decision" }); continue; }
      const evidence = row.evidence || {};
      const fullName = (evidence.linkage?.evidence || []).some((item: string) => String(item).startsWith("person-full:"));
      const keepTolls = evidence.tolls?.keep || {};
      const absorbTolls = evidence.tolls?.absorb || {};
      const conflict = (field: string) => {
        const left = keepTolls[field];
        const right = absorbTolls[field];
        return Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) > 1;
      };
      const tollConflict = conflict("killed") || conflict("kidnapped");
      if (!fullName) { downgraded.push({ id: row.id, reason: "link is a single person token, not a full name" }); continue; }
      if (tollConflict) { downgraded.push({ id: row.id, reason: "both sides state materially different tolls" }); continue; }
      eligible.push(row);
    }
    const pairs = eligible.map((row) => ({
      keep: row.keepId,
      absorb: [row.absorbId],
      reason: (row.reasons || []).join(" | "),
    }));
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(pairs, null, 2));
    const kept = decisions.length - merges.length;
    console.log(JSON.stringify({ decisions: decisions.length, proposedMerge: merges.length, eligibleMerge: eligible.length, downgraded, keepSeparate: kept, out }, null, 2));
    return;
  }

  if (!heldFile) throw new Error("--pairs or --held is required");
  const heldData = arg("held-data");
  if (!heldData) throw new Error("--held-data is required");
  const decisions = readJsonl(heldFile);
  const held = JSON.parse(fs.readFileSync(heldData, "utf8").replace(/^\uFEFF/, ""));
  const byHash = new Map<string, Record<string, any>>();
  for (const row of held) if (row.candidateHash) byHash.set(row.candidateHash, row);

  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI set required");
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15_000 });
  const Attack = (await import("../src/lib/models/Attack")).default;
  const IncidentReview = (await import("../src/lib/models/IncidentReview")).default;
  const { createIncidentReviewKey, normalizeIncidentReviewSourceUrl } = await import("../src/lib/models/IncidentReview");

  const report = { sameEvent: 0, sourcesAttached: 0, alreadyPresent: 0, promoteRows: 0, dismissed: 0, dismissals: [] as Array<{ id: string; reason: string }>, blocked: [] as Array<{ id: string; reason: string }>, promotions: [] as Array<Record<string, unknown>> };

  for (const decision of decisions) {
    if (decision.verdict === "dismiss") {
      report.dismissed += 1;
      report.dismissals.push({ id: decision.id, reason: String(decision.dismissalReason || "reviewed and not promoted") });
      continue;
    }
    if (decision.verdict === "same_event") {
      report.sameEvent += 1;
      const record = await Attack.findById(decision.existingId).lean() as Record<string, any> | null;
      if (!record || record._deleted) { report.blocked.push({ id: decision.id, reason: "surviving record is missing or deleted" }); continue; }
      const url = String(decision.url || "");
      if (!/^https?:\/\//i.test(url)) { report.blocked.push({ id: decision.id, reason: "candidate has no usable source URL" }); continue; }
      const present = (record.sources || []).some((source: Record<string, any>) => normUrl(String(source.url)) === normUrl(url));
      if (present) { report.alreadyPresent += 1; continue; }
      if (apply) {
        const updated = await Attack.updateOne(
          { _id: record._id, _deleted: { $ne: true }, "sources.url": { $ne: url } },
          { $push: { sources: { url, title: String(decision.evidence?.candidateTitle || ""), publisher: "", publishedAt: null } } },
        );
        if (updated.modifiedCount) report.sourcesAttached += 1;
        else report.blocked.push({ id: decision.id, reason: "source attach did not modify the record" });
      }
      continue;
    }

    if (decision.verdict !== "promote") { report.blocked.push({ id: decision.id, reason: `unknown verdict ${decision.verdict}` }); continue; }

    const source = byHash.get(decision.candidateHash || decision.id);
    const rawCandidate = source?.candidate;
    if (!rawCandidate) { report.blocked.push({ id: decision.id, reason: "candidate payload not found" }); continue; }
    // A location rescued from the article lives on the decision, not on the
    // original ledger row, so the promotion uses the rescued settlement.
    const rescued = decision.evidence?.candidateLocation;
    const candidate = rescued ? { ...rawCandidate, location: rescued } : rawCandidate;
    const url = String(decision.url || source?.url || "");
    if (!/^https?:\/\//i.test(url)) { report.blocked.push({ id: decision.id, reason: "candidate has no usable source URL" }); continue; }
    const town = String(candidate.location?.town || "");
    const lga = String(candidate.location?.lga || "");
    const placeholder = (value: string) => !value || /^(?:unknown|unspecified|n\/?a|multiple|various)$/i.test(value);
    if (placeholder(town) && placeholder(lga)) {
      report.blocked.push({ id: decision.id, reason: "candidate has neither a settlement nor an LGA, so it cannot be placed" });
      continue;
    }
    const reviewKey = createIncidentReviewKey({ sourceUrl: url, kind: "duplicate", reason: `Backfill hold review ${decision.existingId || "none"}` });
    report.promoteRows += 1;
    report.promotions.push({ id: decision.id, reviewKey, url, title: candidate.title });
    if (!apply) continue;
    await IncidentReview.updateOne({ reviewKey }, {
      $set: {
        title: String(candidate.title || "").slice(0, 500),
        publisher: "",
        reason: `Backfill hold review ${decision.existingId || "none"}`.slice(0, 2000),
        lastSeenAt: new Date(),
        state: String(candidate.location?.state || "Unknown").slice(0, 100),
        publishedAt: null,
        sourceEvidence: { existingId: decision.existingId || "" },
        candidates: [candidate],
      },
      $setOnInsert: { sourceUrl: normalizeIncidentReviewSourceUrl(url), kind: "duplicate", status: "pending", attempts: 0, retryable: false, nextRetryAt: null },
    }, { upsert: true });
  }

  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ mode: apply ? "APPLY" : "DRY RUN", ...report, promotions: report.promotions.length }, null, 2));
  await mongoose.disconnect();
}

main().catch((error) => { console.error("FATAL", error); process.exitCode = 1; });
