/**
 * Validates and cleans up source URLs across ALL attacks in the database.
 *
 * Checks:
 *  1. Static: URL is unparseable, points to a homepage (no/short path), or is an image/media file
 *  2. HTTP:   HEAD request follows redirects → checks final URL for homepage redirect,
 *             checks Content-Type for image responses, checks for 404s
 *
 * For attacks left with ZERO valid sources, attempts to find replacements via Brave Search
 * before soft-deleting them.
 *
 * Usage:
 *   npx ts-node scripts/fix-sources.ts            # dry run (preview only)
 *   npx ts-node scripts/fix-sources.ts --execute  # apply changes to DB
 *   npx ts-node scripts/fix-sources.ts --static-only  # skip HTTP checks (fast mode)
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";

const MONGO_URI         = process.env.MONGODB_URI;
const BRAVE_API_KEY     = process.env.BRAVE_SEARCH_API_KEY;

if (!MONGO_URI)     { console.error("Missing MONGODB_URI");          process.exit(1); }
if (!BRAVE_API_KEY) { console.error("Missing BRAVE_SEARCH_API_KEY"); process.exit(1); }

const IS_EXECUTE   = process.argv.includes("--execute");
const STATIC_ONLY  = process.argv.includes("--static-only");
const CONCURRENCY  = 6;
const HTTP_TIMEOUT = 9000;
const BATCH_SIZE   = 200;
const BRAVE_DELAY  = 1500; // ms between search calls (Brave free = 1 req/sec)

// ---------------------------------------------------------------------------
// Trusted domains (mirrors src/lib/gemini.ts)
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
  if (parts.length > 2 && TRUSTED_DOMAINS.has(parts.slice(-2).join("."))) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Static validation
// ---------------------------------------------------------------------------

const IMAGE_EXTS = new Set([
  ".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".mp4",
  ".pdf", ".json", ".xml", ".ico", ".mp3", ".wav",
]);

function staticInvalidReason(url: string): string | null {
  let parsed: URL;
  try { parsed = new URL(url); } catch { return "unparseable URL"; }

  const { protocol, hostname, pathname } = parsed;
  if (!["http:", "https:"].includes(protocol)) return "non-http protocol";

  // Block known garbage sources at the domain level
  if (hostname.includes("vertexaisearch.cloud.google.com")) return "expired Gemini grounding link";
  if (hostname.endsWith("google.com") && pathname.startsWith("/search")) return "Google search page";

  // Homepage detection
  if (!pathname || pathname === "/" || pathname.length < 3) return "homepage (no article path)";

  // Image / media extension
  const lastDot = pathname.lastIndexOf(".");
  if (lastDot !== -1) {
    const ext = pathname.slice(lastDot).toLowerCase();
    if (IMAGE_EXTS.has(ext)) return `non-article file (${ext})`;
  }

  return null;
}

// ---------------------------------------------------------------------------
// HTTP validation
// ---------------------------------------------------------------------------

interface HttpResult { valid: boolean; reason?: string }

async function httpCheck(url: string): Promise<HttpResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HTTP_TIMEOUT);

  const doFetch = async (method: "HEAD" | "GET"): Promise<Response> =>
    fetch(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NigeriaAttackTracker/1.0)" },
    });

  try {
    let res = await doFetch("HEAD");
    if (res.status === 405 || res.status === 501) res = await doFetch("GET");
    clearTimeout(timer);

    if (res.status === 404) return { valid: false, reason: "404 not found" };
    if (res.status === 401 || res.status === 403 || res.status >= 500) return { valid: true };

    const ct = res.headers.get("content-type") ?? "";
    if (/^(image|video|audio)\//i.test(ct)) {
      return { valid: false, reason: `wrong content-type: ${ct.split(";")[0]}` };
    }

    // Check if redirected to homepage
    const finalUrl = res.url || url;
    if (finalUrl !== url) {
      try {
        const fp = new URL(finalUrl).pathname;
        if (!fp || fp === "/" || fp.length < 3) {
          return { valid: false, reason: `redirects to homepage (→ ${finalUrl})` };
        }
      } catch { /* ignore */ }
    }

    return { valid: true };
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === "AbortError") return { valid: true }; // timeout → treat as valid
    return { valid: false, reason: `network error: ${err.message?.slice(0, 80)}` };
  }
}

