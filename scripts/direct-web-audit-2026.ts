import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import {
  CANONICAL_NIGERIA_JURISDICTIONS,
  REVISED_2026_AUDIT_POLICY,
  stableAuditHash,
} from "../src/lib/incident-audit-contract";
import type { CasualtyMetadata, LocationPrecision } from "../src/lib/incident-uncertainty";

dotenv.config({ path: path.join(process.cwd(), ".env.local"), quiet: true });
mongoose.set("bufferCommands", false);

const AUDIT_RUN_ID = "direct-web-revised-2026-01-to-08";
const DEFAULT_START = "2026-01-01";
const DEFAULT_END = "2026-08-29";
const USER_AGENT = "NigeriaAttackTracker/1.0 (+direct source audit)";
const EVENT_PATTERN = /\b(attack(?:ed|s|ing)?|ambush(?:ed|es)?|kidnap(?:ped|s|ping)?|abduct(?:ed|s|ing)?|kill(?:ed|s|ing)?|injur(?:ed|es|ing)?|wound(?:ed|s|ing)?|raid(?:ed|s|ing)?|shoot(?:ing|s|ers?|out)?|gunmen|bandits?|insurgents?|terrorists?|militants?|ied|explosion|clash(?:es|ed)?|massacre[ds]?|hostages?|captives?)\b/i;
const NON_INCIDENT_PATTERN = /\b(opinion|editorial|analysis|anniversary|explainer|forecast|budget|football|celebrity|music|movie|stock market|election campaign)\b/i;

type Args = {
  start: string;
  end: string;
  outDir: string;
  states: string[];
  concurrency: number;
  delayMs: number;
  timeoutMs: number;
  maxResultsPerQuery: number;
  queryLimit: number | null;
  retryFrom: string | null;
  retryAttempts: number;
  skipScan: boolean;
  skipDb: boolean;
  knownGapsOnly: boolean;
  executeKnownGaps: boolean;
};

type WeekWindow = {
  index: number;
  start: string;
  end: string;
  before: string;
};

type SearchTask = {
  hash: string;
  jurisdiction: string;
  window: WeekWindow;
  query: string;
  feedUrl: string;
};

type RssItem = {
  title: string;
  url: string;
  sourceName: string;
  sourceUrl: string | null;
  publishedAt: string | null;
};

type QueryLedger = {
  auditRunId: string;
  queryHash: string;
  jurisdiction: string;
  periodStart: string;
  periodEnd: string;
  query: string;
  feedUrl: string;
  status: "PASS" | "FAIL" | "BLOCKED";
  resultCount: number;
  candidateCount: number;
  reason: string;
};

type CandidateLedger = {
  auditRunId: string;
  candidateHash: string;
  jurisdiction: string;
  periodStart: string;
  periodEnd: string;
  title: string;
  publisher: string;
  sourceDomain: string | null;
  googleNewsUrl: string;
  publishedAt: string | null;
  locationPrecision: LocationPrecision;
  lga: string | null;
  town: string | null;
  eventSignals: string[];
  adjudicationStatus: "LEAD_ONLY" | "REJECTED";
  requiredNextEvidence: string;
};

type Source = { url: string; title: string; publisher: string };
type KnownGapPlan = {
  key: string;
  status: "READY" | "NO_OP" | "BLOCKED";
  reason: string;
  target?: {
    _id: string;
    title: string;
    date: string | null;
    location: unknown;
    casualties: unknown;
    casualtyMeta: unknown;
    sourceCount: number;
    fingerprint: string;
  };
  update?: {
    set: Record<string, unknown>;
    addSources: Source[];
    addTags: string[];
  };
  evidence: Source[];
};

