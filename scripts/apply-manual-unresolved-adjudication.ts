import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { normalizeStateName } from "../src/lib/normalize-state";
import { CANONICAL_NIGERIA_JURISDICTIONS } from "../src/lib/incident-audit-contract";
import { normalizeIncidentDate, type IncidentDatePrecision } from "../src/lib/incident-date";

dotenv.config({ path: path.join(process.cwd(), ".env.local"), quiet: true });

type JsonObject = Record<string, any>;
type Input = {
  candidateHash: string;
  eventDate?: string | null;
  datePrecision: IncidentDatePrecision;
  dateRange?: { start?: string | null; end?: string | null };
  location: { state: string; lga: string; town: string; notes?: string };
  locationPrecision: "exact" | "surrounding_area" | "approximate_lga" | "approximate_state";
  casualties: { killed: number | null; injured: number | null; kidnapped: number | null; displaced: number | null };
  casualtyMeta: JsonObject;
  sourceEvidence: Array<{ url: string; title: string; publisher: string; publishedAt: string }>;
  adjudicationNote: string;
};

const OUTPUT_ROOT = path.join(process.cwd(), "audit-2026", "manual-adjudication");
const VALID_STATES = new Set(CANONICAL_NIGERIA_JURISDICTIONS);

function argValue(name: string, fallback?: string): string | undefined {
  const args = process.argv.slice(2);
  const index = args.indexOf(name);
  if (index >= 0) return args[index + 1] || fallback;
  const inline = args.find((arg) => arg.startsWith(`${name}=`));
  return inline ? inline.slice(name.length + 1) : fallback;
}

function hasFlag(name: string): boolean { return process.argv.slice(2).includes(name); }