// ---------------------------------------------------------------------------
// URL validation (static + optional HTTP)
// ---------------------------------------------------------------------------

const urlCache = new Map<string, { valid: boolean; reason?: string }>();

async function validateUrl(url: string): Promise<{ valid: boolean; reason?: string }> {
  if (urlCache.has(url)) return urlCache.get(url)!;
  const staticReason = staticInvalidReason(url);
  const result = staticReason
    ? { valid: false, reason: staticReason }
    : STATIC_ONLY ? { valid: true } : await httpCheck(url);
  urlCache.set(url, result);
  return result;
}

// ---------------------------------------------------------------------------
// Concurrency pool
// ---------------------------------------------------------------------------

async function runPool(tasks: Array<() => Promise<void>>, concurrency: number): Promise<void> {
  const queue = [...tasks];
  let active = 0;
  return new Promise((resolve, reject) => {
    const next = () => {
      if (queue.length === 0 && active === 0) { resolve(); return; }
      while (active < concurrency && queue.length > 0) {
        const task = queue.shift()!;
        active++;
        task().then(() => { active--; next(); }).catch(reject);
      }
    };
    next();
  });
}

// ---------------------------------------------------------------------------
// Brave Search — find replacement article links
// ---------------------------------------------------------------------------

let lastBraveCall = 0;

async function braveSearch(query: string, count = 5): Promise<Array<{ url: string; title: string; publisher: string }>> {
  const now = Date.now();
  const wait = BRAVE_DELAY - (now - lastBraveCall);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastBraveCall = Date.now();

  const params = new URLSearchParams({
    q: query,
    count: String(count),
    country: "ALL",
    freshness: "py",
  });

  try {
    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": BRAVE_API_KEY!,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.warn(`    [Brave] HTTP ${res.status} for query: ${query.slice(0, 60)}`);
      return [];
    }

    const data = await res.json() as any;
    const results = (data?.web?.results ?? []) as any[];

    return results
      .map((r: any) => ({
        url: (r.url || "").trim(),
        title: (r.title || "").trim(),
        publisher: (r.meta_url?.netloc || extractDomain(r.url || "")).replace(/^www\./, ""),
      }))
      .filter(r => r.url);
  } catch (err: any) {
    console.warn(`    [Brave] Error: ${err.message}`);
    return [];
  }
}

