/**
 * Backfill casualty figures that extraction dropped.
 *
 * The DeepSeek verification pass keeps the incident but discards a toll whose quote it
 * cannot ground, and nothing revisited those records afterwards. This re-runs the real
 * extraction path (`reextractSearchLedSource`) against the record's own source article
 * and fills only the fields the record left empty, so a stated toll is never overwritten.
 *
 *   npx tsx scripts/backfill-dropped-tolls.ts                  # dry run, every candidate
 *   npx tsx scripts/backfill-dropped-tolls.ts --ids <id,id>    # dry run, chosen records
 *   npx tsx scripts/backfill-dropped-tolls.ts --apply
 *   npx tsx scripts/backfill-dropped-tolls.ts --reach-hours 8760
 *
 * Candidates are active records whose headline claims a killing and whose casualty
 * fields are empty. Each run writes an artifact under scratch/backfill-dropped-tolls/.
 * The default reach matches the widest scan window, so an article older than that is
 * skipped unless the caller widens it with --reach-hours. A wider reach re-reads history
 * that already produced a record; it never widens the scan itself.
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { isUnknownPlace, lgaCompatible, sameSpecificLocation } from "../src/lib/location-identity";
import { normalizeCasualtyFields } from "../src/lib/incident-uncertainty";

dotenv.config({ path: ".env.local" });

type CasualtyField = "killed" | "injured" | "kidnapped" | "displaced";
const FIELDS: CasualtyField[] = ["killed", "injured", "kidnapped", "displaced"];
const DAY = (value: Date | string) => new Date(value).toISOString().slice(0, 10);
const norm = (value?: string | null) => (value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

interface PlaceLike {
  state?: string | null;
  lga?: string | null;
  town?: string | null;
}

/**
 * Is this re-extracted event the same incident as the record?
 *
 * The strict place rules decide it. A known settlement that differs is never overridden
 * by an LGA that happens to agree, and a known LGA that differs is a rejection too, so a
 * roundup cannot hand this record the other attack's figure. The event day must match, and
 * at least one comparable place field must actually agree.
 */
export function sameIncidentIdentity(
  recordDate: Date | string,
  recordLocation: PlaceLike | undefined,
  event: { date: Date | string; location: PlaceLike },
): boolean {
  if (DAY(event.date) !== DAY(recordDate)) return false;
  if (norm(event.location?.state) !== norm(recordLocation?.state)) return false;
  const townKnown = !isUnknownPlace(recordLocation?.town);
  const lgaKnown = !isUnknownPlace(recordLocation?.lga);
  const candidateTownKnown = !isUnknownPlace(event.location?.town);
  const candidateLgaKnown = !isUnknownPlace(event.location?.lga);
  const townAgrees = townKnown && candidateTownKnown && sameSpecificLocation(recordLocation?.town, event.location?.town);
  if (townKnown && candidateTownKnown && !townAgrees) return false;
  const lgaAgrees = lgaKnown && candidateLgaKnown && lgaCompatible(recordLocation?.lga, event.location?.lga);
  if (lgaKnown && candidateLgaKnown && !lgaAgrees) return false;
  return townAgrees || lgaAgrees;
}

function selfTest() {
  const record = { state: "Plateau", lga: "Jos South", town: "Gero" };
  const event = (over: Partial<PlaceLike> = {}, date = "2026-10-26") => ({ date, location: { ...record, ...over } });
  assert.equal(sameIncidentIdentity("2026-10-26", record, event()), true, "same settlement, LGA and day must match");
  assert.equal(sameIncidentIdentity("2026-10-26", record, event({ town: "Du" })), false, "a different settlement must not match on LGA alone");
  assert.equal(sameIncidentIdentity("2026-10-26", record, event({ lga: "Bassa" })), false, "a different LGA must reject even with the same settlement");
  assert.equal(sameIncidentIdentity("2026-10-26", record, event({}, "2026-10-27")), false, "the next day is a different event");
  assert.equal(sameIncidentIdentity("2026-10-26", record, event({ state: "Kaduna" })), false, "a different state must not match");
  assert.equal(
    sameIncidentIdentity("2026-10-26", { state: "Plateau", lga: "Jos South", town: "Unknown" }, event()),
    true,
    "an unknown settlement may match on a known LGA",
  );
  assert.equal(
    sameIncidentIdentity("2026-10-26", { state: "Plateau", lga: "Unknown", town: "Unknown" }, event()),
    false,
    "a record with no comparable place must not match",
  );
  console.log("PASS backfill identity self-test");
}

