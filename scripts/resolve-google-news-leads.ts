/**
 * Resolve Google News RSS leads to direct publisher pages without touching MongoDB.
 *
 * Usage:
 *   npx tsx scripts/resolve-google-news-leads.ts \
 *     --input=audit-2026/<run>/unresolved-candidates.jsonl \
 *     --out=audit-2026/<run>/resolved-candidates.jsonl
 *
 * Title search is enabled by default for this focused recovery pass. Use
 * --no-title-search for redirect/canonical/source-url resolution only. Use
 * --only-unresolved when rerunning an enriched ledger to avoid refetching
 * leads that already have a passing direct-source result.
 */

import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import {
  createNewsLeadResolver,
  normalizeNewsUrl,
  type NewsLead,
  type NewsResolution,
  type NewsSearchProvider,
} from "../src/lib/news-source-resolver";

dotenv.config({ path: path.join(process.cwd(), ".env.local"), quiet: true });

type JsonObject = Record<string, unknown>;

type Args = {
  input: string;
  out: string;
  resolutionLedger: string;
  summary: string;
  concurrency: number;
  timeoutMs: number;
  searchDelayMs: number;
  titleSearch: boolean;
  onlyUnresolved: boolean;
  searchProvider: NewsSearchProvider;
  limit: number | null;
};

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function optionalString(value: unknown): string | null {
  const result = stringValue(value).trim();
  return result || null;
}

function argValue(argv: string[], prefix: string): string | undefined {
  return argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function parseArgs(argv: string[]): Args {
  const input = argValue(argv, "--input=");
  if (!input) throw new Error("--input=path/to/candidates.jsonl is required");
  const inputPath = path.resolve(process.cwd(), input);
  const defaultStem = inputPath.replace(/\.jsonl$/i, "");
  const providerValue = argValue(argv, "--search-provider=") || "auto";
  const searchProvider: NewsSearchProvider = ["auto", "duckduckgo", "brave", "none"].includes(providerValue)
    ? providerValue as NewsSearchProvider
    : "auto";
  const concurrency = Math.min(6, Math.max(1, Number(argValue(argv, "--concurrency=")) || 2));
  const timeoutMs = Math.max(1_000, Number(argValue(argv, "--timeout-ms=")) || 12_000);
  const searchDelayMs = Math.max(0, Number(argValue(argv, "--search-delay-ms=")) || 350);
  const limitValue = Number(argValue(argv, "--limit="));
  return {
    input: inputPath,
    out: path.resolve(process.cwd(), argValue(argv, "--out=") || `${defaultStem}-resolved.jsonl`),
    resolutionLedger: path.resolve(process.cwd(), argValue(argv, "--resolution-ledger=") || `${defaultStem}-resolution-ledger.jsonl`),
    summary: path.resolve(process.cwd(), argValue(argv, "--summary=") || `${defaultStem}-resolution-summary.json`),
    concurrency,
    timeoutMs,
    searchDelayMs,
    titleSearch: !argv.includes("--no-title-search"),
    onlyUnresolved: argv.includes("--only-unresolved"),
    searchProvider,
    limit: Number.isFinite(limitValue) && limitValue > 0 ? Math.floor(limitValue) : null,
  };
}

async function readJsonl(file: string): Promise<JsonObject[]> {
  const text = await fs.readFile(file, "utf8");
  return text.split(/\r?\n/).filter(Boolean).map((line, index) => {
    const parsed: unknown = JSON.parse(line);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error(`Input line ${index + 1} is not a JSON object`);
    }
    return parsed as JsonObject;
  });
}

async function writeJsonl(file: string, rows: unknown[]): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, rows.length ? `${rows.map((row) => JSON.stringify(row)).join("\n")}\n` : "", "utf8");
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
  onProgress?: (completed: number, total: number) => void,
): Promise<R[]> {
  const output = new Array<R>(items.length);
  let next = 0;
  let completed = 0;
  async function runWorker(): Promise<void> {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      output[index] = await worker(items[index], index);
      completed++;
      onProgress?.(completed, items.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => runWorker()));
  return output;
}

function candidateKey(row: JsonObject): string {
  const googleUrl = optionalString(row.googleNewsUrl) || optionalString(row.url);
  return normalizeNewsUrl(googleUrl) || googleUrl || JSON.stringify(row);
}

