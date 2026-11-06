/**
 * Read-only duplicate audit for existing incidents.
 *
 * Emits candidate pairs and clusters, never writes. A pair is a proposal for
 * evidence review, not a merge decision: `merge-incidents` still requires an
 * explicit pair file and re-checks every invariant.
 *
 * Signals, strongest first:
 *   - a shared normalized source URL (a signal to compare, not proof)
 *   - the same settlement or LGA under the tolerant place rule
 *   - title token overlap
 *
 * Usage:
 *   npx tsx scripts/audit-duplicate-clusters.ts
 *   npx tsx scripts/audit-duplicate-clusters.ts --state Plateau --min-score 6
 *   npx tsx scripts/audit-duplicate-clusters.ts --out scratch/duplicate-audit-20261107
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { placesPlausiblySame, placesEquivalent, isUnknownPlace, lgaCompatible } from "../src/lib/location-identity";

type LeanAttack = {
  _id: unknown;
  title: string;
  date: Date;
  datePrecision?: string;
  dateRange?: { start?: Date | null; end?: Date | null };
  location: { state: string; lga?: string; town?: string; precision?: string };
  casualties?: { killed?: number | null; injured?: number | null; kidnapped?: number | null };
  sources?: Array<{ url: string; title?: string; publisher?: string; publishedAt?: Date | string }>;
  status?: string;
  hash: string;
};

type Pair = {
  keep: string;
  absorb: string;
  score: number;
  reasons: string[];
  sharedSources: string[];
  state: string;
  daysApart: number;
  keepTitle: string;
  absorbTitle: string;
};

const STOP = new Set(["the", "a", "an", "in", "on", "of", "and", "as", "at", "by", "for", "to", "from", "with", "over", "after", "kill", "killed", "kills", "attack", "attacks", "attackers", "gunmen", "suspected", "nigeria", "nigerian", "state", "community", "village", "residents"]);

function arg(name: string, fallback?: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
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

function tokens(title: string): Set<string> {
  return new Set(String(title || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length > 2 && !STOP.has(word)));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const word of a) if (b.has(word)) shared += 1;
  return shared / (a.size + b.size - shared);
}

function daysApart(a: LeanAttack, b: LeanAttack): number {
  return Math.abs(a.date.getTime() - b.date.getTime()) / 86_400_000;
}

function sourceUrls(attack: LeanAttack): Set<string> {
  return new Set((attack.sources || []).map((source) => normalizeUrl(source.url)).filter(Boolean));
}

function sharedSources(a: LeanAttack, b: LeanAttack): string[] {
  const left = sourceUrls(a);
  return [...sourceUrls(b)].filter((url) => left.has(url));
}

/** Prefer the older record, then the one with more sources. */
function survivorOrder(a: LeanAttack, b: LeanAttack): [LeanAttack, LeanAttack] {
  const byDate = a.date.getTime() - b.date.getTime();
  if (byDate !== 0) return byDate < 0 ? [a, b] : [b, a];
  const bySources = (b.sources?.length || 0) - (a.sources?.length || 0);
  if (bySources !== 0) return bySources < 0 ? [a, b] : [b, a];
  return String(a._id) < String(b._id) ? [a, b] : [b, a];
}

function scorePair(a: LeanAttack, b: LeanAttack): Pair | null {
  if (a.location.state !== b.location.state) return null;
  const gap = daysApart(a, b);
  if (gap > 14) return null;
  const reasons: string[] = [];
  let score = 0;
  const urls = sharedSources(a, b);
  if (urls.length) { score += 4; reasons.push(`${urls.length} shared source URL(s)`); }
  const sameTown = placesEquivalent(a.location.town, b.location.town);
  const plausibleTown = sameTown || placesPlausiblySame(a.location.town, b.location.town);
  if (sameTown && !isUnknownPlace(a.location.town)) { score += 3; reasons.push("same settlement"); }
  else if (plausibleTown) { score += 2; reasons.push("plausible settlement variant"); }
  if (lgaCompatible(a.location.lga, b.location.lga) && !isUnknownPlace(a.location.lga) && !isUnknownPlace(b.location.lga)) { score += 1; reasons.push("compatible LGA"); }
  if (gap < 1) { score += 2; reasons.push("same day"); }
  else if (gap <= 3) { score += 1; reasons.push(`${gap.toFixed(1)} days apart`); }
  const similarity = jaccard(tokens(a.title), tokens(b.title));
  if (similarity >= 0.45) { score += Math.round(similarity * 3); reasons.push(`title overlap ${(similarity * 100).toFixed(0)}%`); }
  if (!urls.length && !plausibleTown) return null;
  const [keep, absorb] = survivorOrder(a, b);
  return {
    keep: String(keep._id), absorb: String(absorb._id), score, reasons, sharedSources: urls,
    state: a.location.state, daysApart: gap, keepTitle: keep.title, absorbTitle: absorb.title,
  };
}

