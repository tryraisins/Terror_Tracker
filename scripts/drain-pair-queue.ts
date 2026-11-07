/**
 * Automatic stored-pair pass for the duplicate queue.
 *
 * A stored-pair row holds two records. The held-lead drain cannot decide those,
 * which is why they accumulated. This pass adjudicates them with claim linkage
 * and closes the row:
 *   - eligible merge -> `merge-incidents` (full-name link, no material toll gap)
 *   - otherwise -> dismissed as distinct events, both records retained
 *
 * Bounded: each pair costs two article fetches plus model calls.
 *
 *   npx tsx scripts/drain-pair-queue.ts --limit 6
 *   npx tsx scripts/drain-pair-queue.ts --limit 6 --apply
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import mongoose from "mongoose";

const arg = (name: string, fallback?: string) => {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
};

function readLines(file: string): Array<Record<string, any>> {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function eligible(row: Record<string, any>): boolean {
  const evidence = row.evidence || {};
  const fullName = (evidence.linkage?.evidence || []).some((item: string) => String(item).startsWith("person-full:"));
  const keepTolls = evidence.tolls?.keep || {};
  const absorbTolls = evidence.tolls?.absorb || {};
  const conflict = (field: string) => {
    const left = keepTolls[field];
    const right = absorbTolls[field];
    return Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) > 1;
  };
  return fullName && !conflict("killed") && !conflict("kidnapped");
}

async function main() {
  const limit = Math.max(1, Math.min(20, Number(arg("limit", "6"))));
  const apply = process.argv.includes("--apply");
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not set");

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const candidates = [
    path.join(process.env.SCAN_QUEUE_DRAIN_DIR || "/var/log/terror-tracker/queue-drain", `pairs-${stamp}`),
    path.join("scratch", "queue-drain", `pairs-${stamp}`),
    path.join(os.tmpdir(), "queue-drain", `pairs-${stamp}`),
  ];
  let outDir = candidates[candidates.length - 1];
  for (const dir of candidates) {
    try { fs.mkdirSync(dir, { recursive: true }); outDir = dir; break; } catch { /* next */ }
  }

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15_000 });
  const IncidentReview = (await import("../src/lib/models/IncidentReview")).default;
  const rows = await IncidentReview.find({ status: "pending", kind: "duplicate", "candidates.1": { $exists: true } })
    .select("sourceUrl title reason candidates sourceEvidence")
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();

  if (!rows.length) { console.log("pair drain: nothing pending"); await mongoose.disconnect(); return; }

  const pairsFile = path.join(outDir, "pairs.json");
  const decisionsFile = path.join(outDir, "decisions.jsonl");
  const mergeFile = path.join(outDir, "merge.json");
  const byKey = new Map<string, Record<string, any>>();
  const pairs: Array<{ keep: string; absorb: string[]; reason: string }> = [];

  for (const row of rows) {
    const list = (row.candidates || []).filter((candidate: Record<string, any>) => candidate?._id);
    if (list.length < 2) continue;
    const sorted = [...list].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const keep = String(sorted[0]._id);
    const absorb = String(sorted[1]._id);
    const key = `${keep}|${absorb}`;
    byKey.set(key, row);
    pairs.push({ keep, absorb: [absorb], reason: String(row.reason || "").slice(0, 500) });
  }
  if (!pairs.length) { console.log("pair drain: nothing decidable"); await mongoose.disconnect(); return; }
  fs.writeFileSync(pairsFile, JSON.stringify(pairs, null, 2));

  const adjudicate = spawnSync(`npx tsx scripts/adjudicate-backfill.ts --pairs ${pairsFile} --out ${decisionsFile}`, { shell: true, encoding: "utf8" });
  if (adjudicate.status !== 0) {
    console.error("pair drain: adjudication failed; rows stay pending");
    await mongoose.disconnect();
    process.exitCode = 1;
    return;
  }

  const decisions = readLines(decisionsFile);
  const merges = decisions.filter((row) => row.verdict === "merge" && eligible(row));
  const summary: Record<string, unknown> = { ranAt: new Date().toISOString(), apply, pairs: pairs.length, decisions: decisions.length, eligibleMerges: merges.length, outDir };

  if (apply && merges.length) {
    fs.writeFileSync(mergeFile, JSON.stringify(merges.map((row) => ({ keep: row.keepId, absorb: [row.absorbId], reason: (row.reasons || []).join(" | ") })), null, 2));
    const merge = spawnSync(`npx tsx scripts/merge-incidents.ts --pairs ${mergeFile} --apply`, { shell: true, encoding: "utf8" });
    summary.merge = { status: merge.status, tail: `${merge.stdout || ""}${merge.stderr || ""}`.split(/\r?\n/).filter(Boolean).slice(-4) };
  }

  if (apply) {
    for (const decision of decisions) {
      const row = byKey.get(`${decision.keepId}|${decision.absorbId}`);
      if (!row) continue;
      const merged = merges.some((item) => item.keepId === decision.keepId && item.absorbId === decision.absorbId);
      await IncidentReview.updateOne({ _id: row._id, status: "pending" }, { $set: merged
        ? { status: "resolved", reviewedAt: new Date(), reviewedBy: "backfill-adjudication",
          dispositionNote: `Same event: ${decision.absorbId} absorbed into ${decision.keepId}. ${(decision.reasons || []).slice(0, 2).join("; ")}`,
          nextRetryAt: null, retryable: false, updatedAt: new Date() }
        : { status: "dismissed", reviewedAt: new Date(), reviewedBy: "backfill-adjudication",
          dispositionNote: `Distinct events: both records retained. ${(decision.reasons || []).slice(0, 2).join("; ")}`,
          nextRetryAt: null, retryable: false, updatedAt: new Date() } });
    }
  }

  summary.pendingAfter = await IncidentReview.countDocuments({ status: "pending", kind: "duplicate" });
  fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("pair drain failed:", error instanceof Error ? error.message : error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