async function findReplacementSources(
  attackTitle: string,
  attackDate: string,
  attackState: string,
): Promise<Array<{ url: string; title: string; publisher: string }>> {
  // Build a focused query
  const dateYear = attackDate ? new Date(attackDate).getFullYear() : new Date().getFullYear();
  const query = `"${attackTitle.slice(0, 80)}" Nigeria ${attackState} ${dateYear}`;

  const results = await braveSearch(query, 8);

  const valid: Array<{ url: string; title: string; publisher: string }> = [];

  for (const r of results) {
    if (!isTrustedDomain(r.url)) continue;
    const check = await validateUrl(r.url);
    if (check.valid) {
      valid.push(r);
      if (valid.length >= 3) break; // cap at 3 replacements
    }
  }

  return valid;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=".repeat(60));
  console.log("  Source URL Validator + Replacement Finder");
  console.log("=".repeat(60));
  console.log(`  Mode:         ${IS_EXECUTE ? "EXECUTE (will modify DB)" : "DRY RUN (preview only)"}`);
  console.log(`  HTTP checks:  ${STATIC_ONLY ? "disabled (--static-only)" : "enabled"}`);
  console.log(`  Replacements: via Brave Search (trusted domains only)`);
  console.log("=".repeat(60) + "\n");

  await mongoose.connect(MONGO_URI!, { serverSelectionTimeoutMS: 20000 });
  console.log("Connected to MongoDB.\n");

  const db = mongoose.connection.db!;
  const col = db.collection("attacks");

  const total = await col.countDocuments({ _deleted: { $ne: true } });
  console.log(`Total active attacks to scan: ${total}\n`);

  let scanned = 0, urlsChecked = 0, urlsInvalid = 0;
  let prunedCount = 0, replacedCount = 0, deletedCount = 0;

  // Use _id-based cursor pagination to avoid drift when records are deleted mid-scan
  let lastId: any = null;
  while (true) {
    const query: any = { _deleted: { $ne: true } };
    if (lastId) query._id = { $gt: lastId };

    const batch = await col
      .find(query)
      .project({ _id: 1, title: 1, date: 1, "location.state": 1, sources: 1 })
      .sort({ _id: 1 })
      .limit(BATCH_SIZE)
      .toArray();

    if (batch.length === 0) break;
    lastId = batch[batch.length - 1]._id;

    // Pre-warm URL cache for all URLs in batch
    const tasks: Array<() => Promise<void>> = [];
    for (const attack of batch) {
      for (const src of (attack.sources ?? [])) {
        if (!src?.url) continue;
        const url = src.url.trim();
        tasks.push(async () => { if (!urlCache.has(url)) await validateUrl(url); });
      }
    }
    await runPool(tasks, CONCURRENCY);

    for (const attack of batch) {
      const sources: Array<{ url: string; title: string; publisher: string }> = attack.sources ?? [];

      const valid:   typeof sources = [];
      const removed: Array<{ url: string; reason: string }> = [];

      for (const src of sources) {
        if (!src?.url?.trim()) { removed.push({ url: "(empty)", reason: "empty URL" }); continue; }
        const url = src.url.trim();
        urlsChecked++;
        const result = urlCache.get(url) ?? { valid: true };
        if (result.valid) { valid.push(src); }
        else { urlsInvalid++; removed.push({ url, reason: result.reason ?? "unknown" }); }
      }

      if (removed.length > 0) {
        const shortTitle = (attack.title ?? "").slice(0, 70);
        console.log(`\n[${String(scanned + 1).padStart(4)}] "${shortTitle}"`);
        for (const r of removed) {
          console.log(`       ✗ ${r.url.slice(0, 90)}`);
          console.log(`         → ${r.reason}`);
        }

        if (valid.length === 0) {
          // Try to find replacement sources via Brave
          console.log(`       Searching for replacement sources...`);
          const replacements = await findReplacementSources(
            attack.title ?? "",
            attack.date ? String(attack.date) : "",
            attack.location?.state ?? "",
          );

          if (replacements.length > 0) {
            console.log(`       ✓ Found ${replacements.length} replacement source(s):`);
            for (const r of replacements) {
              console.log(`         + ${r.url.slice(0, 90)}`);
            }
            if (IS_EXECUTE) {
              await col.updateOne(
                { _id: attack._id },
                { $set: { sources: replacements, updatedAt: new Date() } }
              );
            }
            replacedCount++;
          } else {
            console.log(`       → SOFT-DELETE (no valid sources, no replacements found)`);
            if (IS_EXECUTE) {
              await col.updateOne(
                { _id: attack._id },
                { $set: {
                    _deleted: true,
                    _deletedReason: "All sources were homepages/images/broken links; no replacements found",
                    updatedAt: new Date(),
                } }
              );
            }
            deletedCount++;
          }
        } else {
          console.log(`       → PRUNE: keep ${valid.length}/${sources.length} sources`);
          if (IS_EXECUTE) {
            await col.updateOne(
              { _id: attack._id },
              { $set: { sources: valid, updatedAt: new Date() } }
            );
          }
          prunedCount++;
        }
      }

      scanned++;
    }

    process.stdout.write(`\rProgress: ${scanned}/${total} scanned... `);
  }

  console.log("\n\n" + "=".repeat(60));
  console.log("  SUMMARY");
  console.log("=".repeat(60));
  console.log(`  Attacks scanned:        ${scanned}`);
  console.log(`  URLs checked:           ${urlsChecked}`);
  console.log(`  Invalid URLs removed:   ${urlsInvalid}`);
  console.log(`  Attacks pruned:         ${prunedCount}  (some sources removed, others kept)`);
  console.log(`  Attacks re-sourced:     ${replacedCount}  (all bad → replaced via Brave Search)`);
  console.log(`  Attacks soft-deleted:   ${deletedCount}  (all bad, no replacements found)`);
  if (!IS_EXECUTE) console.log("\n  DRY RUN — run with --execute to apply.");
  console.log("=".repeat(60));

  await mongoose.disconnect();
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
