/**
 * Audit active records that share a source URL with another record.
 *
 * A roundup article legitimately supports several records, so a shared URL is not a
 * defect. The defect is a record whose own evidence does not name its own settlement:
 * that means its date, place or toll was grounded by a sentence belonging to a
 * different attack in the same article.
 *
 * Read-only. It reports what it finds and writes an artifact; it never edits records.
 *
 *   npx tsx scripts/audit-shared-source-records.ts
 *   npx tsx scripts/audit-shared-source-records.ts --out <dir>
 */

import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";

dotenv.config({ path: ".env.local" });

const normalize = (value: unknown) =>
  String(value ?? "").toLowerCase().replace(/[^\p{L}\p{N} ]+/gu, " ").replace(/\s+/g, " ").trim();

const containsPlace = (quote: string, place: string) => {
  const q = ` ${normalize(quote)} `;
  const p = normalize(place);
  return p.length > 2 && q.includes(` ${p} `);
};

async function main() {
  const outIndex = process.argv.indexOf("--out");
  const outDir = outIndex >= 0 ? process.argv[outIndex + 1] : null;

  const { default: mongoose } = await import("mongoose");
  await mongoose.connect(process.env.MONGODB_URI as string, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;

  const records = await db.collection("attacks")
    .find({ _deleted: { $ne: true } })
    .project({ title: 1, date: 1, dateEvidence: 1, location: 1, sources: 1, casualtyMeta: 1, tags: 1 })
    .toArray();

  const byUrl = new Map<string, typeof records>();
  for (const record of records) {
    for (const source of record.sources || []) {
      const url = String(source.url || "").replace(/[?#].*$/, "");
      if (!url) continue;
      if (!byUrl.has(url)) byUrl.set(url, []);
      byUrl.get(url)!.push(record);
    }
  }

  const findings: Array<Record<string, unknown>> = [];
  let sharedUrls = 0;
  let recordsOnShared = 0;

  for (const [url, group] of byUrl) {
    if (group.length < 2) continue;
    sharedUrls += 1;
    const towns = new Set(group.map((record) => normalize(record.location?.town)).filter((town) => town && town !== "unknown"));
    if (towns.size < 2) continue;

    for (const record of group) {
      recordsOnShared += 1;
      const ownTown = normalize(record.location?.town);
      const ownLga = normalize(record.location?.lga);
      const quotes = [
        ["date", String(record.dateEvidence || "")],
        ["location", String(record.location?.notes || "").replace(/^event location supported by source text:\s*/i, "")],
        ...Object.entries(record.casualtyMeta || {}).map(([field, meta]) => [field, String((meta as { sourceText?: string })?.sourceText || "")]),
      ].filter(([, quote]) => quote) as Array<[string, string]>;

      const unanchored = quotes.filter(([, quote]) => !containsPlace(quote, ownTown) && !containsPlace(quote, ownLga));
      if (unanchored.length) {
        findings.push({
          recordId: String(record._id),
          title: record.title,
          state: record.location?.state,
          lga: record.location?.lga,
          town: record.location?.town,
          precision: record.location?.precision,
          url,
          siblings: group.length,
          unanchored: unanchored.map(([field, quote]) => ({ field, quote: quote.slice(0, 160) })),
        });
      }
    }
  }

  console.log(JSON.stringify({
    activeRecords: records.length,
    sharedUrls,
    recordsOnSharedUrls: recordsOnShared,
    recordsWithUnanchoredEvidence: findings.length,
  }, null, 1));

  for (const finding of findings.slice(0, 10)) {
    console.log(`  ${finding.recordId} | ${String(finding.title).slice(0, 50)} | ${finding.town} | ${(finding.unanchored as Array<{ field: string }>).map((item) => item.field).join(",")}`);
  }

  if (outDir) {
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(path.join(outDir, "shared-source-audit.json"), JSON.stringify({ generatedAt: new Date().toISOString(), findings }, null, 2));
    console.log(`artifact: ${outDir}`);
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