interface Entry {
  id: string;
  title: string;
  sourceUrl: string;
  action: "filled" | "skipped";
  reason: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

async function main() {
  if (process.argv.includes("--self-test")) {
    selfTest();
    return;
  }
  const apply = process.argv.includes("--apply");
  const ageArg = process.argv.indexOf("--reach-hours");
  const reachHours = ageArg >= 0 ? Number(process.argv[ageArg + 1]) : 336;
  if (!Number.isFinite(reachHours) || reachHours < 1) throw new Error("--reach-hours must be a positive number");
  const curatedArg = process.argv.indexOf("--curated");
  const curatedPath = curatedArg >= 0 ? process.argv[curatedArg + 1] : "";
  const idsArg = process.argv.indexOf("--ids");
  const explicitIds = idsArg >= 0
    ? (process.argv[idsArg + 1] || "").split(",").map((value) => value.trim()).filter(Boolean)
    : [];

  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not found in .env.local");
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000, bufferCommands: false });

  const { default: Attack } = await import("../src/lib/models/Attack");
  const { reextractSearchLedSource } = await import("../src/lib/search-led-discovery");

  if (curatedPath) {
    const entries = await applyCurated(Attack, curatedPath, apply);
    writeArtifact(entries, apply);
    await mongoose.disconnect();
    return;
  }

  const query: Record<string, unknown> = { _deleted: { $ne: true } };
  if (explicitIds.length) {
    query._id = { $in: explicitIds.map((id) => new mongoose.Types.ObjectId(id)) };
  } else {
    query.$or = [{ title: /kill/i }, { title: /dead|death|massacre|slain|corpses?/i }];
    query.$and = FIELDS.map((field) => ({ [`casualties.${field}`]: null }));
  }
  const records = await Attack.find(query).sort({ date: -1 }).lean();
  console.log(`${apply ? "APPLY" : "DRY RUN"}: ${records.length} candidate record(s)`);

  const entries: Entry[] = [];

  for (const record of records as unknown as Array<Record<string, any>>) {
    const id = String(record._id);
    const source = (record.sources || [])[0];
    if (!source?.url) {
      entries.push({ id, title: record.title, sourceUrl: "", action: "skipped", reason: "record has no source url" });
      continue;
    }

    const { attacks, report } = await reextractSearchLedSource(
      { url: source.url, title: source.title || "", publisher: source.publisher || "" },
      336,
      reachHours,
    );

    const why = Object.entries(report.rejectionReasons || {})
      .sort((a, b) => b[1] - a[1])
      .map(([reason, count]) => `${reason} (${count})`)
      .join("; ");
    if (!attacks.length) {
      entries.push({
        id,
        title: record.title,
        sourceUrl: source.url,
        action: "skipped",
        reason: `re-extraction returned no event: ${why || "no rejected article and no counts"}${why.includes("horizon") ? " (widen with --reach-hours)" : ""}`,
      });
      continue;
    }

    // Identity first, against every event the article yielded, and only then the toll.
    // The repository's strict place rules decide it: a known settlement that differs is
    // never overridden by an LGA that happens to agree, and a known LGA that differs is a
    // rejection too. A roundup reporting two attacks in the same town on adjacent days
    // must not lend this record the other one's figure, so exactly one match is required.
    const identityMatches = attacks.filter((attack) => sameIncidentIdentity(record.date, record.location, attack));
    if (identityMatches.length !== 1) {
      entries.push({
        id,
        title: record.title,
        sourceUrl: source.url,
        action: "skipped",
        reason: identityMatches.length
          ? `ambiguous: ${identityMatches.length} re-extracted events match this state, settlement and day`
          : `no re-extracted event matches this record's state, settlement and day (${record.location?.state}, ${record.location?.lga}, ${record.location?.town}, ${DAY(record.date)})`,
        after: { candidates: attacks.map((attack) => ({ state: attack.location.state, lga: attack.location.lga, town: attack.location.town, date: DAY(attack.date), casualties: attack.casualties })) },
      });
      continue;
    }
    const chosen = identityMatches[0];
    if (!FIELDS.some((field) => chosen.casualties?.[field] != null)) {
      entries.push({
        id,
        title: record.title,
        sourceUrl: source.url,
        action: "skipped",
        reason: "the matched event states no toll in this article",
      });
      continue;
    }

    const set: Record<string, unknown> = {};
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};
    const filled: CasualtyField[] = [];
    for (const field of FIELDS) {
      const existing = record.casualties?.[field] ?? null;
      const incoming = chosen.casualties?.[field] ?? null;
      if (existing != null || incoming == null) continue;
      // Run the pair through the project's own normalizer: a range cannot end up with
      // min > max, an "unknown" meta cannot publish a number, and the representative value
      // matches the bounds written beside it.
      const normalized = normalizeCasualtyFields(
        { [field]: incoming },
        { [field]: chosen.casualtyMeta?.[field] },
      );
      const value = normalized.casualties[field];
      if (value == null || value <= 0) continue;
      set[`casualties.${field}`] = value;
      set[`casualtyMeta.${field}`] = {
        ...normalized.casualtyMeta[field],
        note: "Recovered by backfill-dropped-tolls: extraction confirmed the incident but dropped this figure.",
      };
      before[field] = existing;
      after[field] = { value, meta: set[`casualtyMeta.${field}`] };
      filled.push(field);
    }

    if (!Object.keys(set).length) {
      entries.push({
        id,
        title: record.title,
        sourceUrl: source.url,
        action: "skipped",
        reason: "record already carries every figure the article states",
      });
      continue;
    }

    const openEnded = FIELDS.some((field) => {
      const meta = set[`casualtyMeta.${field}`] as { precision?: string } | undefined;
      return meta?.precision === "range" || meta?.precision === "estimate";
    });
    if (record.status === "unconfirmed" && openEnded) set.status = "developing";

    const entry: Entry = {
      id,
      title: record.title,
      sourceUrl: source.url,
      action: "filled",
      reason: `re-extracted from ${source.publisher || "its source"}`,
      before,
      after: { ...after, ...(set.status ? { status: set.status } : {}) },
    };

    if (apply) {
      // The snapshot above is taken before the fetch and the model call, so guard the
      // write on the record still being active and still empty in exactly these fields.
      // A concurrent scan, a correction or a tombstone must not be overwritten.
      const guard: Record<string, unknown> = { _id: record._id, _deleted: { $ne: true } };
      for (const field of filled) guard[`casualties.${field}`] = null;
      if (set.status) guard.status = record.status;
      const result = await Attack.updateOne(guard, { $set: set });
      if (!result.matchedCount) {
        entry.action = "skipped";
        entry.reason = "record changed during the run, so nothing was written; rerun to retry";
      }
    }

    entries.push(entry);
  }

  writeArtifact(entries, apply);
  await mongoose.disconnect();
}

