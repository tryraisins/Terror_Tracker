/**
 * Run the adjudicated promotions one at a time through the audited
 * `promote-review-lead.ts`, and turn a guard refusal into a source attach.
 *
 * A promote can be refused for two reasons that both mean "already recorded":
 *   - a nearby active record covers the same place and date;
 *   - an active record already has this identity hash.
 * In both cases the candidate's source is attached to the blocking record, the
 * review row is resolved with a note naming it, and no second record is created.
 * Any other failure leaves the row pending and is reported.
 *
 *   npx tsx scripts/run-backfill-promotions.ts --report scratch/.../held-apply-report.json --decisions scratch/.../held-apply.jsonl
 *   npx tsx scripts/run-backfill-promotions.ts --report ... --decisions ... --apply
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import mongoose from "mongoose";
import { placesPlausiblySame, sameLga } from "../src/lib/location-identity";

const arg = (name: string, fallback?: string) => {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
};

const placeholder = (value: string) => !value || /^(?:unknown|unspecified|n\/?a|multiple|various)$/i.test(value);

function readLines(file: string): Array<Record<string, any>> {
  return fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

async function main() {
  const reportFile = arg("report");
  const decisionsFile = arg("decisions");
  if (!reportFile || !decisionsFile) throw new Error("--report and --decisions are required");
  const apply = process.argv.includes("--apply");
  const outFile = arg("out", "scratch/backfill/adjudication/promotion-outcomes.json");

  const report = JSON.parse(fs.readFileSync(reportFile, "utf8"));
  const decisions = new Map<string, Record<string, any>>();
  for (const row of readLines(decisionsFile)) decisions.set(row.id, row);

  const rows = (report.promotions || []).map((row: Record<string, any>) => {
    const decision = decisions.get(row.id);
    const loc = decision?.evidence?.candidateLocation || {};
    return { ...row, date: new Date(decision?.evidence?.candidateDate), state: loc.state, lga: loc.lga, town: loc.town };
  }).filter((row: Record<string, any>) => !Number.isNaN(row.date.getTime()));

  // Collapse promotes that describe the same place within 2.5 days before the
  // tool runs; the ±1 day guard alone would let a 2-day pair insert twice.
  const groups: Array<{ keep: Record<string, any>; duplicates: Array<Record<string, any>> }> = [];
  for (const row of rows.sort((a: Record<string, any>, b: Record<string, any>) => a.date.getTime() - b.date.getTime())) {
    const group = groups.find((item) => item.keep.state === row.state
      && Math.abs(item.keep.date.getTime() - row.date.getTime()) <= 2.5 * 86_400_000
      && (placeholder(item.keep.town)
        ? sameLga(item.keep.lga, row.lga)
        : placesPlausiblySame(item.keep.town, row.town)));
    if (group) group.duplicates.push(row);
    else groups.push({ keep: row, duplicates: [] });
  }

  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not set");
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15_000 });
  const Attack = (await import("../src/lib/models/Attack")).default;
  const IncidentReview = (await import("../src/lib/models/IncidentReview")).default;

  const outcomes: Array<Record<string, any>> = [];
  console.log(`${apply ? "APPLY" : "DRY RUN"}: ${rows.length} promotions, ${groups.length} to run, ${rows.length - groups.length} collapsed as internal duplicates`);

  for (const group of groups) {
    const review = await IncidentReview.findOne({ reviewKey: group.keep.reviewKey }).lean() as Record<string, any> | null;
    if (!review) { outcomes.push({ id: group.keep.id, outcome: "review row missing" }); continue; }
    if (!apply) {
      outcomes.push({ id: group.keep.id, title: group.keep.title, outcome: "would promote", duplicates: group.duplicates.length });
      continue;
    }
    const run = spawnSync("npx tsx scripts/promote-review-lead.ts --review " + String(review._id) + " --apply", { shell: true, encoding: "utf8" });
    const output = `${run.stdout || ""}${run.stderr || ""}`;
    const inserted = output.match(/Inserted ([a-f0-9]{24})/);
    if (run.status === 0 && inserted) {
      outcomes.push({ id: group.keep.id, outcome: "inserted", recordId: inserted[1], duplicates: group.duplicates.length });
      // Collapsed duplicates attach to the record just inserted.
      for (const duplicate of group.duplicates) await attach(duplicate, inserted[1], "same place and date within the promotion batch");
      continue;
    }
    const blocked = output.match(/(?:Nearby active record already covers this place and date|An active record already has this identity): ([a-f0-9]{24})/);
    if (blocked) {
      await attach(group.keep, blocked[1], "promote guard refused a second record");
      for (const duplicate of group.duplicates) await attach(duplicate, blocked[1], "same place and date within the promotion batch");
      await IncidentReview.updateOne({ _id: review._id }, { $set: {
        status: "resolved", reviewedAt: new Date(), reviewedBy: "backfill-promotion",
        dispositionNote: `Held candidate was already recorded as ${blocked[1]}; its source was attached instead of inserting a duplicate.`,
        nextRetryAt: null, retryable: false,
      } });
      outcomes.push({ id: group.keep.id, outcome: "attached to existing record", recordId: blocked[1] });
      continue;
    }
    outcomes.push({ id: group.keep.id, outcome: "failed", detail: output.slice(-400) });
    console.log(`FAILED ${group.keep.id}: ${output.slice(-200)}`);
  }

  async function attach(row: Record<string, any>, recordId: string, reason: string) {
    if (!row.url) return;
    const record = await Attack.findById(recordId).lean() as Record<string, any> | null;
    if (!record || record._deleted) return;
    const exists = (record.sources || []).some((source: Record<string, any>) => String(source.url).replace(/\/$/, "") === String(row.url).replace(/\/$/, ""));
    if (exists) return;
    await Attack.updateOne({ _id: recordId, _deleted: { $ne: true }, "sources.url": { $ne: row.url } }, {
      $push: { sources: { url: row.url, title: String(row.title || ""), publisher: "", publishedAt: null } },
    });
    outcomes.push({ id: row.id, outcome: "source attached", recordId, reason });
  }

  fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify({ ranAt: new Date().toISOString(), apply, rows: rows.length, groups: groups.length, outcomes }, null, 2));
  const counts = outcomes.reduce((acc: Record<string, number>, row) => { acc[row.outcome] = (acc[row.outcome] || 0) + 1; return acc; }, {});
  console.log(JSON.stringify({ counts, outFile }, null, 2));
  await mongoose.disconnect();
}

main().catch((error) => { console.error("FATAL", error); process.exitCode = 1; });
