import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import {
  domainFromNewsUrl,
  isUsableNewsArticleUrl,
  normalizeNewsUrl,
  publisherDomainHint,
} from "../src/lib/news-source-resolver";
import { CANONICAL_NIGERIA_JURISDICTIONS } from "../src/lib/incident-audit-contract";
import { normalizeStateName } from "../src/lib/normalize-state";

dotenv.config({ path: path.join(process.cwd(), ".env.local"), quiet: true });

type JsonObject = Record<string, unknown>;

type SourceType = "official" | "trusted_media" | "structured_dataset";

type ResolutionCandidate = {
  candidateHash: string;
  auditRunId: string;
  headline: string;
  description: string;
  incidentType: "abduction" | "armed_attack" | "IED" | "communal_violence" | "other";
  eventDate: null;
  datePrecision: "unknown";
  dateRange: { start: null; end: null };
  location: { state: string; lga: string; town: string };
  locationPrecision: "exact" | "surrounding_area" | "approximate_lga" | "approximate_state";
  group: string;
  casualties: { killed: null; injured: null; kidnapped: null; displaced: null };
  casualtyMeta: {
    killed: { precision: "unknown" };
    injured: { precision: "unknown" };
    kidnapped: { precision: "unknown" };
    displaced: { precision: "unknown" };
  };
  sources: ResolutionSource[];
  reasonCodes: string[];
  requiredNextEvidence: string;
  productionWriteAllowed: false;
  reviewStatus: "open";
  recordFingerprint: string;
};

type ResolutionSource = {
  url: string;
  title: string;
  publisher: string;
  publishedAt: string | null;
  sourceType: SourceType;
};

type ResolutionSourceArticle = {
  url: string;
  publisher: string;
  title: string;
  publishedAt: string;
  incidentDate: null;
  outcome: "reference";
  reason: string;
  attackId: null;
};

type StoredResolutionSource = Omit<ResolutionSource, "publishedAt"> & { publishedAt: Date | null };

type PreparedRecord = {
  candidate: ResolutionCandidate;
  sourceArticle: ResolutionSourceArticle | null;
};

type DatabaseCollectionState = {
  count: number;
  fingerprint: string;
};

type DatabaseState = {
  attacks: DatabaseCollectionState;
  unresolved: DatabaseCollectionState;
  sourceArticles: DatabaseCollectionState;
};

type DryRunSummary = {
  inputRows: number;
  passRows: number;
  eligibleCandidates: number;
  eligibleSourceArticles: number;
  skipped: Record<string, number>;
};

type ResolutionManifest = {
  mode: "dry-run";
  generatedAt: string;
  inputPath: string;
  inputSha256: string;
  databaseBefore: DatabaseState;
  summary: DryRunSummary;
  candidates: ResolutionCandidate[];
  sourceArticles: ResolutionSourceArticle[];
  ready: true;
  writePolicy: string;
};

const OUTPUT_ROOT = path.join(process.cwd(), "audit-2026", "google-resolution-write");
const REASON_CODES = new Set([
  "DATE_CONFLICT",
  "DATE_NOT_STATED",
  "LOCATION_INSUFFICIENT",
  "ORIGINAL_INCIDENT_UNCLEAR",
  "POSSIBLE_DUPLICATE",
  "SOURCE_ACCESS_LIMITATION",
]);
const LOCATION_PRECISIONS = new Set(["exact", "surrounding_area", "approximate_lga", "approximate_state"]);
const VALID_STATES: Set<string> = new Set(CANONICAL_NIGERIA_JURISDICTIONS);
const DEFAULT_NEXT_EVIDENCE = "Establish the original incident date, event narrative, victim-only impact, and duplicate identity before any public Attack promotion.";
const SOURCE_ARTICLE_REASON = "Direct publisher article resolved from a Google News lead; original event date and incident scope remain unresolved.";

function clean(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() || fallback : fallback;
}

function optionalString(row: JsonObject, key: string): string | null {
  const value = clean(row[key]);
  return value || null;
}