async function main() {
  const outDir = path.resolve(arg("out", `scratch/duplicate-audit-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, "-")}`) as string);
  const stateFilter = arg("state");
  const minScore = Number(arg("min-score", "4"));
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not set");
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15_000 });
  const Attack = (await import("../src/lib/models/Attack")).default;
  const IncidentReview = (await import("../src/lib/models/IncidentReview")).default;

  const query: Record<string, unknown> = { _deleted: { $ne: true } };
  if (stateFilter) query["location.state"] = stateFilter;
  const attacks = (await Attack.find(query, {
    title: 1, date: 1, datePrecision: 1, dateRange: 1, location: 1, casualties: 1, sources: 1, status: 1, hash: 1,
  }).lean()) as unknown as LeanAttack[];
  attacks.sort((a, b) => a.date.getTime() - b.date.getTime());

  const byState = new Map<string, LeanAttack[]>();
  for (const attack of attacks) {
    const list = byState.get(attack.location.state) || [];
    list.push(attack);
    byState.set(attack.location.state, list);
  }

  const pairs: Pair[] = [];
  let comparisons = 0;
  for (const list of byState.values()) {
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        // Sorted by date, so stop once the window is exceeded.
        if (list[j].date.getTime() - list[i].date.getTime() > 14 * 86_400_000) break;
        comparisons += 1;
        const pair = scorePair(list[i], list[j]);
        if (pair && pair.score >= minScore) pairs.push(pair);
      }
    }
  }

  // Pending duplicate rows already hold both records. Surface them as pairs so
  // the audit and the queue are read together.
  const reviewRows = await IncidentReview.find({ kind: "duplicate", status: "pending" }, { title: 1, sourceEvidence: 1, candidates: 1, reason: 1 }).lean();
  for (const row of reviewRows) {
    const evidence = (row as { sourceEvidence?: { existingId?: string; candidateId?: string } }).sourceEvidence;
    if (evidence?.existingId && evidence?.candidateId) {
      pairs.push({
        keep: evidence.existingId, absorb: evidence.candidateId, score: 10, reasons: ["stored pair in the review queue"],
        sharedSources: [], state: "", daysApart: 0, keepTitle: "", absorbTitle: (row as { title?: string }).title || "",
      });
    }
  }

  // Collapse to clusters so one record cannot appear in two pair entries,
  // which `merge-incidents` refuses.
  const parent = new Map<string, string>();
  const find = (id: string): string => {
    let root = id;
    while (parent.get(root) && parent.get(root) !== root) root = parent.get(root) as string;
    return root;
  };
  const union = (a: string, b: string) => {
    const ra = find(a); const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };
  for (const pair of pairs) union(pair.keep, pair.absorb);
  const clusters = new Map<string, Set<string>>();
  for (const pair of pairs) {
    for (const id of [pair.keep, pair.absorb]) {
      const root = find(id);
      if (!clusters.has(root)) clusters.set(root, new Set());
      clusters.get(root)?.add(id);
    }
  }

  pairs.sort((a, b) => b.score - a.score || a.keep.localeCompare(b.keep));
  fs.mkdirSync(outDir, { recursive: true });
  const report = {
    ranAt: new Date().toISOString(),
    activeRecords: attacks.length,
    comparisons,
    pairCandidates: pairs.length,
    clusters: [...clusters.values()].filter((cluster) => cluster.size > 1).length,
    pendingDuplicateRows: reviewRows.length,
    byState: Object.fromEntries([...byState.entries()].map(([state, list]) => [state, list.length])),
  };
  fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(outDir, "pairs.json"), JSON.stringify({ note: "Review the evidence before merging. keep = older/stable record.", pairs }, null, 2));
  fs.writeFileSync(path.join(outDir, "clusters.json"), JSON.stringify([...clusters.values()].map((cluster) => [...cluster]), null, 2));
  const top = pairs.slice(0, 40).map((pair) => `- **${pair.score}** ${pair.state || "(queue)"} ${pair.daysApart ? `${pair.daysApart.toFixed(1)}d` : ""}\n  keep ${pair.keep} ${pair.keepTitle}\n  absorb ${pair.absorb} ${pair.absorbTitle}\n  ${pair.reasons.join("; ")}`).join("\n");
  fs.writeFileSync(path.join(outDir, "report.md"), `# Duplicate audit\n\nRun ${report.ranAt}\n\n- active records: ${report.activeRecords}\n- comparisons: ${report.comparisons}\n- pair candidates: ${report.pairCandidates}\n- clusters: ${report.clusters}\n- pending duplicate rows folded in: ${report.pendingDuplicateRows}\n\n## Top pairs\n\n${top}\n`);
  console.log(JSON.stringify(report, null, 2));
  console.log(`\nArtifacts: ${outDir}`);
  await mongoose.disconnect();
}

main().catch((error) => { console.error("FATAL", error); process.exitCode = 1; });
