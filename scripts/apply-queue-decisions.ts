/**
 * Apply adjudicated decisions to the held duplicate leads that are already in
 * `incident_reviews` (unlike the backfill ledger, each one is a real row).
 *
 *   same_event, no toll conflict -> attach the source to the record and resolve
 *   same_event, toll conflict, no claim link -> dismiss with the reason
 *   promote -> run promote-review-lead on the row; a guard refusal becomes an
 *              attach to the blocking record and the row is resolved
 *   dismiss -> dismiss with the recorded reason
 *
 * Dry run by default. `--apply` writes.
 *
 *   npx tsx scripts/apply-queue-decisions.ts --decisions scratch/backfill/queue/decisions.jsonl --queue scratch/backfill/queue/duplicates.json --out scratch/backfill/queue/apply-report.json
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import mongoose from "mongoose";

const arg = (name: string, fallback?: string) => {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
};

const ACTOR = "backfill-adjudication";

function readLines(file: string): Array<Record<string, any>> {
  return fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

const normUrl = (value: string) => String(value || "").replace(/\/$/, "").toLowerCase();

async function main() {
  const decisionsFile = arg("decisions");
  const queueFile = arg("queue");
  const outFile = arg("out", "scratch/backfill/queue/apply-report.json");
  if (!decisionsFile || !queueFile) throw new Error("--decisions and --queue are required");
  const apply = process.argv.includes("--apply");
  const dismissUnplaceable = process.argv.includes("--dismiss-unplaceable");

  const decisions = readLines(decisionsFile);
  const queue = new Map<string, Record<string, any>>();
  for (const row of JSON.parse(fs.readFileSync(queueFile, "utf8").replace(/^\uFEFF/, ""))) queue.set(row.reviewId, row);

  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not set");
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15_000 });
  const Attack = (await import("../src/lib/models/Attack")).default;
  const IncidentReview = (await import("../src/lib/models/IncidentReview")).default;

  const report = { reviewed: decisions.length, attached: 0, alreadyPresent: 0, resolved: 0, dismissed: 0, promoted: 0, blockedAttached: 0, failed: [] as Array<{ id: string; error: string }> };

  for (const decision of decisions) {
    const item = queue.get(decision.reviewId || "");
    if (!item) { report.failed.push({ id: decision.id, error: "queue row not found in the export" }); continue; }
    const review = await IncidentReview.findById(item.reviewId).lean() as Record<string, any> | null;
    if (!review || review.status !== "pending") continue;

    if (decision.verdict === "promote") {
      if (!apply) { report.promoted += 1; continue; }
      const run = spawnSync(`npx tsx scripts/promote-review-lead.ts --review ${item.reviewId} --apply`, { shell: true, encoding: "utf8" });
      const output = `${run.stdout || ""}${run.stderr || ""}`;
      const inserted = output.match(/Inserted ([a-f0-9]{24})/);
      if (run.status === 0 && inserted) { report.promoted += 1; continue; }
      const blocked = output.match(/(?:Nearby active record already covers this place and date|An active record already has this identity): ([a-f0-9]{24})/);
      if (blocked) {
        await attach(item, blocked[1]);
        await resolveRow(item.reviewId, `Held candidate was already recorded as ${blocked[1]}; its source was attached instead of inserting a duplicate.`);
        report.blockedAttached += 1;
        continue;
      }
      // An automatic pass cannot leave a state-only lead pending forever. It is
      // dismissed with the reason so the ledger keeps it and a person can revisit.
      if (dismissUnplaceable && /no usable settlement or LGA/.test(output)) {
        if (apply) {
          await dismissRow(item.reviewId, "The article does not name a settlement or LGA for this event, so no placed record can be created. Retained in the source ledger.");
          report.dismissed += 1;
        }
        continue;
      }
      report.failed.push({ id: decision.id, error: output.slice(-300) });
      continue;
    }

    if (decision.verdict === "dismiss") {
      if (apply) { await dismissRow(item.reviewId, decision.dismissalReason || "Distinct from the stored record; no separate record created."); report.dismissed += 1; }
      continue;
    }

    if (decision.verdict !== "same_event") { report.failed.push({ id: decision.id, error: `unknown verdict ${decision.verdict}` }); continue; }

    const evidence = decision.evidence || {};
    const linked = Boolean(evidence.linkage?.linked);
    const k = evidence.candidateTolls?.killed; const ek = evidence.existingTolls?.killed;
    const kid = evidence.candidateTolls?.kidnapped; const ekid = evidence.existingTolls?.kidnapped;
    const conflict = (Number.isFinite(k) && Number.isFinite(ek) && Math.abs(k - ek) > 1)
      || (Number.isFinite(kid) && Number.isFinite(ekid) && Math.abs(kid - ekid) > 1);

    if (!linked && conflict) {
      if (apply) { await dismissRow(item.reviewId, "Toll conflict without a claim link; the other article was read and did not settle the count. No record changed."); report.dismissed += 1; }
      continue;
    }

    if (!apply) { report.attached += 1; continue; }
    const existing = await Attack.findById(decision.existingId).lean() as Record<string, any> | null;
    if (!existing || existing._deleted) { await dismissRow(item.reviewId, "The stored record this lead was compared with no longer exists as an active record."); report.dismissed += 1; continue; }
    const attached = await attach(item, String(existing._id));
    await resolveRow(item.reviewId, `Same event as ${String(existing._id)}: the candidate source was attached as corroboration; identity and toll unchanged.`);
    report.resolved += 1;
    if (attached) report.attached += 1; else report.alreadyPresent += 1;
  }

  async function attach(item: Record<string, any>, recordId: string): Promise<boolean> {
    const record = await Attack.findById(recordId).lean() as Record<string, any> | null;
    if (!record || record._deleted) return false;
    if ((record.sources || []).some((source: Record<string, any>) => normUrl(source.url) === normUrl(item.url))) return false;
    await Attack.updateOne({ _id: recordId, _deleted: { $ne: true }, "sources.url": { $ne: item.url } }, {
      $push: { sources: { url: item.url, title: String(item.title || ""), publisher: "", publishedAt: null } },
    });
    return true;
  }

  async function resolveRow(reviewId: string, note: string) {
    await IncidentReview.updateOne({ _id: reviewId, status: "pending" }, { $set: {
      status: "resolved", reviewedAt: new Date(), reviewedBy: ACTOR, dispositionNote: note, nextRetryAt: null, retryable: false, updatedAt: new Date(),
    } });
  }

  async function dismissRow(reviewId: string, note: string) {
    await IncidentReview.updateOne({ _id: reviewId, status: "pending" }, { $set: {
      status: "dismissed", reviewedAt: new Date(), reviewedBy: ACTOR, dispositionNote: note.slice(0, 2000), nextRetryAt: null, retryable: false, updatedAt: new Date(),
    } });
  }

  fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify({ ranAt: new Date().toISOString(), apply, ...report }, null, 2));
  console.log(JSON.stringify({ mode: apply ? "APPLY" : "DRY RUN", ...report }, null, 2));
  if (apply) console.log("pending duplicates now", await IncidentReview.countDocuments({ status: "pending", kind: "duplicate" }));
  await mongoose.disconnect();
}

main().catch((error) => { console.error("FATAL", error); process.exitCode = 1; });