function sha256(value: unknown): string {
  return crypto.createHash("sha256").update(stableStringify(value)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if ("toHexString" in value && typeof value.toHexString === "function") {
    return JSON.stringify(value.toHexString());
  }
  const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right));
  return `{${entries.map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`).join(",")}}`;
}

function parseDate(value: unknown): string | null {
  const text = clean(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeInputPath(value: string): string {
  return path.resolve(process.cwd(), value);
}

function argValue(name: string, fallback?: string): string | undefined {
  const argv = process.argv.slice(2);
  const exactIndex = argv.indexOf(name);
  if (exactIndex >= 0) return argv[exactIndex + 1] || fallback;
  const prefix = `${name}=`;
  const inline = argv.find((arg) => arg.startsWith(prefix));
  return inline ? inline.slice(prefix.length) : fallback;
}

function hasFlag(name: string): boolean {
  return process.argv.slice(2).includes(name);
}

async function readJsonl(filePath: string): Promise<JsonObject[]> {
  const text = await fs.readFile(filePath, "utf8");
  return text.split(/\r?\n/).filter(Boolean).map((line, index) => {
    const parsed = JSON.parse(line) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error(`JSONL row ${index + 1} is not an object.`);
    }
    return parsed as JsonObject;
  });
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function resolutionStatus(row: JsonObject): string {
  return optionalString(row, "resolutionStatus") || "UNRESOLVED";
}

function directFetchStatus(row: JsonObject): string {
  return optionalString(row, "directFetchStatus") || "NOT_ATTEMPTED";
}

function inferIncidentType(row: JsonObject): ResolutionCandidate["incidentType"] {
  const text = `${optionalString(row, "title") || ""} ${optionalString(row, "eventSignals") || ""}`.toLowerCase();
  if (/\b(ied|bomb|explosion)\b/.test(text)) return "IED";
  if (/\b(communal|farmer|herder|intercommunity)\b/.test(text)) return "communal_violence";
  if (/\b(kidnap|abduct|hostage|captive)\b/.test(text)) return "abduction";
  if (/\b(attack|ambush|raid|shoot|gunmen|bandits?|terrorists?|insurgents?|clash)\b/.test(text)) return "armed_attack";
  return "other";
}

function sourceTypeFor(url: string): SourceType {
  const domain = domainFromNewsUrl(url) || "";
  return /(?:\.gov\.ng|\.mil\.ng|police\.gov\.ng|defencehq\.mil\.ng)$/i.test(domain) ? "official" : "trusted_media";
}

function stateFor(row: JsonObject): string | null {
  const state = normalizeStateName(optionalString(row, "jurisdiction") || "");
  return VALID_STATES.has(state) ? state : null;
}

function locationPrecisionFor(row: JsonObject): ResolutionCandidate["locationPrecision"] {
  const value = optionalString(row, "locationPrecision") || "approximate_state";
  return LOCATION_PRECISIONS.has(value) ? value as ResolutionCandidate["locationPrecision"] : "approximate_state";
}

function candidateHashFor(row: JsonObject): string {
  const existing = optionalString(row, "candidateHash");
  if (existing && /^[a-f0-9]{64}$/.test(existing)) return existing;
  return sha256({
    auditRunId: optionalString(row, "auditRunId"),
    googleNewsUrl: optionalString(row, "googleNewsUrl"),
    title: optionalString(row, "title"),
    jurisdiction: optionalString(row, "jurisdiction"),
    periodStart: optionalString(row, "periodStart"),
  });
}

function sameDomainOrSubdomain(actual: string | null, expected: string | null): boolean {
  return Boolean(actual && expected && (actual === expected || actual.endsWith(`.${expected}`)));
}

function prepareRow(row: JsonObject): { prepared: PreparedRecord | null; reason: string | null } {
  if (resolutionStatus(row) !== "PASS") return { prepared: null, reason: "RESOLUTION_NOT_PASS" };
  if (directFetchStatus(row) !== "PASS") return { prepared: null, reason: "DIRECT_FETCH_NOT_PASS" };

  const directUrl = normalizeNewsUrl(optionalString(row, "directUrl"));
  if (!isUsableNewsArticleUrl(directUrl)) return { prepared: null, reason: "DIRECT_URL_NOT_USABLE" };

  const publisher = clean(optionalString(row, "publisher"), "Unknown publisher");
  const actualDomain = domainFromNewsUrl(directUrl);
  const expectedDomain = publisherDomainHint(publisher) || domainFromNewsUrl(optionalString(row, "sourceDomain"));
  if (expectedDomain && !sameDomainOrSubdomain(actualDomain, expectedDomain)) {
    return { prepared: null, reason: "RESOLVED_DOMAIN_MISMATCH" };
  }

  const state = stateFor(row);
  if (!state) return { prepared: null, reason: "INVALID_NIGERIAN_STATE" };

  const headline = clean(optionalString(row, "title"), "Unresolved incident lead");
  const articleTitle = clean(optionalString(row, "directArticleTitle"), headline);
  const publishedAt = parseDate(optionalString(row, "directArticlePublishedAt"));
  const source: ResolutionSource = {
    url: directUrl,
    title: articleTitle,
    publisher,
    publishedAt,
    sourceType: sourceTypeFor(directUrl),
  };
  const candidateWithoutFingerprint: Omit<ResolutionCandidate, "recordFingerprint"> = {
    candidateHash: candidateHashFor(row),
    auditRunId: clean(optionalString(row, "auditRunId"), "google-news-resolution-2026"),
    headline,
    description: "Direct publisher source resolved; original event date and incident details remain under review.",
    incidentType: inferIncidentType(row),
    eventDate: null,
    datePrecision: "unknown",
    dateRange: { start: null, end: null },
    location: {
      state,
      lga: clean(optionalString(row, "lga"), "Unknown"),
      town: clean(optionalString(row, "town"), "Unknown"),
    },
    locationPrecision: locationPrecisionFor(row),
    group: "Unknown",
    casualties: { killed: null, injured: null, kidnapped: null, displaced: null },
    casualtyMeta: {
      killed: { precision: "unknown" },
      injured: { precision: "unknown" },
      kidnapped: { precision: "unknown" },
      displaced: { precision: "unknown" },
    },
    sources: [source],
    reasonCodes: [REASON_CODES.has(optionalString(row, "reasonCode") || "") ? optionalString(row, "reasonCode") as string : "ORIGINAL_INCIDENT_UNCLEAR"],
    requiredNextEvidence: DEFAULT_NEXT_EVIDENCE,
    productionWriteAllowed: false,
    reviewStatus: "open",
  };
  const candidate: ResolutionCandidate = {
    ...candidateWithoutFingerprint,
    recordFingerprint: sha256(candidateWithoutFingerprint),
  };
  const sourceArticle: ResolutionSourceArticle | null = publishedAt ? {
    url: directUrl,
    publisher,
    title: articleTitle,
    publishedAt,
    incidentDate: null,
    outcome: "reference",
    reason: SOURCE_ARTICLE_REASON,
    attackId: null,
  } : null;
  return { prepared: { candidate, sourceArticle }, reason: null };
}

function prepareRows(rows: JsonObject[]): { records: PreparedRecord[]; summary: DryRunSummary } {
  const records: PreparedRecord[] = [];
  const seenHashes = new Set<string>();
  const seenUrls = new Set<string>();
  const skipped: Record<string, number> = {};
  let passRows = 0;
  const increment = (key: string) => { skipped[key] = (skipped[key] || 0) + 1; };

  for (const row of rows) {
    if (resolutionStatus(row) === "PASS") passRows += 1;
    const result = prepareRow(row);
    if (!result.prepared) {
      increment(result.reason || "NOT_ELIGIBLE");
      continue;
    }
    const { candidate, sourceArticle } = result.prepared;
    if (seenHashes.has(candidate.candidateHash)) {
      increment("DUPLICATE_CANDIDATE_HASH");
      continue;
    }
    const sourceUrl = candidate.sources[0].url;
    if (seenUrls.has(sourceUrl)) increment("DUPLICATE_SOURCE_URL");
    seenHashes.add(candidate.candidateHash);
    seenUrls.add(sourceUrl);
    records.push({ candidate, sourceArticle });
  }

  const uniqueSourceArticles = new Map<string, ResolutionSourceArticle>();
  for (const record of records) {
    if (record.sourceArticle) uniqueSourceArticles.set(record.sourceArticle.url, record.sourceArticle);
  }
  return {
    records,
    summary: {
      inputRows: rows.length,
      passRows,
      eligibleCandidates: records.length,
      eligibleSourceArticles: uniqueSourceArticles.size,
      skipped,
    },
  };
}

function canonicalize(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonicalize);
  if ("toHexString" in value && typeof value.toHexString === "function") return value.toHexString();
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, child]) => [key, canonicalize(child)]));
}

async function collectionState(db: mongoose.mongo.Db, name: string): Promise<DatabaseCollectionState> {
  const rows = await db.collection(name).find({}).sort({ _id: 1 }).toArray();
  return { count: rows.length, fingerprint: sha256(rows.map((row) => canonicalize(row))) };
}

async function databaseState(db: mongoose.mongo.Db): Promise<DatabaseState> {
  const [attacks, unresolved, sourceArticles] = await Promise.all([
    collectionState(db, "attacks"),
    collectionState(db, "credible_unresolved_incidents"),
    collectionState(db, "sourcearticles"),
  ]);
  return { attacks, unresolved, sourceArticles };
}

function databaseStateEqual(left: DatabaseState, right: DatabaseState): boolean {
  return left.attacks.fingerprint === right.attacks.fingerprint
    && left.unresolved.fingerprint === right.unresolved.fingerprint
    && left.sourceArticles.fingerprint === right.sourceArticles.fingerprint;
}

function sourceKey(source: JsonObject): string {
  return normalizeNewsUrl(clean(source.url)) || clean(source.url);
}

function sourceRows(value: unknown): JsonObject[] {
  return Array.isArray(value) ? value.filter((row): row is JsonObject => Boolean(row && typeof row === "object" && !Array.isArray(row))) : [];
}

function mergedSources(existing: unknown, incoming: ResolutionSource[]): ResolutionSource[] {
  const output: ResolutionSource[] = [];
  const seen = new Set<string>();
  for (const source of [...sourceRows(existing), ...incoming]) {
    const url = normalizeNewsUrl(clean(source.url));
    if (!url || seen.has(url)) continue;
    seen.add(url);
    output.push({
      url,
      title: clean(source.title, "Direct incident source"),
      publisher: clean(source.publisher, "Unknown publisher"),
      publishedAt: parseDate(source.publishedAt),
      sourceType: source.sourceType === "official" || source.sourceType === "structured_dataset" ? source.sourceType : "trusted_media",
    });
  }
  return output;
}

function sourcesEqual(left: unknown, right: ResolutionSource[]): boolean {
  return stableStringify(mergedSources(left, [])) === stableStringify(right);
}

function sourceDatesNeedNormalization(value: unknown): boolean {
  return sourceRows(value).some((source) => typeof source.publishedAt === "string");
}

function storedSources(sources: ResolutionSource[]): StoredResolutionSource[] {
  return sources.map((source) => ({
    ...source,
    publishedAt: source.publishedAt ? new Date(source.publishedAt) : null,
  }));
}

async function applyRecords(
  db: mongoose.mongo.Db,
  records: PreparedRecord[],
): Promise<{ unresolvedInserted: number; unresolvedUpdated: number; unresolvedNoOp: number; sourceArticlesInserted: number; sourceArticlesUpdated: number; sourceArticlesNoOp: number }> {
  const unresolved = db.collection("credible_unresolved_incidents");
  const sourceArticles = db.collection("sourcearticles");
  const candidateHashes = records.map(({ candidate }) => candidate.candidateHash);
  const existingRows = await unresolved.find({ candidateHash: { $in: candidateHashes } }).toArray();
  const existingByHash = new Map(existingRows.map((row) => [String(row.candidateHash), row as JsonObject]));
  let unresolvedInserted = 0;
  let unresolvedUpdated = 0;
  let unresolvedNoOp = 0;
  const now = new Date();

  for (const record of records) {
    const existing = existingByHash.get(record.candidate.candidateHash);
    if (!existing) {
      await unresolved.insertOne({ ...record.candidate, sources: storedSources(record.candidate.sources), createdAt: now, updatedAt: now });
      unresolvedInserted += 1;
      continue;
    }
    if (clean(existing.reviewStatus) !== "open") {
      unresolvedNoOp += 1;
      continue;
    }
    const nextSources = mergedSources(existing.sources, record.candidate.sources);
    if (sourcesEqual(existing.sources, nextSources) && !sourceDatesNeedNormalization(existing.sources)) {
      unresolvedNoOp += 1;
      continue;
    }
    const nextFingerprint = sha256({
      candidateHash: record.candidate.candidateHash,
      sources: nextSources,
      existingFingerprint: clean(existing.recordFingerprint),
    });
    await unresolved.updateOne(
      { _id: existing._id, reviewStatus: "open" },
      { $set: { sources: storedSources(nextSources), recordFingerprint: nextFingerprint, updatedAt: now } },
    );
    unresolvedUpdated += 1;
  }

  const articleByUrl = new Map<string, ResolutionSourceArticle>();
  for (const record of records) if (record.sourceArticle) articleByUrl.set(record.sourceArticle.url, record.sourceArticle);
  const articleUrls = [...articleByUrl.keys()];
  const existingArticles = articleUrls.length ? await sourceArticles.find({ url: { $in: articleUrls } }).project({ url: 1, publishedAt: 1 }).toArray() : [];
  const existingArticlesByUrl = new Map(existingArticles.map((row) => [sourceKey(row as JsonObject), row as JsonObject]));
  const newArticles = [...articleByUrl.values()].filter((article) => !existingArticlesByUrl.has(article.url));
  const articlesToNormalize = [...articleByUrl.values()].filter((article) => {
    const existing = existingArticlesByUrl.get(article.url);
    return Boolean(existing && typeof existing.publishedAt === "string");
  });
  if (newArticles.length) {
    await sourceArticles.insertMany(newArticles.map((article) => ({ ...article, publishedAt: new Date(article.publishedAt), createdAt: now, updatedAt: now })), { ordered: true });
  }
  for (const article of articlesToNormalize) {
    await sourceArticles.updateOne({ url: article.url }, { $set: { publishedAt: new Date(article.publishedAt), updatedAt: now } });
  }
  return {
    unresolvedInserted,
    unresolvedUpdated,
    unresolvedNoOp,
    sourceArticlesInserted: newArticles.length,
    sourceArticlesUpdated: articlesToNormalize.length,
    sourceArticlesNoOp: articleUrls.length - newArticles.length - articlesToNormalize.length,
  };
}

async function main(): Promise<void> {
  const inputArgument = argValue("--input");
  const apply = hasFlag("--apply");
  const idempotencyPass = hasFlag("--idempotency-pass");
  if (!inputArgument && !apply) throw new Error("--input is required for a dry run.");

  const manifestArgument = argValue("--manifest");
  const runId = argValue("--run-id", `google-resolution-${new Date().toISOString().replace(/[-:.]/g, "").replace(/Z$/, "Z")}`)!;
  const outputDir = path.join(OUTPUT_ROOT, runId);
  const manifestPath = manifestArgument ? normalizeInputPath(manifestArgument) : path.join(outputDir, "promotion-manifest.json");
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required in .env.local.");

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000, socketTimeoutMS: 45000 });
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection did not expose a database handle.");

  try {
    if (!apply) {
      const inputPath = normalizeInputPath(inputArgument!);
      const rows = await readJsonl(inputPath);
      const prepared = prepareRows(rows);
      const before = await databaseState(db);
      const manifest: ResolutionManifest = {
        mode: "dry-run",
        generatedAt: new Date().toISOString(),
        inputPath,
        inputSha256: sha256(await fs.readFile(inputPath, "utf8")),
        databaseBefore: before,
        summary: prepared.summary,
        candidates: prepared.records.map((record) => record.candidate),
        sourceArticles: [...new Map(prepared.records.filter((record): record is PreparedRecord & { sourceArticle: ResolutionSourceArticle } => Boolean(record.sourceArticle)).map((record) => [record.sourceArticle.url, record.sourceArticle])).values()],
        ready: true,
        writePolicy: "Explicit apply writes only unresolved evidence candidates and reference source articles. The attacks collection is read-only and must remain fingerprint-identical.",
      };
      await writeJson(manifestPath, manifest);
      await writeJson(path.join(path.dirname(manifestPath), "promotion-summary.json"), prepared.summary);
      console.log(JSON.stringify({ phase: "google-source-resolution-dry-run", status: "PASS", manifestPath, summary: prepared.summary }, null, 2));
      return;
    }

    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8")) as ResolutionManifest;
    if (manifest.mode !== "dry-run" || manifest.ready !== true) throw new Error("The manifest is not an approved dry-run manifest.");
    const inputPath = normalizeInputPath(inputArgument || manifest.inputPath);
    const currentInputHash = sha256(await fs.readFile(inputPath, "utf8"));
    if (inputPath !== normalizeInputPath(manifest.inputPath) || currentInputHash !== manifest.inputSha256) {
      throw new Error("Google resolution input changed after dry-run; rerun the dry run before applying.");
    }
    let expectedBefore = manifest.databaseBefore;
    if (idempotencyPass) {
      const applyResultPath = path.join(path.dirname(manifestPath), "apply-result.json");
      const priorApply = JSON.parse(await fs.readFile(applyResultPath, "utf8")) as { after?: DatabaseState };
      if (!priorApply.after) throw new Error("The initial apply result is missing its post-apply database state.");
      expectedBefore = priorApply.after;
    }
    const currentBefore = await databaseState(db);
    if (!databaseStateEqual(currentBefore, expectedBefore)) {
      const blocked = {
        phase: idempotencyPass ? "google-source-resolution-idempotency" : "google-source-resolution-apply",
        status: "BLOCKED",
        reason: "Database snapshot changed after dry-run; no MongoDB mutations were attempted.",
        expected: expectedBefore,
        actual: currentBefore,
      };
      await writeJson(path.join(path.dirname(manifestPath), idempotencyPass ? "idempotency-blocked.json" : "apply-blocked.json"), blocked);
      console.log(JSON.stringify(blocked, null, 2));
      process.exitCode = 2;
      return;
    }

    const records: PreparedRecord[] = manifest.candidates.map((candidate) => ({ candidate, sourceArticle: manifest.sourceArticles.find((article) => article.url === candidate.sources[0]?.url) || null }));
    const result = await applyRecords(db, records);
    const after = await databaseState(db);
    if (after.attacks.fingerprint !== expectedBefore.attacks.fingerprint) {
      throw new Error("Safety invariant failed: the attacks collection changed during source-resolution apply.");
    }
    const expectedUnresolvedCount = expectedBefore.unresolved.count + result.unresolvedInserted;
    const expectedSourceArticleCount = expectedBefore.sourceArticles.count + result.sourceArticlesInserted;
    if (after.unresolved.count !== expectedUnresolvedCount || after.sourceArticles.count !== expectedSourceArticleCount) {
      throw new Error(`Unexpected post-apply counts: unresolved ${after.unresolved.count}/${expectedUnresolvedCount}, sourcearticles ${after.sourceArticles.count}/${expectedSourceArticleCount}.`);
    }
    const outputPath = path.join(path.dirname(manifestPath), idempotencyPass ? "idempotency-result.json" : "apply-result.json");
    await writeJson(outputPath, {
      phase: idempotencyPass ? "google-source-resolution-idempotency" : "google-source-resolution-apply",
      status: "PASS",
      generatedAt: new Date().toISOString(),
      before: expectedBefore,
      after,
      result,
      attacksUnchanged: true,
    });
    console.log(JSON.stringify({ phase: idempotencyPass ? "google-source-resolution-idempotency" : "google-source-resolution-apply", status: "PASS", outputPath, ...result, attacksUnchanged: true }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "FAIL", error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exitCode = 1;
});