function parseArgs(argv: string[]): Args {
  const now = new Date().toISOString().replace(/[:.]/g, "-");
  const args: Args = {
    start: DEFAULT_START,
    end: DEFAULT_END,
    outDir: path.join("audit-2026", `direct-web-audit-${now}`),
    states: [...CANONICAL_NIGERIA_JURISDICTIONS],
    concurrency: 3,
    delayMs: 125,
    timeoutMs: 12000,
    maxResultsPerQuery: 20,
    queryLimit: null,
    retryFrom: null,
    retryAttempts: 1,
    skipScan: false,
    skipDb: false,
    knownGapsOnly: false,
    executeKnownGaps: false,
  };

  for (const arg of argv) {
    if (arg.startsWith("--start=")) args.start = arg.slice("--start=".length);
    else if (arg.startsWith("--end=")) args.end = arg.slice("--end=".length);
    else if (arg.startsWith("--out=")) args.outDir = arg.slice("--out=".length);
    else if (arg.startsWith("--states=")) {
      const requested = arg.slice("--states=".length).split(",").map((state) => state.trim()).filter(Boolean);
      args.states = requested.map((state) => state.toLowerCase() === "abuja" ? "FCT" : state);
    }
    else if (arg.startsWith("--concurrency=")) args.concurrency = Math.max(1, Number(arg.slice("--concurrency=".length)) || args.concurrency);
    else if (arg.startsWith("--delay-ms=")) args.delayMs = Math.max(0, Number(arg.slice("--delay-ms=".length)) || 0);
    else if (arg.startsWith("--timeout-ms=")) args.timeoutMs = Math.max(1000, Number(arg.slice("--timeout-ms=".length)) || args.timeoutMs);
    else if (arg.startsWith("--max-results-per-query=")) args.maxResultsPerQuery = Math.max(1, Number(arg.slice("--max-results-per-query=".length)) || args.maxResultsPerQuery);
    else if (arg.startsWith("--query-limit=")) args.queryLimit = Math.max(1, Number(arg.slice("--query-limit=".length)) || 1);
    else if (arg.startsWith("--retry-from=")) args.retryFrom = path.resolve(process.cwd(), arg.slice("--retry-from=".length));
    else if (arg.startsWith("--retry-attempts=")) args.retryAttempts = Math.max(1, Math.min(5, Number(arg.slice("--retry-attempts=".length)) || 1));
    else if (arg === "--skip-scan") args.skipScan = true;
    else if (arg === "--skip-db") args.skipDb = true;
    else if (arg === "--known-gaps-only") args.knownGapsOnly = true;
    else if (arg === "--execute-known-gaps") args.executeKnownGaps = true;
  }

  args.concurrency = Math.min(args.concurrency, 6);
  args.outDir = path.resolve(process.cwd(), args.outDir);
  return args;
}

function isoDay(input: Date): string {
  return input.toISOString().slice(0, 10);
}