/**
 * Write a figure a person read out of the source when the pipeline cannot produce it.
 *
 * The file is a JSON array of `{ id, fields: { killed: { value, precision, sourceText },
 * ... } }`. Only empty fields are written, and the update is guarded the same way as the
 * automatic path, so a curated value can never overwrite something already recorded.
 */
async function applyCurated(Attack: any, file: string, apply: boolean): Promise<Entry[]> {
  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as Array<{
    id: string;
    fields: Partial<Record<CasualtyField, { value: number; precision: "exact" | "range"; sourceText: string }>>;
  }>;
  const entries: Entry[] = [];
  for (const item of parsed) {
    const record = await Attack.findOne({ _id: item.id }).lean();
    const entry: Entry = {
      id: item.id,
      title: record?.title || "",
      sourceUrl: (record?.sources || [])[0]?.url || "",
      action: "filled",
      reason: "curated from the source text",
    };
    if (!record || record._deleted) {
      entry.action = "skipped";
      entry.reason = "record not found or already deleted";
      entries.push(entry);
      continue;
    }
    const set: Record<string, unknown> = {};
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};
    const filled: CasualtyField[] = [];
    for (const field of FIELDS) {
      const incoming = item.fields[field];
      if (!incoming) continue;
      const existing = record.casualties?.[field] ?? null;
      if (existing != null) continue;
      if (!Number.isFinite(incoming.value) || incoming.value <= 0) continue;
      if (!incoming.sourceText || incoming.sourceText.trim().length < 20) {
        throw new Error(`curated ${item.id} ${field} needs a source quote`);
      }
      const openEnded = incoming.precision === "range";
      set[`casualties.${field}`] = incoming.value;
      set[`casualtyMeta.${field}`] = {
        precision: openEnded ? "range" : "exact",
        min: incoming.value,
        max: openEnded ? null : incoming.value,
        estimate: incoming.value,
        sourceText: incoming.sourceText.slice(0, 300),
        note: "Recorded from the source text by hand; extraction did not produce this figure.",
      };
      before[field] = existing;
      after[field] = { value: incoming.value, meta: set[`casualtyMeta.${field}`] };
      filled.push(field);
    }
    if (!filled.length) {
      entry.action = "skipped";
      entry.reason = "record already carries every curated figure";
      entries.push(entry);
      continue;
    }
    if (record.status === "unconfirmed" && filled.some((field) => (set[`casualtyMeta.${field}`] as { precision: string }).precision === "range")) {
      set.status = "developing";
    }
    entry.before = before;
    entry.after = { ...after, ...(set.status ? { status: set.status } : {}) };
    if (apply) {
      const guard: Record<string, unknown> = { _id: record._id, _deleted: { $ne: true } };
      for (const field of filled) guard[`casualties.${field}`] = null;
      const result = await Attack.updateOne(guard, { $set: set });
      if (!result.matchedCount) {
        entry.action = "skipped";
        entry.reason = "record changed during the run, so nothing was written; rerun to retry";
      }
    }
    entries.push(entry);
  }
  return entries;
}

function writeArtifact(entries: Entry[], apply: boolean) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = path.join("scratch", "backfill-dropped-tolls");
  fs.mkdirSync(dir, { recursive: true });
  const artifact = path.join(dir, `${stamp}.json`);
  fs.writeFileSync(artifact, JSON.stringify({ applied: apply, at: new Date().toISOString(), entries }, null, 2));

  for (const entry of entries) {
    const detail = entry.action === "filled" ? JSON.stringify(entry.after) : entry.reason;
    console.log(`${entry.action.toUpperCase()} ${entry.id} ${entry.title.slice(0, 70)}\n   ${detail}`);
  }
  console.log(`\n${entries.filter((entry) => entry.action === "filled").length} filled, ${entries.filter((entry) => entry.action === "skipped").length} skipped`);
  console.log(`artifact: ${artifact}`);
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
