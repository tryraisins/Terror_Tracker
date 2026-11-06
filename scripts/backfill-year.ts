/**
 * Year backfill driver: explicit historical windows, resumable, no Brave.
 *
 * The scheduled collector is anchored to "now" and capped at 336 hours, so it
 * cannot express January. This driver walks the year in cells, discovers
 * candidate URLs from two non-Brave lanes, re-runs every URL through the real
 * extraction path, and publishes only through `ingestSearchLedAttacks`, so all
 * identity and duplicate gates still apply.
 *
 * Ledger: scratch/backfill-year/<run-id>/
 *   cells.jsonl       one line per finished cell (append-only, resumes here)
 *   candidates.jsonl  every admitted event, before any publication
 *   published.jsonl   one line per ingest batch
 *   summary.json      end-of-run counts
 *
 * Usage:
 *   npx tsx scripts/backfill-year.ts --from 2026-01-01 --to 2026-11-07 --limit 4
 *   npx tsx scripts/backfill-year.ts --states Plateau,Benue --from 2026-03-01 --to 2026-03-15
 *   npx tsx scripts/backfill-year.ts --resume --apply
 *
 * Dry run is the default. `--apply` publishes through the normal ingest gates.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { VALID_STATE_NAMES } from "../src/lib/normalize-state";
import type { RawAttackData } from "../src/lib/free-news";

type Cell = { id: string; state: string; from: string; toExclusive: string; days: string[] };

type StoredCandidate = {
  hash: string;
  cell: string;
  url: string;
  title: string;
  candidate: unknown;
};

type Args = {
  from: string;
  to: string;
  states: string[];
  weekDays: number;
  variants: number;
  maxFetchPerCell: number;
  limit: number;
  runId: string;
  resume: boolean;
  apply: boolean;
  publishBatch: number;
  statusOnly: boolean;
};

const QUERY_TERMS = [
  "attack killed",
  "gunmen killed",
  "bandits killed",
  "residents killed",
  "kidnapped",
  "abducted",
  "troops killed",
  "herders attack",
  "explosion killed",
  "clash killed",
  "vigilante killed",
  "village attack",
];

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dayStart(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function parseArgs(argv: string[]): Args {
  const get = (name: string, fallback?: string) => {
    const index = argv.indexOf(`--${name}`);
    return index >= 0 ? argv[index + 1] : fallback;
  };
  const has = (name: string) => argv.includes(`--${name}`);
  const from = get("from");
  const to = get("to");
  if (!from || !to) throw new Error("--from and --to are required (YYYY-MM-DD)");
  const statesRaw = get("states");
  const states = statesRaw
    ? statesRaw.split(",").map((value) => value.trim()).filter(Boolean)
    : [...VALID_STATE_NAMES];
  const unknown = states.filter((state) => !(VALID_STATE_NAMES as readonly string[]).includes(state));
  if (unknown.length) throw new Error(`unknown state(s): ${unknown.join(", ")}`);
  return {
    from,
    to,
    states,
    weekDays: Number(get("week-days", "7")),
    variants: Number(get("variants", "3")),
    maxFetchPerCell: Number(get("max-fetch", "12")),
    limit: Number(get("limit", "0")),
    runId: get("run-id", `run-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`) as string,
    resume: has("resume"),
    apply: has("apply"),
    publishBatch: Number(get("publish-batch", "10")),
    statusOnly: has("status"),
  };
}

function buildCells(args: Args): Cell[] {
  const start = dayStart(args.from);
  const end = dayStart(args.to);
  if (!(start < end)) throw new Error("--from must be before --to");
  const step = Math.max(1, Math.min(31, Math.floor(args.weekDays)));
  const cells: Cell[] = [];
  for (let cursor = new Date(start); cursor < end; cursor = new Date(cursor.getTime() + step * 86_400_000)) {
    const toExclusive = new Date(Math.min(cursor.getTime() + step * 86_400_000, end.getTime()));
    const days: string[] = [];
    for (let day = new Date(cursor); day < toExclusive; day = new Date(day.getTime() + 86_400_000)) days.push(isoDay(day));
    for (const state of args.states) {
      cells.push({ id: `${isoDay(cursor)}_${state.replace(/\s+/g, "-").toLowerCase()}`, state, from: isoDay(cursor), toExclusive: isoDay(toExclusive), days });
    }
  }
  return cells;
}

function normalizeUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) if (/^(utm_|fbclid|gclid|ref|output|amp)/i.test(key)) url.searchParams.delete(key);
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return value.trim().replace(/\/$/, "").toLowerCase();
  }
}

function readJsonl<T>(file: string): T[] {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).flatMap((line) => {
    try { return [JSON.parse(line) as T]; } catch { return []; }
  });
}

function appendJsonl(file: string, value: unknown) {
  fs.appendFileSync(file, `${JSON.stringify(value)}\n`, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const ledgerDir = path.resolve("scratch/backfill-year", args.runId);
  fs.mkdirSync(ledgerDir, { recursive: true });
  const cellsFile = path.join(ledgerDir, "cells.jsonl");
  const candidatesFile = path.join(ledgerDir, "candidates.jsonl");
  const publishedFile = path.join(ledgerDir, "published.jsonl");

  const allCells = buildCells(args);
  const finished = new Map<string, { status: string; attempts: number }>();
  for (const row of readJsonl<{ cell: string; status: string; attempts: number }>(cellsFile)) finished.set(row.cell, { status: row.status, attempts: row.attempts });
  const pending = allCells.filter((cell) => {
    const prior = finished.get(cell.id);
    if (!prior) return true;
    if (prior.status === "done") return false;
    return prior.attempts < 2;
  });
  const todo = args.limit > 0 ? pending.slice(0, args.limit) : pending;

  if (args.statusOnly) {
    const rows = readJsonl<{ cell: string; status: string }>(cellsFile);
    const done = rows.filter((row) => row.status === "done").length;
    const failed = rows.filter((row) => row.status === "failed").length;
    console.log(JSON.stringify({ runId: args.runId, cells: allCells.length, done, failed, pending: allCells.length - done - failed, ledgerDir }, null, 2));
    return;
  }

  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not set");
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15_000 });

  // Loaded after dotenv and connection, like the scan.
  const { searchNews } = await import("../src/lib/news-discovery");
  const { reextractSearchLedSource, ingestSearchLedAttacks, hashFor } = await import("../src/lib/search-led-discovery");
  const { normalizeIncidentDate } = await import("../src/lib/incident-date");
  const { assertActiveAttackDateIntegrity } = await import("../src/lib/attack-data-integrity");
  const Attack = (await import("../src/lib/models/Attack")).default;

  // Existing candidates from earlier runs of this ledger, so a resume never
  // re-publishes an event it already extracted.
  const seenHashes = new Set(readJsonl<StoredCandidate>(candidatesFile).map((row) => row.hash));
  const publishedHashes = new Set(readJsonl<{ hashes: string[] }>(publishedFile).flatMap((row) => row.hashes));
  const seenUrls = new Set<string>();
  for (const row of readJsonl<{ urls: string[] }>(cellsFile)) for (const url of row.urls || []) seenUrls.add(url);

  const fromMs = dayStart(args.from).getTime();
  const toMs = dayStart(args.to).getTime();
  const reachHours = Math.ceil((Date.now() - fromMs) / 3_600_000) + 24 * 30;
  const runReport = { runId: args.runId, from: args.from, to: args.to, states: args.states, cellsPlanned: allCells.length, cellsRun: 0, cellsDone: 0, cellsFailed: 0, urlsSeen: 0, urlsFetched: 0, candidates: 0, laneCalls: 0, laneErrors: 0 };
  const extracted: StoredCandidate[] = [];
  const errors: Array<{ cell: string; error: string }> = [];

  console.log(`Backfill ${args.from}..${args.to}, ${args.states.length} states, ${allCells.length} cells, ${todo.length} to run, ledger ${ledgerDir}`);

  for (const cell of todo) {
    runReport.cellsRun += 1;
    const cellStart = Date.now();
    const urls = new Map<string, { title: string; publisher: string; date?: string }>();
    const cellCandidates: StoredCandidate[] = [];
    const laneErrors: string[] = [];
    let laneCalls = 0;
    const cellFromMs = Date.parse(`${cell.from}T00:00:00Z`);
    const cellToMs = Date.parse(`${cell.toExclusive}T00:00:00Z`);

    try {
      for (let variantIndex = 0; variantIndex < Math.max(1, args.variants); variantIndex += 1) {
        const term = QUERY_TERMS[(variantIndex + cell.days.length) % QUERY_TERMS.length];
        const query = `${cell.state} Nigeria ${term} after:${cell.from} before:${cell.toExclusive}`;
        for (const provider of ["googlenews", "deepseek"] as const) {
          laneCalls += 1;
          const response = await searchNews(query, { providers: provider, maxResults: 50 });
          const receipt = response.receipts[0];
          if (!receipt || receipt.status !== "PASS") {
            laneErrors.push(`${provider}: ${receipt?.status || "NO_RECEIPT"} ${receipt?.reason || ""}`.slice(0, 200));
            continue;
          }
          for (const result of response.results) {
            // DeepSeek treats the date operators as ranking hints, so its
            // publication date is enforced here with a two-day grace at each
            // boundary. Google News honours them server-side and returns no date.
            if (result.date) {
              const published = Date.parse(result.date);
              if (Number.isFinite(published) && (published < cellFromMs - 2 * 86_400_000 || published >= cellToMs + 2 * 86_400_000)) continue;
            }
            const key = normalizeUrl(result.url);
            if (!urls.has(key)) urls.set(key, { title: result.title, publisher: result.publisher, date: result.date });
          }
        }
      }

      const fetchList = [...urls.entries()].filter(([url]) => !seenUrls.has(url)).slice(0, Math.max(1, args.maxFetchPerCell));
      let heldLeads = 0;
      for (const [url, meta] of fetchList) {
        seenUrls.add(url);
        runReport.urlsFetched += 1;
        const { attacks, report } = await reextractSearchLedSource({ url, title: meta.title, publisher: meta.publisher }, 336, reachHours, { historical: true });
        heldLeads += report.reviewLeads.length;
        for (const attack of attacks) {
          const normalized = normalizeIncidentDate(attack);
          if (!normalized) continue;
          if (normalized.interval.end.getTime() < fromMs || normalized.interval.start.getTime() >= toMs) continue;
          const hash = hashFor(attack);
          if (seenHashes.has(hash)) continue;
          seenHashes.add(hash);
          const stored: StoredCandidate = { hash, cell: cell.id, url, title: attack.title, candidate: attack };
          cellCandidates.push(stored);
          extracted.push(stored);
        }
      }

      runReport.laneCalls += laneCalls;
      runReport.laneErrors += laneErrors.length;
      runReport.urlsSeen += urls.size;
      runReport.candidates += cellCandidates.length;
      runReport.cellsDone += 1;

      for (const candidate of cellCandidates) appendJsonl(candidatesFile, candidate);
      appendJsonl(cellsFile, {
        cell: cell.id, state: cell.state, from: cell.from, toExclusive: cell.toExclusive, days: cell.days,
        status: "done", attempts: (finished.get(cell.id)?.attempts || 0) + 1,
        urls: [...urls.keys()], fetched: fetchList.length, candidates: cellCandidates.length, heldLeads,
        laneCalls, laneErrors, durationMs: Date.now() - cellStart, finishedAt: new Date().toISOString(),
      });
      console.log(`${cell.id}: ${urls.size} urls, ${fetchList.length} fetched, ${cellCandidates.length} events, ${heldLeads} held${laneErrors.length ? `, ${laneErrors.length} lane errors` : ""}`);
    } catch (error) {
      runReport.cellsFailed += 1;
      const message = error instanceof Error ? error.message : String(error);
      errors.push({ cell: cell.id, error: message });
      appendJsonl(cellsFile, {
        cell: cell.id, state: cell.state, from: cell.from, toExclusive: cell.toExclusive, days: cell.days,
        status: "failed", attempts: (finished.get(cell.id)?.attempts || 0) + 1, urls: [...urls],
        error: message.slice(0, 500), durationMs: Date.now() - cellStart, finishedAt: new Date().toISOString(),
      });
      console.error(`${cell.id}: FAILED ${message}`);
    }
  }

  // Publication happens after the whole sweep so the duplicate gates see every
  // candidate at once instead of one cell at a time.
  const publication = { applied: false, batches: [] as unknown[], inserted: 0, merged: 0, held: 0, errors: 0, tombstones: 0 };
  if (args.apply) {
    await assertActiveAttackDateIntegrity("Backfill preflight");
    const publishable = [...new Map([...readJsonl<StoredCandidate>(candidatesFile), ...extracted].filter((row) => !publishedHashes.has(row.hash)).map((row) => [row.hash, row])).values()];
    const batchSize = Math.max(1, args.publishBatch);
    for (let index = 0; index < publishable.length; index += batchSize) {
      const batch = publishable.slice(index, index + batchSize);
      const hashes = batch.map((row) => row.hash);
      const tombstones = await Attack.find({ hash: { $in: hashes }, _deleted: true }, { hash: 1, _deletedReason: 1 }).lean();
      const tombstoneHashes = new Set(tombstones.map((row) => String((row as { hash: string }).hash)));
      const live = batch.filter((row) => !tombstoneHashes.has(row.hash));
      publication.tombstones += batch.length - live.length;
      if (tombstoneHashes.size) console.warn(`Batch ${index / batchSize + 1}: ${tombstoneHashes.size} candidate(s) match a removed record and were not resurrected.`);
      if (!live.length) continue;
      const result = await ingestSearchLedAttacks(live.map((row) => row.candidate as RawAttackData), `Backfill/${args.runId}`);
      publication.inserted += result.inserted;
      publication.merged += result.merged;
      publication.held += result.reviewRequired.length;
      publication.errors += result.errors;
      appendJsonl(publishedFile, {
        at: new Date().toISOString(), batch: index / batchSize + 1, hashes: live.map((row) => row.hash),
        inserted: result.inserted, merged: result.merged, held: result.reviewRequired.length, errors: result.errors,
        reviewRequired: result.reviewRequired.map((row) => ({ title: row.candidateTitle, url: row.url, reason: row.reason })),
      });
      console.log(`Published batch ${index / batchSize + 1}: +${result.inserted} inserted, ${result.merged} merged, ${result.reviewRequired.length} held, ${result.errors} errors`);
    }
    publication.applied = true;
    await assertActiveAttackDateIntegrity("Backfill postflight");
  }

  const summary = { ...runReport, publication, errors, finishedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(ledgerDir, "summary.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  await mongoose.disconnect();
  if (runReport.cellsFailed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error("FATAL", error);
  process.exitCode = 1;
});