function stable(value: any): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (typeof value.toHexString === "function") return JSON.stringify(value.toHexString());
  return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => `${JSON.stringify(key)}:${stable(child)}`).join(",")}}`;
}

function sha256(value: any): string { return crypto.createHash("sha256").update(stable(value)).digest("hex"); }
function normalizeUrl(url: string): string { return url.trim().replace(/\/$/, ""); }
function sourceKey(source: JsonObject): string { return normalizeUrl(String(source.url || "")); }

async function readJson(filePath: string): Promise<any> { return JSON.parse(await fs.readFile(filePath, "utf8")); }
async function writeJson(filePath: string, value: any): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function collectionFingerprint(db: mongoose.mongo.Db, name: string): Promise<{ count: number; fingerprint: string }> {
  const rows = await db.collection(name).find({}).sort({ _id: 1 }).toArray();
  return { count: rows.length, fingerprint: sha256(rows) };
}

function sourceType(url: string): "official" | "trusted_media" {
  return /(?:\.gov\.ng|\.mil\.ng)$/i.test(new URL(url).hostname) ? "official" : "trusted_media";
}

function buildNext(candidate: JsonObject, input: Input): JsonObject {
  const existing = Array.isArray(candidate.sources) ? candidate.sources : [];
  const byUrl = new Map(existing.map((source: JsonObject) => [sourceKey(source), source]));
  for (const source of input.sourceEvidence) {
    const url = normalizeUrl(source.url);
    byUrl.set(url, { url, title: source.title, publisher: source.publisher, publishedAt: new Date(source.publishedAt), sourceType: sourceType(url) });
  }
  const dateEvidence = normalizeIncidentDate(input);
  if (!dateEvidence) throw new Error("Manual adjudication requires a valid exact day, bounded date range, or supported month.");
  const next = {
    eventDate: dateEvidence.date,
    datePrecision: dateEvidence.datePrecision,
    dateRange: dateEvidence.dateRange || { start: null, end: null },
    location: input.location,
    locationPrecision: input.locationPrecision,
    casualties: input.casualties,
    casualtyMeta: input.casualtyMeta,
    sources: [...byUrl.values()],
  };
  return { ...next, recordFingerprint: sha256({ candidateHash: candidate.candidateHash, ...next }) };
}

function adjudicatedFields(row: JsonObject): JsonObject {
  return {
    eventDate: row.eventDate,
    datePrecision: row.datePrecision,
    dateRange: row.dateRange,
    location: row.location,
    locationPrecision: row.locationPrecision,
    casualties: row.casualties,
    casualtyMeta: row.casualtyMeta,
    sources: row.sources,
    recordFingerprint: row.recordFingerprint,
  };
}

async function prepare(db: mongoose.mongo.Db, input: Input): Promise<{ candidate: JsonObject; next: JsonObject; attacks: { count: number; fingerprint: string } }> {
  if (!/^[a-f0-9]{64}$/.test(input.candidateHash)) throw new Error("Invalid candidate hash.");
  const state = normalizeStateName(input.location.state);
  if (!VALID_STATES.has(state)) throw new Error(`Invalid Nigerian state: ${input.location.state}`);
  if (!normalizeIncidentDate(input)) throw new Error("Manual adjudication requires a valid exact day, bounded date range, or supported month.");
  if (!input.sourceEvidence || input.sourceEvidence.length < 2) throw new Error("At least two direct source records are required.");
  if (new Set(input.sourceEvidence.map((source) => normalizeUrl(source.url))).size < 2) throw new Error("Source corroboration URLs must be distinct.");
  if (Object.values(input.casualties).some((value) => value !== null && (!Number.isInteger(value) || value < 0))) throw new Error("Casualties must be non-negative integers or null.");
  const candidate = await db.collection("credible_unresolved_incidents").findOne({ candidateHash: input.candidateHash, reviewStatus: "open" });
  if (!candidate) throw new Error("Open unresolved candidate was not found.");
  if (candidate.productionWriteAllowed !== false) throw new Error("Candidate production-write guard is not false.");
  const next = buildNext(candidate, { ...input, location: { ...input.location, state } });
  const attacks = await collectionFingerprint(db, "attacks");
  return { candidate, next, attacks };
}

async function main(): Promise<void> {
  const inputArgument = argValue("--input");
  const apply = hasFlag("--apply");
  const idempotencyPass = hasFlag("--idempotency-pass");
  if (!inputArgument) throw new Error("--input is required.");
  const inputPath = path.resolve(process.cwd(), inputArgument);
  const input = await readJson(inputPath) as Input;
  const runId = argValue("--run-id", `manual-adjudication-${new Date().toISOString().replace(/[-:.]/g, "")}`)!;
  const outputDir = path.join(OUTPUT_ROOT, runId);
  const manifestPath = path.resolve(process.cwd(), argValue("--manifest", path.join(outputDir, "promotion-manifest.json"))!);
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required; no database work was performed.");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000, socketTimeoutMS: 45000 });
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB database handle unavailable.");
  try {
    if (!apply) {
      const prepared = await prepare(db, input);
      const manifest = {
        mode: "dry-run",
        ready: true,
        generatedAt: new Date().toISOString(),
        inputPath,
        inputSha256: sha256(await fs.readFile(inputPath, "utf8")),
        candidateHash: input.candidateHash,
        databaseBefore: { attacks: prepared.attacks, candidateFingerprint: sha256(prepared.candidate) },
        candidateBefore: prepared.candidate,
        nextCandidate: prepared.next,
        adjudicationNote: input.adjudicationNote,
        writePolicy: "Only the named open unresolved candidate may be updated. The attacks collection is read-only during adjudication.",
      };
      await writeJson(manifestPath, manifest);
      console.log(JSON.stringify({ phase: "manual-unresolved-adjudication-dry-run", status: "PASS", manifestPath, candidateHash: input.candidateHash }, null, 2));
      return;
    }
    const manifest = await readJson(manifestPath);
    if (manifest.mode !== "dry-run" || manifest.ready !== true) throw new Error("Manual adjudication manifest is not an approved dry run.");
    if (sha256(await fs.readFile(inputPath, "utf8")) !== manifest.inputSha256) throw new Error("Manual adjudication input changed after dry run.");
    const current = await prepare(db, input);
    const candidateMatchesExpected = idempotencyPass
      ? sha256(adjudicatedFields(current.candidate)) === sha256(adjudicatedFields(manifest.nextCandidate))
      : sha256(current.candidate) === sha256(manifest.candidateBefore);
    if (!candidateMatchesExpected || current.attacks.fingerprint !== manifest.databaseBefore.attacks.fingerprint) throw new Error("Database snapshot changed after dry run; no mutation attempted.");
    let modified = 0;
    if (sha256(adjudicatedFields(current.candidate)) !== sha256(adjudicatedFields(manifest.nextCandidate))) {
      const result = await db.collection("credible_unresolved_incidents").updateOne(
        { _id: current.candidate._id, candidateHash: input.candidateHash, reviewStatus: "open" },
        { $set: { ...manifest.nextCandidate, updatedAt: new Date() } },
      );
      modified = result.modifiedCount;
    }
    const afterCandidate = await db.collection("credible_unresolved_incidents").findOne({ candidateHash: input.candidateHash });
    const afterAttacks = await collectionFingerprint(db, "attacks");
    if (afterAttacks.fingerprint !== current.attacks.fingerprint) throw new Error("Safety invariant failed: attacks collection changed.");
    if (!afterCandidate || sha256(adjudicatedFields(afterCandidate)) !== sha256(adjudicatedFields(manifest.nextCandidate))) throw new Error("Post-apply candidate verification failed.");
    const outputPath = path.join(path.dirname(manifestPath), idempotencyPass ? "idempotency-result.json" : "apply-result.json");
    await writeJson(outputPath, { phase: idempotencyPass ? "manual-unresolved-adjudication-idempotency" : "manual-unresolved-adjudication-apply", status: "PASS", modified, attacksUnchanged: true, afterCandidate, afterAttacks });
    if (!idempotencyPass) {
      manifest.afterCandidate = afterCandidate;
      await writeJson(manifestPath, manifest);
    }
    console.log(JSON.stringify({ phase: idempotencyPass ? "manual-unresolved-adjudication-idempotency" : "manual-unresolved-adjudication-apply", status: "PASS", outputPath, modified, attacksUnchanged: true }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "FAIL", error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exitCode = 1;
});
