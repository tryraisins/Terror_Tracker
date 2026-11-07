/**
 * Automatic duplicate-queue pass. Runs after a scan so held leads do not
 * accumulate: export the pending held duplicate leads, adjudicate them against
 * the stored record they collided with, then apply the decisions.
 *
 * Bounded on purpose: `--limit` caps how many rows one run touches, because
 * each row costs two article fetches and a model call. Anything it cannot
 * decide stays pending for the next run.
 *
 *   npx tsx scripts/drain-duplicate-queue.ts --limit 12
 *   npx tsx scripts/drain-duplicate-queue.ts --limit 12 --apply
 *
 * Exit status is 0 unless the export or a child process itself fails; a queue
 * problem must never turn a healthy scan into a failed one.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import mongoose from "mongoose";

const arg = (name: string, fallback?: string) => {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
};

async function main() {
  const limit = Math.max(1, Math.min(50, Number(arg("limit", "12"))));
  const apply = process.argv.includes("--apply");
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not set");

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const preferred = process.env.SCAN_QUEUE_DRAIN_DIR || "/var/log/terror-tracker/queue-drain";
  const candidates = [
    path.join(preferred, stamp),
    path.join("scratch", "queue-drain", stamp),
    path.join(os.tmpdir(), "queue-drain", stamp),
  ];
  let outDir = candidates[candidates.length - 1];
  let ready = false;
  for (const dir of candidates) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      outDir = dir;
      ready = true;
      break;
    } catch {
      // try the next writable location
    }
  }
  if (!ready) throw new Error("no writable directory for queue-drain artifacts");

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15_000 });
  const IncidentReview = (await import("../src/lib/models/IncidentReview")).default;

  const rows = await IncidentReview.find({ status: "pending", kind: "duplicate" })
    .select("sourceUrl title reason candidates sourceEvidence")
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();

  const queue = rows
    .filter((row) => row.candidates?.length === 1 && !row.sourceEvidence?.candidateId)
    .map((row) => ({
      reviewId: String(row._id),
      url: row.sourceUrl,
      title: row.title || row.candidates?.[0]?.title || "",
      reason: row.reason,
      existingId: row.sourceEvidence?.existingId || null,
      candidateHash: crypto.createHash("sha256").update(String(row._id)).digest("hex"),
      candidate: row.candidates?.[0],
    }));

  const summary: Record<string, unknown> = { ranAt: new Date().toISOString(), apply, limit, pending: rows.length, exportable: queue.length, outDir };
  if (!queue.length) {
    fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
    console.log("queue drain: nothing pending");
    await mongoose.disconnect();
    return;
  }

  const queueFile = path.join(outDir, "duplicates.json");
  const decisionsFile = path.join(outDir, "decisions.jsonl");
  const reportFile = path.join(outDir, "apply-report.json");
  fs.writeFileSync(queueFile, JSON.stringify(queue, null, 2));

  const adjudicate = spawnSync(`npx tsx scripts/adjudicate-backfill.ts --held ${queueFile} --out ${decisionsFile}`, { shell: true, encoding: "utf8", timeout: 20 * 60_000, killSignal: "SIGKILL" });
  summary.adjudication = { status: adjudicate.status, tail: `${adjudicate.stdout || ""}${adjudicate.stderr || ""}`.split(/\r?\n/).filter(Boolean).slice(-4) };
  if (adjudicate.status !== 0) {
    fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
    console.error("queue drain: adjudication failed; rows stay pending");
    await mongoose.disconnect();
    process.exitCode = 1;
    return;
  }

  const applier = spawnSync(`npx tsx scripts/apply-queue-decisions.ts --decisions ${decisionsFile} --queue ${queueFile} --out ${reportFile} ${apply ? "--apply --dismiss-unplaceable" : ""}`.trim(), { shell: true, encoding: "utf8", timeout: 25 * 60_000, killSignal: "SIGKILL" });
  summary.applied = { status: applier.status, tail: `${applier.stdout || ""}${applier.stderr || ""}`.split(/\r?\n/).filter(Boolean).slice(-6) };
  if (applier.status !== 0) summary.warning = "applier exited non-zero; inspect apply-report.json";

  summary.pendingAfter = await IncidentReview.countDocuments({ status: "pending", kind: "duplicate" });
  fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("queue drain failed:", error instanceof Error ? error.message : error);
  await mongoose.disconnect().catch(() => undefined);
  process.exitCode = 1;
});
