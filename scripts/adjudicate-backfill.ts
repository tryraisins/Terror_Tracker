/**
 * Adjudicate backfill outcomes.
 *
 * Two subjects:
 *   --pairs <pairs.json>   two stored records proposed as duplicates
 *   --held  <held.json>    a backfill candidate that ingest held against a record
 *
 * Evidence is assembled from the source articles, not the identity fields:
 *   - both sides' article texts are fetched,
 *   - claims (people, sites, times, tolls, distinctive phrases) are extracted,
 *   - `claimsLink` decides whether the two sides describe the same episode,
 *   - `assessIncidentDuplicate` gives an independent identity opinion.
 *
 * Decisions are deterministic and auditable. Merging requires a claim link.
 * A held candidate is attached to the existing record only when the place and
 * date agree and neither side names a different victim set; otherwise it is a
 * distinct event and is promoted.
 *
 * Dry run only. It writes decisions; it never changes an attack.
 *
 *   npx tsx scripts/adjudicate-backfill.ts --pairs scratch/.../pairs.json --out scratch/.../pair-decisions.jsonl
 *   npx tsx scripts/adjudicate-backfill.ts --held scratch/backfill/held/held.json --out scratch/backfill/held/decisions.jsonl
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import mongoose from "mongoose";
import { placesPlausiblySame, sameLga } from "../src/lib/location-identity";
import { incidentDateKey } from "../src/lib/incident-date";

type AnyAttack = Record<string, any>;

function arg(name: string, fallback?: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function readJsonl<T>(file: string): T[] {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean).flatMap((line) => {
    try { return [JSON.parse(line) as T]; } catch { return []; }
  });
}

function normUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) if (/^(utm_|fbclid|gclid|ref|output|amp)/i.test(key)) url.searchParams.delete(key);
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch { return String(value || "").trim().replace(/\/$/, "").toLowerCase(); }
}

function daysApart(a: AnyAttack, b: AnyAttack): number {
  return Math.abs(new Date(a.date).getTime() - new Date(b.date).getTime()) / 86_400_000;
}

function emptyClaims() {
  return { people: [] as string[], sites: [] as string[], times: [] as string[], tolls: [] as Array<{ value: number; victims: string }>, distinctive: [] as string[] };
}

async function main() {
  const pairsFile = arg("pairs");
  const heldFile = arg("held");
  const outFile = arg("out");
  const limit = Number(arg("limit", "0"));
  if (!pairsFile && !heldFile) throw new Error("--pairs or --held is required");
  if (!outFile) throw new Error("--out is required");
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not set");

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15_000 });
  const { fetchArticleText } = await import("../src/lib/search-led-discovery");
  const { extractArticleClaims, assessIncidentDuplicate } = await import("../src/lib/deepseek");
  const { claimsLink } = await import("../src/lib/claim-linkage");
  const Attack = (await import("../src/lib/models/Attack")).default;
  const { ObjectId } = mongoose.Types;

  const done = new Set(readJsonl<{ id: string }>(outFile).map((row) => row.id));
  const write = (row: Record<string, unknown>) => fs.appendFileSync(outFile, `${JSON.stringify(row)}\n`, "utf8");
  fs.mkdirSync(outFile.split(/[\\/]/).slice(0, -1).join("/") || ".", { recursive: true });

  const readSide = async (incident: AnyAttack, excludeUrl?: string) => {
    const claims = emptyClaims();
    const articles: Array<{ url: string; chars: number }> = [];
    const urls = (incident.sources || [])
      .map((source: AnyAttack) => String(source.url || ""))
      .filter((url: string) => /^https?:\/\//i.test(url))
      .filter((url: string) => !excludeUrl || normUrl(url) !== normUrl(excludeUrl))
      .slice(0, 2);
    for (const url of urls) {
      const text = await fetchArticleText(url, String(incident.title || ""));
      if (!text) continue;
      articles.push({ url, chars: text.text.length });
      const scope = [incident.location?.town, incident.location?.lga, incident.location?.state].filter(Boolean).join(", ");
      const extracted = await extractArticleClaims(text.text, scope);
      claims.people.push(...extracted.people);
      claims.sites.push(...extracted.sites);
      claims.times.push(...extracted.times);
      claims.tolls.push(...extracted.tolls);
      claims.distinctive.push(...extracted.distinctive);
    }
    return { claims, articles };
  };

  const view = (incident: AnyAttack) => ({
    title: incident.title,
    description: incident.description || "",
    date: incident.date,
    datePrecision: incident.datePrecision,
    dateRange: incident.dateRange,
    location: incident.location,
    group: incident.group || "Unknown",
    casualties: incident.casualties || { killed: null, injured: null, kidnapped: null, displaced: null },
    sources: (incident.sources || []).map((source: AnyAttack) => ({ title: source.title, publisher: source.publisher })),
  });

  const file = pairsFile || heldFile;
  const rows = JSON.parse(fs.readFileSync(file as string, "utf8").replace(/^\uFEFF/, ""));
  const items = (Array.isArray(rows) ? rows : rows.pairs || []).slice(0, limit > 0 ? limit : undefined);
  let processed = 0;

  for (const item of items) {
    const id = pairsFile ? `${item.keep}|${item.absorb}` : item.candidateHash || `${item.url}|${item.title}`;
    if (done.has(id)) continue;
    processed += 1;

    if (pairsFile) {
      const [keep, absorb] = await Promise.all([
        Attack.findById(new ObjectId(item.keep)).lean() as Promise<AnyAttack | null>,
        Attack.findById(new ObjectId(item.absorb)).lean() as Promise<AnyAttack | null>,
      ]);
      if (!keep || !absorb) { write({ id, subject: "pair", verdict: "keep_separate", reasons: ["a record no longer exists"] }); continue; }

      const [left, right] = await Promise.all([readSide(keep), readSide(absorb)]);
      const sharedPlaceNames = [keep.location?.state, keep.location?.lga, keep.location?.town].filter(Boolean);
      const linkage = claimsLink({
        candidate: left.claims, record: right.claims, sharedPlaceNames,
        tollFigures: [keep.casualties?.killed, keep.casualties?.kidnapped, keep.casualties?.injured, absorb.casualties?.killed, absorb.casualties?.kidnapped, absorb.casualties?.injured].filter((value): value is number => Number.isFinite(value)),
      });
      const assessment = await assessIncidentDuplicate(view(keep), view(absorb));

      const sameDate = incidentDateKey(keep) === incidentDateKey(absorb);
      const samePlace = placesPlausiblySame(keep.location?.town, absorb.location?.town) || (sameLga(keep.location?.lga, absorb.location?.lga) && placesPlausiblySame(keep.location?.town, absorb.location?.town));
      const bothNamed = left.claims.people.length >= 2 && right.claims.people.length >= 2;
      const distinctVictims = bothNamed && !linkage.linked;
      const verdict = linkage.linked && assessment.classification === "same_event" ? "merge"
        : linkage.linked && assessment.classification === "review_required" ? "merge"
          : "keep_separate";
      const reasons = [
        linkage.linked ? `claim link: ${linkage.evidence.join(", ")}` : `no claim link: ${linkage.why || "no shared person, site or toll"}`,
        `identity assessment: ${assessment.classification} (${assessment.reason})`,
        sameDate ? "same event date key" : "different event date key",
        samePlace ? "place agrees" : "place does not agree",
        distinctVictims ? "both sides name distinct people with no overlap" : "no distinct named-victim conflict",
      ];
      if (verdict === "keep_separate" && distinctVictims) reasons.push("distinct victim sets block a merge");
      write({
        id, subject: "pair", verdict, keepId: String(keep._id), absorbId: String(absorb._id),
        state: keep.location?.state, reasons, evidence: {
          keepTitle: keep.title, absorbTitle: absorb.title, keepDate: keep.date, absorbDate: absorb.date,
          keepTown: keep.location?.town, absorbTown: absorb.location?.town,
          linkage, assessment: assessment.classification, assessmentReason: assessment.reason,
          articlesRead: { keep: left.articles, absorb: right.articles },
          people: { keep: left.claims.people, absorb: right.claims.people },
          tolls: { keep: keep.casualties, absorb: absorb.casualties },
        },
      });
      console.log(`pair ${id}: ${verdict} (${linkage.linked ? "linked" : "no link"}, ${assessment.classification})`);
      continue;
    }

    // Held candidate against the nearest stored record.
    const candidate = item.candidate;
    if (!candidate) { write({ id, subject: "held", verdict: "dismiss", reasons: ["candidate payload missing from the ledger"] }); continue; }
    const date = new Date(candidate.date);
    const since = new Date(date.getTime() - 14 * 86_400_000);
    const until = new Date(date.getTime() + 14 * 86_400_000);
    const nearby = (await Attack.find({
      _deleted: { $ne: true }, "location.state": candidate.location?.state, date: { $gte: since, $lte: until },
    }, { title: 1, description: 1, date: 1, datePrecision: 1, dateRange: 1, location: 1, group: 1, casualties: 1, sources: 1 }).lean()) as AnyAttack[];

    const scored = nearby.map((record) => {
      const gap = daysApart(record, candidate);
      let score = 0;
      if (placesPlausiblySame(record.location?.town, candidate.location?.town)) score += 4;
      if (sameLga(record.location?.lga, candidate.location?.lga)) score += 2;
      if (incidentDateKey(record) === incidentDateKey(candidate)) score += 3;
      score -= gap / 4;
      return { record, score, gap };
    }).sort((a, b) => b.score - a.score);

    if (!scored.length) {
      write({
        id, subject: "held", verdict: "promote", existingId: null,
        reasons: ["no active record in this state within 14 days", "candidate passed extraction and scope gates"],
        evidence: { title: candidate.title, date: candidate.date, location: candidate.location, url: item.url },
      });
      console.log(`held ${id}: promote (no nearby record)`);
      continue;
    }

    const best = scored[0];
    const existing = best.record;
    const [left, right] = await Promise.all([
      readSide({ ...candidate, sources: [{ url: item.url, title: item.title }] }),
      readSide(existing, item.url),
    ]);
    const sharedPlaceNames = [existing.location?.state, existing.location?.lga, existing.location?.town].filter(Boolean);
    const linkage = claimsLink({
      candidate: left.claims, record: right.claims, sharedPlaceNames,
      tollFigures: [existing.casualties?.killed, existing.casualties?.kidnapped, existing.casualties?.injured, candidate.casualties?.killed, candidate.casualties?.kidnapped, candidate.casualties?.injured].filter((value): value is number => Number.isFinite(value)),
    });
    const assessment = await assessIncidentDuplicate(view(candidate), view(existing));

    const sameDate = incidentDateKey(existing) === incidentDateKey(candidate);
    const samePlace = placesPlausiblySame(existing.location?.town, candidate.location?.town);
    const bothNamed = left.claims.people.length >= 2 && right.claims.people.length >= 2;
    const distinctVictims = bothNamed && !linkage.linked;
    const farApart = best.gap > 2.5;

    let verdict: "same_event" | "promote";
    const reasons: string[] = [];
    if (linkage.linked) {
      verdict = "same_event";
      reasons.push(`claim link: ${linkage.evidence.join(", ")}`);
    } else if (distinctVictims) {
      verdict = "promote";
      reasons.push("both sides name distinct people with no overlap", `no claim link: ${linkage.why}`);
    } else if (!samePlace) {
      verdict = "promote";
      reasons.push("candidate settlement differs from the stored record");
    } else if (farApart) {
      verdict = "promote";
      reasons.push(`${best.gap.toFixed(1)} days from the nearest record on the same settlement`);
    } else {
      verdict = "same_event";
      reasons.push(`same settlement and ${sameDate ? "event date" : "overlapping date window"}`, `no claim link (${linkage.why || "none"}), but no distinct victim set`);
      reasons.push("existing identity and toll kept; the candidate source is attached as corroboration");
    }
    reasons.push(`identity assessment: ${assessment.classification} (${assessment.reason})`);

    write({
      id, subject: "held", verdict, existingId: String(existing._id), url: item.url,
      candidateHash: item.candidateHash, state: candidate.location?.state, reasons,
      evidence: {
        candidateTitle: candidate.title, candidateDate: candidate.date, candidateLocation: candidate.location,
        candidateTolls: candidate.casualties, existingTitle: existing.title, existingDate: existing.date,
        existingTown: existing.location?.town, existingTolls: existing.casualties,
        gapDays: best.gap, linkage, assessment: assessment.classification, assessmentReason: assessment.reason,
        articlesRead: { candidate: left.articles, existing: right.articles },
        people: { candidate: left.claims.people, existing: right.claims.people },
      },
    });
    console.log(`held ${id}: ${verdict} vs ${existing._id} (${linkage.linked ? "linked" : "no link"})`);
  }

  console.log(`processed ${processed}; decisions in ${outFile}`);
  await mongoose.disconnect();
}

main().catch((error) => { console.error("FATAL", error); process.exitCode = 1; });