function leadFromRow(row: JsonObject): NewsLead {
  const googleNewsUrl = optionalString(row.googleNewsUrl) || optionalString(row.url);
  if (!googleNewsUrl) throw new Error("Candidate has no googleNewsUrl");
  return {
    googleNewsUrl,
    sourceUrl: optionalString(row.directUrl) || optionalString(row.rssSourceUrl) || optionalString(row.sourceUrl),
    sourceDomain: optionalString(row.sourceDomain),
    publisher: optionalString(row.publisher),
    headline: stringValue(row.title) || stringValue(row.headline),
    publishedAt: optionalString(row.publishedAt),
  };
}

function applyResolution(row: JsonObject, resolution: NewsResolution): JsonObject {
  return {
    ...row,
    directUrl: resolution.resolvedSourceUrl,
    directUrlStatus: resolution.resolutionStatus,
    directFetchStatus: resolution.directFetchStatus,
    resolutionStatus: resolution.resolutionStatus,
    resolutionMethod: resolution.resolutionMethod,
    resolutionReason: resolution.reason,
    directArticleTitle: resolution.articleTitle,
    directArticlePublishedAt: resolution.articlePublishedAt,
    directContentDigest: resolution.contentDigest,
    titleSimilarity: resolution.titleSimilarity,
  };
}

function counts<T extends string>(values: T[], keys: readonly T[]): Record<T, number> {
  return Object.fromEntries(keys.map((key) => [key, values.filter((value) => value === key).length])) as Record<T, number>;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const allRows = await readJsonl(args.input);
  const rows = args.limit ? allRows.slice(0, args.limit) : allRows;
  const rowsToResolve = args.onlyUnresolved
    ? rows.filter((row) => optionalString(row.resolutionStatus) !== "PASS" || optionalString(row.directFetchStatus) !== "PASS")
    : rows;
  const uniqueRows = [...new Map(rowsToResolve.map((row) => [candidateKey(row), row])).values()];
  const resolver = createNewsLeadResolver({
    timeoutMs: args.timeoutMs,
    titleSearch: args.titleSearch,
    searchProvider: args.searchProvider,
    searchDelayMs: args.searchDelayMs,
  });
  let lastProgress = 0;
  const resolutions = await mapLimit(uniqueRows, args.concurrency, async (row) => resolver.resolve(leadFromRow(row)), (completed) => {
    if (completed === uniqueRows.length || completed - lastProgress >= 50) {
      lastProgress = completed;
      console.log(JSON.stringify({ phase: "google-news-resolution", completed, total: uniqueRows.length, titleSearch: args.titleSearch }));
    }
  });
  const byKey = new Map(resolutions.map((resolution) => [normalizeNewsUrl(resolution.googleNewsUrl) || resolution.googleNewsUrl, resolution]));
  const enrichedRows = rows.map((row) => {
    const resolution = byKey.get(candidateKey(row));
    return resolution ? applyResolution(row, resolution) : row;
  });
  await writeJsonl(args.out, enrichedRows);
  await writeJsonl(args.resolutionLedger, resolutions);
  await writeJson(args.summary, {
    generatedAt: new Date().toISOString(),
    input: args.input,
    output: args.out,
    resolutionLedger: args.resolutionLedger,
    inputRows: rows.length,
    sourceInputRows: allRows.length,
    uniqueGoogleNewsUrls: uniqueRows.length,
    resolutionStatus: counts(resolutions.map((row) => row.resolutionStatus), ["PASS", "BLOCKED", "UNRESOLVED", "FAIL"] as const),
    resolutionMethod: counts(resolutions.map((row) => row.resolutionMethod), ["RSS_SOURCE_URL", "HTTP_REDIRECT", "CANONICAL_TAG", "PUBLISHER_SITE_SEARCH", "PUBLISHER_TITLE_SEARCH", "NONE"] as const),
    directFetchStatus: counts(resolutions.map((row) => row.directFetchStatus), ["PASS", "PARTIAL", "BLOCKED", "FAIL", "NOT_ATTEMPTED"] as const),
    titleSearch: args.titleSearch,
    onlyUnresolved: args.onlyUnresolved,
    searchProvider: args.searchProvider,
    writePolicy: "Read-only source resolution. This script never connects to MongoDB and never inserts or updates Attack records.",
  });
  console.log(JSON.stringify({ status: "complete", inputRows: rows.length, uniqueGoogleNewsUrls: uniqueRows.length, output: args.out }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
