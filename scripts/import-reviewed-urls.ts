/**
 * Import a reviewed URL list through the real extraction and ingest gates.
 *
 * Used for the recall sample's misses: each URL was found independently and
 * verified by hand to be inside the cell. The article still has to support the
 * date, place and toll it is read for; every identity and duplicate gate runs.
 *
 *   npx tsx scripts/import-reviewed-urls.ts --input scratch/recall/misses.json
 *   npx tsx scripts/import-reviewed-urls.ts --input scratch/recall/misses.json --apply
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import mongoose from "mongoose";

const arg = (name: string, fallback?: string) => {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
};

async function main() {
  const input = arg("input");
  if (!input) throw new Error("--input is required");
  const apply = process.argv.includes("--apply");
  const rows = JSON.parse(fs.readFileSync(input, "utf8").replace(/^\uFEFF/, ""));
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not set");
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15_000 });

  const { reextractSearchLedSource, ingestSearchLedAttacks } = await import("../src/lib/search-led-discovery");
  const { normalizeIncidentDate } = await import("../src/lib/incident-date");
  const { assertActiveAttackDateIntegrity } = await import("../src/lib/attack-data-integrity");

  const reachHours = Math.ceil((Date.now() - new Date("2026-01-01T00:00:00Z").getTime()) / 3_600_000) + 24 * 30;
  const candidates: unknown[] = [];
  const report: Array<Record<string, unknown>> = [];

  for (const row of rows) {
    const expected = new Date(`${row.date}T00:00:00Z`).getTime();
    const { attacks } = await reextractSearchLedSource({ url: row.url, title: row.title || "", publisher: row.publisher || "" }, 336, reachHours, { historical: true });
    const matched = attacks.filter((attack) => {
      const normalized = normalizeIncidentDate(attack);
      if (!normalized) return false;
      const gap = Math.abs(normalized.date.getTime() - expected) / 86_400_000;
      return gap <= 3 && attack.location?.state === row.state;
    });
    report.push({ url: row.url, expected: row.date, yielded: attacks.length, matched: matched.length });
    candidates.push(...matched);
    console.log(`${matched.length ? "OK " : "NO "} ${row.date} ${row.state} | ${row.title} -> ${attacks.length} events, ${matched.length} match`);
  }

  let ingest = { inserted: 0, merged: 0, errors: 0, reviewRequired: [] as Array<{ candidateTitle: string; reason: string }> };
  if (apply && candidates.length) {
    await assertActiveAttackDateIntegrity("URL import preflight");
    ingest = await ingestSearchLedAttacks(candidates as never, "RecallSample/misses");
    await assertActiveAttackDateIntegrity("URL import postflight");
  }

  const out = arg("out", "scratch/recall/import-report.json") as string;
  fs.writeFileSync(out, JSON.stringify({ apply, rows: report, inserted: ingest.inserted, merged: ingest.merged, held: ingest.reviewRequired.length, errors: ingest.errors, reviewRequired: ingest.reviewRequired }, null, 2));
  console.log(JSON.stringify({ apply, parsed: report.filter((r) => Number(r.matched) > 0).length, of: report.length, inserted: ingest.inserted, merged: ingest.merged, held: ingest.reviewRequired.length, errors: ingest.errors }, null, 2));
  await mongoose.disconnect();
}

main().catch((error) => { console.error("FATAL", error); process.exitCode = 1; });