function parseDay(value: string): Date {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid ISO day: ${value}`);
  return parsed;
}

function addDays(day: Date, count: number): Date {
  const next = new Date(day);
  next.setUTCDate(next.getUTCDate() + count);
  return next;
}

function weeklyWindows(start: string, end: string): WeekWindow[] {
  const windows: WeekWindow[] = [];
  let cursor = parseDay(start);
  const final = parseDay(end);
  let index = 1;

  while (cursor <= final) {
    const windowEnd = addDays(cursor, 6) <= final ? addDays(cursor, 6) : final;
    windows.push({
      index,
      start: isoDay(cursor),
      end: isoDay(windowEnd),
      before: isoDay(addDays(windowEnd, 1)),
    });
    cursor = addDays(windowEnd, 1);
    index++;
  }

  return windows;
}

function hash(value: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function searchStateName(state: string): string {
  return state === "FCT" ? "Abuja OR FCT" : `${state} State`;
}

function buildSearchTasks(args: Args): SearchTask[] {
  const windows = weeklyWindows(args.start, args.end);
  const tasks: SearchTask[] = [];

  for (const jurisdiction of args.states) {
    for (const window of windows) {
      const query = `${searchStateName(jurisdiction)} Nigeria attack killed kidnapped abducted gunmen bandits Boko Haram ISWAP herdsmen ambush raid after:${window.start} before:${window.before}`;
      const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-NG&gl=NG&ceid=NG:en`;
      tasks.push({
        hash: hash({ jurisdiction, window, query }),
        jurisdiction,
        window,
        query,
        feedUrl,
      });
    }
  }

  const targeted = [
    {
      jurisdiction: "Niger",
      start: "2026-08-21",
      end: "2026-08-29",
      query: "Niger State Borgu Dekera Kpenya mosque worshippers abducted kidnapped 600 after:2026-08-21 before:2026-08-30",
    },
    {
      jurisdiction: "Borno",
      start: "2026-05-15",
      end: "2026-08-29",
      query: "Borno Mussa Askira Uba schoolchildren abducted 44 100 days after:2026-05-15 before:2026-08-30",
    },
    {
      jurisdiction: "Borno",
      start: "2026-06-29",
      end: "2026-08-29",
      query: "Borno Lassa children abducted school Boko Haram after:2026-06-29 before:2026-08-30",
    },
  ];

  for (const item of targeted) {
    const window: WeekWindow = { index: 0, start: item.start, end: item.end, before: isoDay(addDays(parseDay(item.end), 1)) };
    const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(item.query)}&hl=en-NG&gl=NG&ceid=NG:en`;
    tasks.push({ hash: hash(item), jurisdiction: item.jurisdiction, window, query: item.query, feedUrl });
  }

  return args.queryLimit ? tasks.slice(0, args.queryLimit) : tasks;
}

function decodeHtml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function field(xml: string, tag: string): string {
  return decodeHtml(xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1] || "");
}

function parseRss(xml: string): RssItem[] {
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];
  return blocks.map((block) => {
    const sourceMatch = block.match(/<source\b[^>]*url=["']([^"']+)["'][^>]*>([\s\S]*?)<\/source>/i);
    const url = field(block, "link") || field(block, "guid");
    return {
      title: field(block, "title"),
      url,
      sourceName: decodeHtml(sourceMatch?.[2] || ""),
      sourceUrl: sourceMatch?.[1] || null,
      publishedAt: field(block, "pubDate") ? new Date(field(block, "pubDate")).toISOString() : null,
    };
  }).filter((item) => item.title && /^https?:\/\//i.test(item.url));
}

function domainFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}

function extractSignals(title: string): string[] {
  const signals: string[] = [];
  if (/\bkidnap|abduct|hostage|captive/i.test(title)) signals.push("abduction");
  if (/\bkill|dead|slain|massacre/i.test(title)) signals.push("fatality");
  if (/\battack|raid|ambush|clash|shoot/i.test(title)) signals.push("attack");
  if (/\bBoko\s+Haram\b/i.test(title)) signals.push("boko-haram");
  if (/\bISWAP\b/i.test(title)) signals.push("iswap");
  if (/\bbandits?\b/i.test(title)) signals.push("banditry");
  if (/\bherdsmen\b/i.test(title)) signals.push("herdsmen");
  return signals.length ? signals : ["security-incident-language"];
}

function extractLga(title: string): string | null {
  const match = title.match(/\b([A-Z][A-Za-z'’-]{2,}(?:\s+[A-Z][A-Za-z'’-]{2,}){0,2})\s+(?:Local Government Area|LGA|Local Govt\.?|Council Area)\b/);
  return match?.[1]?.trim() || null;
}

function extractTown(title: string, state: string): string | null {
  const match = title.match(/\b(?:in|at|near|from)\s+([A-Z][A-Za-z'’-]{2,}(?:\s+[A-Z][A-Za-z'’-]{2,}){0,2})(?:,|\s+in|\s+after|\s+as|\s+where|$)/);
  const town = match?.[1]?.trim() || null;
  if (!town || new RegExp(`^(Nigeria|${state}|State|Community|Village)$`, "i").test(town)) return null;
  return town;
}

function locationPrecisionFor(title: string, state: string): { precision: LocationPrecision; lga: string | null; town: string | null } {
  const lga = extractLga(title);
  const town = extractTown(title, state);
  if (town) return { precision: /\bnear\b/i.test(title) ? "surrounding_area" : "exact", lga, town };
  if (lga) return { precision: "approximate_lga", lga, town: null };
  return { precision: "approximate_state", lga: null, town: null };
}

function candidateFromItem(task: SearchTask, item: RssItem): CandidateLedger | null {
  if (!EVENT_PATTERN.test(item.title) || NON_INCIDENT_PATTERN.test(item.title)) return null;
  const sourceDomain = domainFromUrl(item.sourceUrl);
  const location = locationPrecisionFor(item.title, task.jurisdiction);
  return {
    auditRunId: AUDIT_RUN_ID,
    candidateHash: hash({
      jurisdiction: task.jurisdiction,
      periodStart: task.window.start,
      title: item.title,
      sourceDomain,
    }),
    jurisdiction: task.jurisdiction,
    periodStart: task.window.start,
    periodEnd: task.window.end,
    title: item.title,
    publisher: item.sourceName || sourceDomain || "Unknown publisher",
    sourceDomain,
    googleNewsUrl: item.url,
    publishedAt: item.publishedAt,
    locationPrecision: location.precision,
    lga: location.lga,
    town: location.town,
    eventSignals: extractSignals(item.title),
    adjudicationStatus: "LEAD_ONLY",
    requiredNextEvidence: "Open direct publisher article and confirm event date, victim-only casualties, duplicate status, and source-supported location before database insert.",
  };
}

async function appendJsonl(file: string, rows: unknown[]): Promise<void> {
  if (!rows.length) return;
  await fs.appendFile(file, rows.map((row) => JSON.stringify(row)).join("\n") + "\n", "utf8");
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await fs.writeFile(file, JSON.stringify(value, null, 2) + "\n", "utf8");
}

async function writeText(file: string, value: string): Promise<void> {
  await fs.writeFile(file, value, "utf8");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url: string, timeoutMs: number): Promise<{ status: number; text: string }> {
  const controller = new AbortController();
  let timer: NodeJS.Timeout | undefined;
  try {
    const response = await Promise.race([
      fetch(url, {
        headers: { "user-agent": USER_AGENT },
        signal: controller.signal,
      }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error(`Fetch timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
    const text = await Promise.race([
      response.text(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Response body timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
    return { status: response.status, text };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  iterator: (item: T, index: number) => Promise<R>,
  onProgress?: (completed: number, total: number) => void,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  let completed = 0;

  async function worker() {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await iterator(items[index], index);
      completed++;
      onProgress?.(completed, items.length);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function scanTask(task: SearchTask, args: Args, queryLedgerFile: string, candidateFile: string): Promise<QueryLedger> {
  for (let attempt = 1; attempt <= args.retryAttempts; attempt++) {
    try {
      if (args.delayMs) await sleep(args.delayMs);
      const { status, text } = await fetchText(task.feedUrl, args.timeoutMs);
      if (status >= 400) {
        const ledger: QueryLedger = {
          auditRunId: AUDIT_RUN_ID,
          queryHash: task.hash,
          jurisdiction: task.jurisdiction,
          periodStart: task.window.start,
          periodEnd: task.window.end,
          query: task.query,
          feedUrl: task.feedUrl,
          status: status === 429 ? "BLOCKED" : "FAIL",
          resultCount: 0,
          candidateCount: 0,
          reason: `Google News RSS returned HTTP ${status} on attempt ${attempt}.`,
        };
        if ((status === 429 || status === 503) && attempt < args.retryAttempts) {
          await sleep(args.delayMs + attempt * 2000);
          continue;
        }
        await appendJsonl(queryLedgerFile, [ledger]);
        return ledger;
      }

      const items = parseRss(text).slice(0, args.maxResultsPerQuery);
      const candidates = items
        .map((item) => candidateFromItem(task, item))
        .filter((item): item is CandidateLedger => Boolean(item));
      const ledger: QueryLedger = {
        auditRunId: AUDIT_RUN_ID,
        queryHash: task.hash,
        jurisdiction: task.jurisdiction,
        periodStart: task.window.start,
        periodEnd: task.window.end,
        query: task.query,
        feedUrl: task.feedUrl,
        status: "PASS",
        resultCount: items.length,
        candidateCount: candidates.length,
        reason: candidates.length ? "Search returned incident leads requiring direct-source confirmation." : "No incident leads found in RSS titles for this cell.",
      };
      await appendJsonl(queryLedgerFile, [ledger]);
      await appendJsonl(candidateFile, candidates);
      return ledger;
    } catch (error) {
      const ledger: QueryLedger = {
        auditRunId: AUDIT_RUN_ID,
        queryHash: task.hash,
        jurisdiction: task.jurisdiction,
        periodStart: task.window.start,
        periodEnd: task.window.end,
        query: task.query,
        feedUrl: task.feedUrl,
        status: "FAIL",
        resultCount: 0,
        candidateCount: 0,
        reason: `${error instanceof Error ? error.message : String(error)} on attempt ${attempt}`,
      };
      if (attempt < args.retryAttempts) {
        await sleep(args.delayMs + attempt * 2000);
        continue;
      }
      await appendJsonl(queryLedgerFile, [ledger]);
      return ledger;
    }
  }
  throw new Error(`Unreachable retry state for ${task.hash}`);
}

async function runSearchScan(args: Args): Promise<{ tasks: number; ledgers: QueryLedger[]; candidates: number }> {
  const queryLedgerFile = path.join(args.outDir, "query-ledger.jsonl");
  const candidateFile = path.join(args.outDir, "candidate-ledger.jsonl");
  await fs.rm(queryLedgerFile, { force: true });
  await fs.rm(candidateFile, { force: true });

  let tasks = buildSearchTasks({ ...args, queryLimit: null });
  if (args.retryFrom) {
    const priorFile = path.join(args.retryFrom, "query-ledger.jsonl");
    const priorRows = (await fs.readFile(priorFile, "utf8"))
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as QueryLedger);
    const failed = new Set(priorRows.filter((row) => row.status !== "PASS").map((row) => row.queryHash));
    tasks = tasks.filter((task) => failed.has(task.hash));
  }
  if (args.queryLimit) tasks = tasks.slice(0, args.queryLimit);
  let lastProgress = 0;
  const ledgers = await mapLimit(tasks, args.concurrency, (task) => scanTask(task, args, queryLedgerFile, candidateFile), (completed, total) => {
    if (completed === total || completed - lastProgress >= 50) {
      lastProgress = completed;
      console.log(JSON.stringify({ phase: "direct-web-scan", completed, total }));
    }
  });

  const candidates = ledgers.reduce((sum, row) => sum + row.candidateCount, 0);
  const byStatus = Object.fromEntries(["PASS", "FAIL", "BLOCKED"].map((status) => [status, ledgers.filter((row) => row.status === status).length]));
  const byState = Object.fromEntries(args.states.map((state) => [state, ledgers.filter((row) => row.jurisdiction === state).reduce((sum, row) => sum + row.candidateCount, 0)]));
  await writeJson(path.join(args.outDir, "direct-web-scan-summary.json"), {
    generatedAt: new Date().toISOString(),
    auditRunId: AUDIT_RUN_ID,
    scope: { start: args.start, endInclusive: args.end, states: args.states },
    queryCount: ledgers.length,
    candidateCount: candidates,
    status: byStatus,
    candidateLeadsByState: byState,
    writePolicy: "Read-only search ledger. Candidate leads are not database records until direct publisher pages are opened and matched.",
  });
  return { tasks: tasks.length, ledgers, candidates };
}

function sourceAlreadyPresent(existing: unknown, url: string): boolean {
  if (!Array.isArray(existing)) return false;
  const normalized = url.replace(/\/$/, "");
  return existing.some((source) => {
    const candidate = (source as { url?: string }).url;
    return typeof candidate === "string" && candidate.replace(/\/$/, "") === normalized;
  });
}

function uniqueSources(existingSources: unknown, sources: Source[]): Source[] {
  return sources.filter((source) => !sourceAlreadyPresent(existingSources, source.url));
}

function casualtyMetaRange(min: number, max: number, estimate: number, sourceText: string, note: string): CasualtyMetadata["kidnapped"] {
  return { precision: "range", min, max, estimate, sourceText, note };
}

function casualtyMetaExact(value: number, sourceText: string, note: string): CasualtyMetadata["killed"] {
  return { precision: "exact", min: value, max: value, estimate: value, sourceText, note };
}

function stableTarget(row: Record<string, unknown> | null | undefined) {
  if (!row) return undefined;
  return {
    _id: String(row._id),
    title: String(row.title || ""),
    date: row.date instanceof Date ? row.date.toISOString() : row.date ? new Date(String(row.date)).toISOString() : null,
    location: row.location,
    casualties: row.casualties,
    casualtyMeta: row.casualtyMeta,
    sourceCount: Array.isArray(row.sources) ? row.sources.length : 0,
    fingerprint: stableAuditHash({
      _id: String(row._id),
      title: row.title,
      date: row.date,
      location: row.location,
      casualties: row.casualties,
      casualtyMeta: row.casualtyMeta,
      sources: row.sources,
      status: row.status,
      hash: row.hash,
    }),
  };
}

function scoreMatch(row: Record<string, unknown>, terms: RegExp[]): number {
  const haystack = `${row.title || ""} ${JSON.stringify(row.location || {})} ${JSON.stringify(row.sources || [])}`;
  return terms.reduce((score, term) => score + (term.test(haystack) ? 1 : 0), 0);
}

function selectUnique(rows: Record<string, unknown>[], terms: RegExp[]): Record<string, unknown> | null {
  const scored = rows
    .map((row) => ({ row, score: scoreMatch(row, terms) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);
  if (!scored.length) return null;
  if (scored.length > 1 && scored[0].score === scored[1].score) return null;
  return scored[0].row;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function connectDb(args: Args): Promise<mongoose.Connection | null> {
  if (args.skipDb) {
    console.warn(JSON.stringify({ phase: "known-gaps", status: "SKIPPED", reason: "--skip-db" }));
    return null;
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn(JSON.stringify({ phase: "known-gaps", status: "BLOCKED", reason: "MONGODB_URI missing" }));
    return null;
  }
  await withTimeout(mongoose.connect(uri, { serverSelectionTimeoutMS: Math.min(args.timeoutMs, 15000) }), args.timeoutMs + 5000, "MongoDB connection");
  return mongoose.connection;
}

const NIGER_MOSQUE_SOURCES: Source[] = [
  {
    url: "https://www.aljazeera.com/news/2026/8/22/armed-men-kidnap-dozens-in-attacks-on-nigerian-villages",
    title: "Armed men kidnap dozens in attacks on Nigerian villages",
    publisher: "Al Jazeera",
  },
  {
    url: "https://apnews.com/article/df9678a01c1e096404964496d5e6f905",
    title: "Scores of people kidnapped from a mosque as armed groups attacked multiple villages in Nigeria",
    publisher: "Associated Press",
  },
  {
    url: "https://www.theguardian.com/world/2026/aug/24/video-shows-hundreds-held-captive-after-nigeria-mosque-kidnapping",
    title: "Video shows hundreds held captive after Nigeria mosque kidnapping",
    publisher: "The Guardian",
  },
  {
    url: "https://www.aljazeera.com/news/2026/8/26/nigeria-launches-hunt-for-hundreds-of-kidnapped-mosque-worshippers",
    title: "Nigeria launches hunt for hundreds of kidnapped mosque worshippers",
    publisher: "Al Jazeera",
  },
];

const BORNO_MUSSA_SOURCES: Source[] = [
  {
    url: "https://www.aa.com.tr/en/africa/nigeria-says-42-students-abducted-in-boko-haram-attack-on-school-in-borno/3939913",
    title: "Nigeria says 42 students abducted in Boko Haram attack on school in Borno",
    publisher: "Anadolu Agency",
  },
  {
    url: "https://www.icirnigeria.org/44-borno-schoolchildren-remain-in-captivity-over-100-days-after-abduction/",
    title: "44 Borno schoolchildren remain in captivity over 100 days after abduction",
    publisher: "ICIR Nigeria",
  },
];

async function buildKnownGapPlans(connection: mongoose.Connection): Promise<KnownGapPlan[]> {
  const db = connection.db;
  if (!db) throw new Error("MongoDB database handle unavailable");
  const attacks = db.collection("attacks");

  const nigerRows = await withTimeout(attacks.find({
    _deleted: { $ne: true },
    "location.state": "Niger",
    date: { $gte: new Date("2026-08-20T00:00:00.000Z"), $lt: new Date("2026-08-24T00:00:00.000Z") },
    $or: [
      { title: /borgu|dekera|dekara|kpenya|mosque|worship/i },
      { "location.lga": /borgu/i },
      { "location.town": /dekera|dekara|kpenya|gidan|masaka/i },
      { "sources.title": /borgu|dekera|dekara|kpenya|mosque|worship/i },
    ],
  }).sort({ date: 1, _id: 1 }).toArray(), 20000, "Niger known-gap query");
  const nigerTarget = selectUnique(nigerRows as Record<string, unknown>[], [/borgu/i, /mosque|worship/i, /kidnap|abduct/i]);
  const nigerTargetSnapshot = stableTarget(nigerTarget || undefined);
  const nigerSources = nigerTarget ? uniqueSources(nigerTarget.sources, NIGER_MOSQUE_SOURCES) : NIGER_MOSQUE_SOURCES;
  const nigerPlan: KnownGapPlan = nigerTarget && nigerTargetSnapshot ? {
    key: "niger-borgu-mosque-2026-08-21",
    status: "READY",
    reason: "Existing Borgu/Niger mosque abduction record matched. Conflicting direct reports are represented as a kidnapped-victims range rather than being dropped.",
    target: nigerTargetSnapshot,
    update: {
      set: {
        "location.precision": "surrounding_area",
        "location.notes": "Sources identify Borgu LGA and related mosque/village attacks around Dekera/Kpenya, but reports vary on the precise settlement.",
        "casualties.killed": 30,
        "casualtyMeta.killed": casualtyMetaExact(
          30,
          "A district official reported 30 people killed and buried after the attacks.",
          "Stored as a source-specific victim count while the wider incident remains developing because abduction totals conflict.",
        ),
        "casualties.kidnapped": 330,
        "casualtyMeta.kidnapped": casualtyMetaRange(
          60,
          600,
          330,
          "Reports range from over 60/scores to about/as many as 600 abducted worshippers.",
          "Early police/local reports put abductees around 60-80; later Reuters/AP/Al Jazeera/Guardian reporting described hundreds or about 600. Stored as a range pending an authoritative victim list.",
        ),
        status: "developing",
      },
      addSources: nigerSources,
      addTags: ["mass-kidnapping", "casualty-uncertainty", "approximate-location"],
    },
    evidence: NIGER_MOSQUE_SOURCES,
  } : {
    key: "niger-borgu-mosque-2026-08-21",
    status: "BLOCKED",
    reason: `Could not deterministically select one active Niger/Borgu mosque record. Candidate rows found: ${nigerRows.length}.`,
    evidence: NIGER_MOSQUE_SOURCES,
  };

  const bornoRows = await withTimeout(attacks.find({
    _deleted: { $ne: true },
    "location.state": "Borno",
    date: { $gte: new Date("2026-05-14T00:00:00.000Z"), $lt: new Date("2026-05-17T00:00:00.000Z") },
    $or: [
      { title: /mussa|school|student|children|askira|uba/i },
      { "location.town": /mussa/i },
      { "location.lga": /askira|uba/i },
      { "sources.title": /mussa|school|student|children/i },
    ],
  }).sort({ date: 1, _id: 1 }).toArray(), 20000, "Borno Mussa known-gap query");
  const bornoTarget = selectUnique(bornoRows as Record<string, unknown>[], [/mussa/i, /school|student|children/i, /abduct|kidnap/i]);
  const bornoTargetSnapshot = stableTarget(bornoTarget || undefined);
  const bornoSources = bornoTarget ? uniqueSources(bornoTarget.sources, BORNO_MUSSA_SOURCES) : BORNO_MUSSA_SOURCES;
  const bornoPlan: KnownGapPlan = bornoTarget && bornoTargetSnapshot ? {
    key: "borno-mussa-schoolchildren-2026-05-15",
    status: "READY",
    reason: "Existing Mussa/Askira-Uba schoolchildren record matched. The 100-day article is a follow-up, not a new incident; casualty disagreement is stored as a 42-48 range.",
    target: bornoTargetSnapshot,
    update: {
      set: {
        "location.precision": "exact",
        "location.notes": "Sources identify Mussa community in Askira-Uba LGA.",
        "casualties.kidnapped": 45,
        "casualtyMeta.kidnapped": casualtyMetaRange(
          42,
          48,
          45,
          "Reports cite about/at least 42 abducted students, 44 children, and 48 people initially taken.",
          "Stored as a range because follow-up reporting gives related but different Mussa abduction counts. The 100-day follow-up itself is not a standalone attack.",
        ),
        status: "developing",
      },
      addSources: bornoSources,
      addTags: ["school-abduction", "casualty-uncertainty"],
    },
    evidence: BORNO_MUSSA_SOURCES,
  } : {
    key: "borno-mussa-schoolchildren-2026-05-15",
    status: "BLOCKED",
    reason: `Could not deterministically select one active Borno/Mussa schoolchildren record. Candidate rows found: ${bornoRows.length}.`,
    evidence: BORNO_MUSSA_SOURCES,
  };

  return [nigerPlan, bornoPlan];
}

function mongoUpdateFromPlan(plan: KnownGapPlan) {
  if (!plan.target || !plan.update) return null;
  const update: Record<string, unknown> = { $set: plan.update.set };
  if (plan.update.addSources.length || plan.update.addTags.length) {
    update.$addToSet = {};
    if (plan.update.addSources.length) (update.$addToSet as Record<string, unknown>).sources = { $each: plan.update.addSources };
    if (plan.update.addTags.length) (update.$addToSet as Record<string, unknown>).tags = { $each: plan.update.addTags };
  }
  return update;
}

async function applyKnownGapPlans(connection: mongoose.Connection, plans: KnownGapPlan[], outDir: string) {
  const db = connection.db;
  if (!db) throw new Error("MongoDB database handle unavailable");
  const attacks = db.collection("attacks");
  const results = [];

  for (const plan of plans) {
    const update = mongoUpdateFromPlan(plan);
    if (plan.status !== "READY" || !plan.target || !update) {
      results.push({ key: plan.key, status: "SKIPPED", reason: plan.reason });
      continue;
    }

    const filter = { _id: new mongoose.Types.ObjectId(plan.target._id), _deleted: { $ne: true } };
    const before = await withTimeout(attacks.findOne(filter), 20000, `${plan.key} pre-apply fetch`);
    const beforeFingerprint = stableTarget(before as Record<string, unknown> | null | undefined)?.fingerprint;
    if (beforeFingerprint !== plan.target.fingerprint) {
      results.push({ key: plan.key, status: "BLOCKED", reason: "Target record changed after dry-run planning." });
      continue;
    }

    const applied = await withTimeout(attacks.updateOne(filter, update), 20000, `${plan.key} update`);
    const idempotency = await withTimeout(attacks.updateOne(filter, update), 20000, `${plan.key} idempotency update`);
    const after = await withTimeout(attacks.findOne(filter), 20000, `${plan.key} post-apply fetch`);
    results.push({
      key: plan.key,
      status: applied.matchedCount === 1 && applied.modifiedCount <= 1 && idempotency.modifiedCount === 0 ? "PASS" : "FAIL",
      matchedCount: applied.matchedCount,
      modifiedCount: applied.modifiedCount,
      idempotencyModifiedCount: idempotency.modifiedCount,
      after: stableTarget(after as Record<string, unknown> | null | undefined),
    });
  }

  await writeJson(path.join(outDir, "known-gap-apply-results.json"), {
    generatedAt: new Date().toISOString(),
    auditRunId: AUDIT_RUN_ID,
    results,
  });
  return results;
}

async function aggregateDbTotals(connection: mongoose.Connection, outDir: string, label: string) {
  const db = connection.db;
  if (!db) throw new Error("MongoDB database handle unavailable");
  const attacks = db.collection("attacks");
  const totals = await withTimeout(attacks.aggregate([
    {
      $match: {
        _deleted: { $ne: true },
        date: { $gte: new Date(`${DEFAULT_START}T00:00:00.000Z`), $lt: new Date("2026-08-30T00:00:00.000Z") },
      },
    },
    {
      $group: {
        _id: { month: { $dateToString: { format: "%Y-%m", date: "$date" } } },
        incidents: { $sum: 1 },
        killed: { $sum: { $ifNull: ["$casualties.killed", 0] } },
        injured: { $sum: { $ifNull: ["$casualties.injured", 0] } },
        kidnapped: { $sum: { $ifNull: ["$casualties.kidnapped", 0] } },
        displaced: { $sum: { $ifNull: ["$casualties.displaced", 0] } },
        exactLocation: { $sum: { $cond: [{ $eq: [{ $ifNull: ["$location.precision", "legacy_unspecified"] }, "exact"] }, 1, 0] } },
        approximateLocation: {
          $sum: {
            $cond: [
              { $in: [{ $ifNull: ["$location.precision", "legacy_unspecified"] }, ["surrounding_area", "approximate_lga", "approximate_state", "unknown"]] },
              1,
              0,
            ],
          },
        },
        legacyUnspecifiedLocation: { $sum: { $cond: [{ $eq: [{ $ifNull: ["$location.precision", "legacy_unspecified"] }, "legacy_unspecified"] }, 1, 0] } },
      },
    },
    { $sort: { "_id.month": 1 } },
  ]).toArray(), 20000, `${label} totals aggregation`);

  await writeJson(path.join(outDir, `db-totals-${label}.json`), {
    generatedAt: new Date().toISOString(),
    auditRunId: AUDIT_RUN_ID,
    label,
    totals,
    note: "Casualty sums include exact values, estimates, and range midpoint representatives. They are not national prevalence claims.",
  });
  return totals;
}

async function runKnownGapDryRun(args: Args): Promise<{ plans: KnownGapPlan[]; applyResults?: unknown[]; totalsBefore?: unknown; totalsAfter?: unknown }> {
  const connection = await connectDb(args);
  if (!connection) {
    const blocked = {
      generatedAt: new Date().toISOString(),
      auditRunId: AUDIT_RUN_ID,
      status: "BLOCKED",
      reason: "MONGODB_URI was not available.",
    };
    await writeJson(path.join(args.outDir, "known-gap-dry-run.json"), blocked);
    return { plans: [] };
  }

  try {
    const totalsBefore = await aggregateDbTotals(connection, args.outDir, "before");
    const plans = await buildKnownGapPlans(connection);
    await writeJson(path.join(args.outDir, "known-gap-dry-run.json"), {
      generatedAt: new Date().toISOString(),
      auditRunId: AUDIT_RUN_ID,
      mode: args.executeKnownGaps ? "execute" : "dry-run",
      revisedPolicy: REVISED_2026_AUDIT_POLICY,
      plans,
      safety: "Only READY plans with a stable target fingerprint are eligible for writes. Candidate search leads are read-only.",
    });

    if (!args.executeKnownGaps) return { plans, totalsBefore };

    const applyResults = await applyKnownGapPlans(connection, plans, args.outDir);
    const totalsAfter = await aggregateDbTotals(connection, args.outDir, "after");
    return { plans, applyResults, totalsBefore, totalsAfter };
  } finally {
    await mongoose.disconnect().catch(() => undefined);
  }
}

function reportMarkdown(args: Args, scan: { tasks: number; ledgers: QueryLedger[]; candidates: number } | null, known: { plans: KnownGapPlan[]; applyResults?: unknown[] } | null): string {
  const lines = [
    `# Direct Web Audit ${AUDIT_RUN_ID}`,
    "",
    `Generated: ${new Date().toISOString()}`,
    `Scope: ${args.start} through ${args.end}, ${args.states.length} jurisdictions`,
    "",
    "## Policy",
    "",
    "- Location: exact when possible; otherwise source-supported surrounding area, LGA, or state-level precision.",
    "- Casualties: victim-only; exact, estimate, range, unknown, and not-reported values are preserved explicitly.",
    "- Trend: post-April stored counts are not evidence of decline while collection strictness changed.",
    "",
    "## Direct Search",
    "",
  ];

  if (scan) {
    const pass = scan.ledgers.filter((row) => row.status === "PASS").length;
    const fail = scan.ledgers.filter((row) => row.status === "FAIL").length;
    const blocked = scan.ledgers.filter((row) => row.status === "BLOCKED").length;
    lines.push(`- Queries: ${scan.tasks}`);
    lines.push(`- PASS: ${pass}`);
    lines.push(`- FAIL: ${fail}`);
    lines.push(`- BLOCKED: ${blocked}`);
    lines.push(`- Lead candidates requiring direct-source confirmation: ${scan.candidates}`);
  } else {
    lines.push("- Search scan skipped by CLI option.");
  }

  lines.push("", "## Guarded Known-Gap Plans", "");
  if (known) {
    for (const plan of known.plans) {
      lines.push(`- ${plan.key}: ${plan.status} - ${plan.reason}`);
    }
    if (known.applyResults) lines.push(`- Apply results written to known-gap-apply-results.json.`);
  } else {
    lines.push("- Known-gap dry-run skipped.");
  }

  lines.push(
    "",
    "## Evidence Boundary",
    "",
    "RSS search results are discovery leads only. Database writes require direct publisher URLs, a deterministic existing-record match, and an idempotency check.",
    "",
  );
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await fs.mkdir(args.outDir, { recursive: true });
  await writeJson(path.join(args.outDir, "manifest.json"), {
    generatedAt: new Date().toISOString(),
    auditRunId: AUDIT_RUN_ID,
    args: { ...args, outDir: path.relative(process.cwd(), args.outDir) },
    revisedPolicy: REVISED_2026_AUDIT_POLICY,
    modelCalls: false,
  });

  const scan = args.knownGapsOnly || args.skipScan ? null : await runSearchScan(args);
  const known = await runKnownGapDryRun(args);
  await writeText(path.join(args.outDir, "final-report.md"), reportMarkdown(args, scan, known));

  console.log(JSON.stringify({
    status: "complete",
    outDir: args.outDir,
    scanQueries: scan?.tasks ?? 0,
    candidateLeads: scan?.candidates ?? 0,
    knownGapPlans: known.plans.length,
    executeKnownGaps: args.executeKnownGaps,
  }, null, 2));
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
