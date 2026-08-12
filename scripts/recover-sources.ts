/**
 * Recovery script: for attacks that were soft-deleted because ALL sources were bad
 * and Brave Search failed (HTTP 422 due to bad params), try again with fixed params.
 *
 * Attacks that get valid replacements are un-deleted.
 * Attacks with no replacements remain soft-deleted.
 *
 * Usage:
 *   npx ts-node scripts/recover-sources.ts            # dry run
 *   npx ts-node scripts/recover-sources.ts --execute  # apply
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";

const MONGO_URI     = process.env.MONGODB_URI;
const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY;

if (!MONGO_URI)     { console.error("Missing MONGODB_URI");          process.exit(1); }
if (!BRAVE_API_KEY) { console.error("Missing BRAVE_SEARCH_API_KEY"); process.exit(1); }

const IS_EXECUTE  = process.argv.includes("--execute");
const BRAVE_DELAY = 1500;
const HTTP_TIMEOUT = 9000;

// ---------------------------------------------------------------------------
// Trusted domains
// ---------------------------------------------------------------------------

const TRUSTED_DOMAINS = new Set([
  "premiumtimesng.com", "thecable.ng", "gazettengr.com", "channelstv.com",
  "saharareporters.com", "punchng.com", "vanguardngr.com", "dailytrust.com",
  "humanglemedia.com", "guardian.ng", "dailypost.ng", "newscentral.africa",
  "arise.tv", "tvcnews.tv", "thisdaylive.com", "thenationonlineng.net",
  "leadership.ng", "sunnewsonline.com", "tribuneonlineng.com", "blueprint.ng",
  "businessday.ng", "thewhistler.ng", "icirnigeria.org", "ripplesnigeria.com",
  "dailynigerian.com", "prnigeria.com", "parallelfactsnews.com",
  "aljazeera.com", "dw.com", "news.sky.com", "bbc.com", "bbc.co.uk",
  "cnn.com", "france24.com", "voanews.com", "apnews.com", "reuters.com",
  "acleddata.com", "network.zagazola.org", "pulse.ng",
]);

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

function isTrustedDomain(url: string): boolean {
  const domain = extractDomain(url);
  if (!domain) return false;
  if (TRUSTED_DOMAINS.has(domain)) return true;
  const parts = domain.split(".");
  return parts.length > 2 && TRUSTED_DOMAINS.has(parts.slice(-2).join("."));
}

// ---------------------------------------------------------------------------
// URL validation
// ---------------------------------------------------------------------------

const IMAGE_EXTS = new Set([".svg",".png",".jpg",".jpeg",".gif",".webp",".mp4",".pdf",".json",".xml",".ico"]);

function isStaticallyValid(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!["http:","https:"].includes(parsed.protocol)) return false;
    const p = parsed.pathname;
    if (!p || p === "/" || p.length < 3) return false;
    const ext = p.slice(p.lastIndexOf(".")).toLowerCase();
    if (IMAGE_EXTS.has(ext)) return false;
    return true;
  } catch { return false; }
}

async function httpValid(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HTTP_TIMEOUT);
  try {
    let res = await fetch(url, {
      method: "HEAD", redirect: "follow", signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NigeriaAttackTracker/1.0)" },
    });
    if (res.status === 405) res = await fetch(url, {
      method: "GET", redirect: "follow", signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NigeriaAttackTracker/1.0)" },
    });
    clearTimeout(timer);
    if (res.status === 404) return false;
    if (res.status === 401 || res.status === 403 || res.status >= 500) return true;
    const ct = res.headers.get("content-type") ?? "";
    if (/^(image|video|audio)\//i.test(ct)) return false;
    const finalPath = new URL(res.url || url).pathname;
    if (!finalPath || finalPath === "/" || finalPath.length < 3) return false;
    return true;
  } catch (err: any) {
    clearTimeout(timer);
    return err.name === "AbortError"; // timeout → treat as valid
  }
}

// ---------------------------------------------------------------------------
// Brave Search
// ---------------------------------------------------------------------------

let lastBraveCall = 0;

async function braveSearch(query: string): Promise<Array<{ url: string; title: string; publisher: string }>> {
  const wait = BRAVE_DELAY - (Date.now() - lastBraveCall);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastBraveCall = Date.now();

  const params = new URLSearchParams({ q: query, count: "8", country: "ALL", freshness: "py" });

  try {
    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": BRAVE_API_KEY!,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) { console.warn(`  [Brave] HTTP ${res.status}`); return []; }

    const data = await res.json() as any;
    return ((data?.web?.results ?? []) as any[]).map((r: any) => ({
      url: (r.url || "").trim(),
      title: (r.title || "").trim(),
      publisher: extractDomain(r.url || ""),
    })).filter(r => r.url);
  } catch (err: any) {
    console.warn(`  [Brave] Error: ${err.message}`);
    return [];
  }
}

async function findReplacements(
  title: string, date: string, state: string,
): Promise<Array<{ url: string; title: string; publisher: string }>> {
  const year = date ? new Date(date).getFullYear() : new Date().getFullYear();
  // Try two queries for better coverage
  const queries = [
    `"${title.slice(0, 70)}" Nigeria ${state} ${year}`,
    `${title.slice(0, 50)} Nigeria attack ${state} ${year} site:premiumtimesng.com OR site:punchng.com OR site:vanguardngr.com OR site:dailytrust.com OR site:thecable.ng OR site:humanglemedia.com`,
  ];

  const seen = new Set<string>();
  const valid: Array<{ url: string; title: string; publisher: string }> = [];

  for (const q of queries) {
    if (valid.length >= 3) break;
    const results = await braveSearch(q);
    for (const r of results) {
      if (valid.length >= 3) break;
      if (seen.has(r.url)) continue;
      seen.add(r.url);
      if (!isTrustedDomain(r.url)) continue;
      if (!isStaticallyValid(r.url)) continue;
      if (await httpValid(r.url)) valid.push(r);
    }
  }

  return valid;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=".repeat(60));
  console.log("  Source Recovery — Re-sourcing Soft-Deleted Attacks");
  console.log("=".repeat(60));
  console.log(`  Mode: ${IS_EXECUTE ? "EXECUTE" : "DRY RUN"}\n`);

  await mongoose.connect(MONGO_URI!, { serverSelectionTimeoutMS: 20000 });
  console.log("Connected to MongoDB.\n");

  const db = mongoose.connection.db!;
  const col = db.collection("attacks");

  const candidates = await col.find({
    _deleted: true,
    _deletedReason: { $regex: /no replacements found/i },
  }).project({ _id: 1, title: 1, date: 1, "location.state": 1 }).toArray();

  console.log(`Found ${candidates.length} soft-deleted attacks to try recovering.\n`);

  let recovered = 0, failed = 0;

  for (let i = 0; i < candidates.length; i++) {
    const a = candidates[i];
    const label = `[${String(i + 1).padStart(3)}/${candidates.length}]`;
    process.stdout.write(`${label} "${String(a.title ?? "").slice(0, 60)}"... `);

    const replacements = await findReplacements(
      a.title ?? "",
      a.date ? String(a.date) : "",
      a.location?.state ?? "",
    );

    if (replacements.length > 0) {
      console.log(`✓ ${replacements.length} replacement(s) found`);
      for (const r of replacements) console.log(`     + ${r.url.slice(0, 90)}`);
      if (IS_EXECUTE) {
        await col.updateOne(
          { _id: a._id },
          { $set: { sources: replacements, _deleted: false, _deletedReason: "", updatedAt: new Date() } }
        );
      }
      recovered++;
    } else {
      console.log("✗ no replacements found");
      failed++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("  SUMMARY");
  console.log("=".repeat(60));
  console.log(`  Candidates:  ${candidates.length}`);
  console.log(`  Recovered:   ${recovered}`);
  console.log(`  No match:    ${failed}`);
  if (!IS_EXECUTE) console.log("\n  DRY RUN — run with --execute to apply.");
  console.log("=".repeat(60));

  await mongoose.disconnect();
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
