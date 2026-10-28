/**
 * Adjudicate held duplicate leads that the deterministic gates refused to merge.
 *
 * A lead reaches this queue when a candidate shares the identity hash with a
 * stored record (title, event date, state, LGA, town) but the casualty figures
 * disagree, or when the dates overlap without being identical. The ingest gate is
 * right to hold those, but a person should not have to read them one at a time.
 *
 * The scan stores the parsed candidate on the review row, so this pass has the
 * same evidence the gate had. It asks the model a narrower question than "are
 * these the same event": the identity is already established, so what remains is
 * whether the differing tolls describe one episode counted differently or two
 * separate episodes.
 *
 * What it will not do:
 * - It never rewrites casualty figures. Changing a published death toll is not a
 *   deduplication decision, so both figures are recorded in the disposition note
 *   and the artifact for a person to reconcile if they want to.
 * - It never touches identity fields, so no hash can change under it.
 * - It never resolves a row the model declines, or one whose candidate was not
 *   stored, or one whose referenced record no longer exists.
 *
 *   npx tsx scripts/adjudicate-duplicate-reviews.ts                  # dry run
 *   npx tsx scripts/adjudicate-duplicate-reviews.ts --apply
 *   npx tsx scripts/adjudicate-duplicate-reviews.ts --apply --limit 10 --out <dir>
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "node:fs/promises";
import path from "node:path";
import Attack from "../src/lib/models/Attack";
import IncidentReview from "../src/lib/models/IncidentReview";
import { assessTollConflict, extractArticleClaims, type DuplicateCheckIncident } from "../src/lib/deepseek";
import { fetchArticleText, mergeSourceMetadata } from "../src/lib/search-led-discovery";
import { groundingCheck } from "../src/lib/quote-grounding";
import { claimsLink, type ArticleClaims } from "../src/lib/claim-linkage";
import { normalizeStateName } from "../src/lib/normalize-state";
import { placesEquivalent, sameLga } from "../src/lib/location-identity";
import { incidentDateKey } from "../src/lib/incident-date";

dotenv.config({ path: ".env.local" });

type Args = { apply: boolean; limit: number; out: string | null };

function parseArgs(argv: string[]): Args {
  const args: Args = { apply: false, limit: 25, out: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--apply") args.apply = true;
    else if (arg === "--limit") args.limit = Math.max(1, Number(argv[++index]) || 25);
    else if (arg === "--out") args.out = argv[++index] || null;
    else if (arg === "--help" || arg === "-h") {
      console.log("usage: adjudicate-duplicate-reviews.ts [--apply] [--limit N] [--out DIR]");
      process.exit(0);
    }
  }
  return args;
}

type StoredCandidate = {
  title?: string;
  description?: string;
  date?: string | Date;
  datePrecision?: string;
  dateRange?: { start?: string | Date | null; end?: string | Date | null };
  location?: { state?: string; lga?: string; town?: string };
  group?: string;
  casualties?: { killed?: number | null; injured?: number | null; kidnapped?: number | null; displaced?: number | null };
  sources?: Array<{ url?: string; title?: string; publisher?: string; publishedAt?: string | Date | null }>;
};

type ReviewRow = {
  _id: mongoose.Types.ObjectId;
  reason: string;
  sourceUrl: string;
  title?: string;
  state?: string;
  candidates?: StoredCandidate[];
  sourceEvidence?: { existingId?: string; candidateId?: string } | null;
};

/**
 * A held lead and a stored-pair review look alike in the queue but are different
 * questions.
 *
 * A held lead carries one parsed candidate that was never inserted, and the
 * record it nearly matched. That is what this pass can decide.
 *
 * A stored-pair review carries both records (`candidates: [A, B]` and a
 * `candidateId`) because two existing documents may be one event. Taking
 * `candidates[0]` there compares the record with itself, which "proves" they are
 * the same event and closes a real question. Those belong to the merge tooling,
 * not here.
 */
function heldLeadCandidate(row: ReviewRow): { candidate: StoredCandidate | null; why?: string } {
  const evidence = row.sourceEvidence || {};
  if (evidence.candidateId) return { candidate: null, why: "stored-pair review, not a held lead" };
  const candidates = row.candidates || [];
  if (candidates.length !== 1) return { candidate: null, why: `expected one stored candidate, found ${candidates.length}` };
  const candidate = candidates[0];
  if (!candidate || typeof candidate !== "object") return { candidate: null, why: "stored candidate is malformed" };
  const candidateId = (candidate as { _id?: unknown })._id;
  if (candidateId && evidence.existingId && String(candidateId) === String(evidence.existingId)) {
    return { candidate: null, why: "candidate is the record itself" };
  }
  if (!candidate.location || typeof candidate.location !== "object") return { candidate: null, why: "stored candidate has no location" };
  return { candidate };
}

type Toll = { killed: number | null; injured: number | null; kidnapped: number | null; displaced: number | null };

const tollText = (toll: Toll | undefined) => {
  if (!toll) return "unknown";
  const parts = [
    toll.killed != null ? `${toll.killed} killed` : null,
    toll.kidnapped != null ? `${toll.kidnapped} abducted` : null,
    toll.injured != null ? `${toll.injured} injured` : null,
    toll.displaced != null ? `${toll.displaced} displaced` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "no figures";
};

const toToll = (value: Record<string, number | null | undefined> | null | undefined): Toll => ({
  killed: value?.killed ?? null,
  injured: value?.injured ?? null,
  kidnapped: value?.kidnapped ?? null,
  displaced: value?.displaced ?? null,
});

const toIncident = (value: {
  title?: string;
  description?: string;
  date?: string | Date;
  datePrecision?: string;
  dateRange?: { start?: string | Date | null; end?: string | Date | null };
  location?: { state?: string; lga?: string; town?: string };
  group?: string;
  casualties?: StoredCandidate["casualties"];
  sources?: Array<{ title?: string; publisher?: string }>;
}): DuplicateCheckIncident => ({
  title: value.title || "",
  description: value.description || "",
  date: value.date ?? new Date(0),
  datePrecision: value.datePrecision as DuplicateCheckIncident["datePrecision"],
  dateRange: value.dateRange,
  location: {
    state: value.location?.state || "Unknown",
    lga: value.location?.lga || "Unknown",
    town: value.location?.town || "Unknown",
  },
  group: value.group || "Unknown",
  casualties: toToll(value.casualties),
  sources: (value.sources || []).map(({ title, publisher }) => ({ title, publisher })),
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

  const outDir = args.apply
    ? args.out || path.join("/var/log/terror-tracker/adjudications", new Date().toISOString().replace(/[:.]/g, "-"))
    : args.out;

  const rows = await IncidentReview.find({ status: "pending", kind: "duplicate" })
    .select("+sourceEvidence reason sourceUrl title state candidates")
    .sort({ lastSeenAt: 1 })
    .limit(args.limit)
    .lean<ReviewRow[]>();

  // Preflight the artifact directory before any mutation. A pass that cannot
  // record what it did must not do it.
  if (args.apply && outDir) {
    await fs.mkdir(path.join(outDir), { recursive: true });
  }
  const journal = outDir ? path.join(outDir, "decisions.jsonl") : null;
  const record0 = async (entry: Record<string, unknown>) => {
    if (journal) await fs.appendFile(journal, `${JSON.stringify(entry)}\n`).catch(() => undefined);
  };

  const summary = {
    mode: args.apply ? "apply" : "dry-run",
    startedAt: new Date().toISOString(),
    scanned: rows.length,
    resolved: 0,
    heldDistinct: 0,
    held: 0,
    skipped: 0,
    errors: 0,
    decisions: [] as Array<Record<string, unknown>>,
  };

  const note = async (entry: Record<string, unknown>) => {
    summary.decisions.push(entry);
    await record0(entry);
  };

  for (const row of rows) {
    try {
      const existingId = row.sourceEvidence?.existingId;
      const held = heldLeadCandidate(row);

      if (!existingId) {
        summary.skipped += 1;
        await note({ reviewId: String(row._id), action: "skipped", why: "no existingId on the review row" });
        continue;
      }

      if (!held.candidate) {
        summary.skipped += 1;
        await note({ reviewId: String(row._id), action: "skipped", why: held.why });
        continue;
      }
      const candidate = held.candidate;

      const existing = await Attack.findOne({ _id: existingId, _deleted: { $ne: true } }).lean();
      if (!existing) {
        // The referenced record was absorbed or removed; the queue sweep resolves those.
        summary.skipped += 1;
        await note({ reviewId: String(row._id), action: "skipped", why: "referenced record is gone" });
        continue;
      }

      // The model must not be asked a question the deterministic layer has not
      // already answered. A queued row can be stale or hand-edited, and the prompt
      // treats identity as established, so verify it here rather than trust it.
      // exact_day on both sides, because an equal month or date range proves only
      // the same interval, and "unknown" is a truthy string that would match.
      const dateKeyOf = (value: { date?: Date | string | null; datePrecision?: string | null; dateRange?: { start?: Date | string | null; end?: Date | string | null } | null }) =>
        incidentDateKey({
          date: value.date,
          datePrecision: (value.datePrecision ?? "exact_day") as never,
          dateRange: value.dateRange ?? null,
        });
      const storedDateKey = dateKeyOf(existing);
      const candidateDateKey = dateKeyOf(candidate);
      const identity = {
        state: normalizeStateName(existing.location?.state || "") === normalizeStateName(candidate.location?.state || ""),
        place: placesEquivalent(existing.location?.town, candidate.location?.town),
        lga: sameLga(existing.location?.lga, candidate.location?.lga),
        // The row exists because the ingest hash matched on the stored date anchor,
        // so an equal anchor is the same identity the queue was built from. Broad
        // precision is acceptable here because the claim comparison below is the
        // real guard; an unparseable date is not.
        date: storedDateKey !== "unknown" && storedDateKey === candidateDateKey,
      };
      if (!identity.state || !identity.place || !identity.lga || !identity.date) {
        summary.held += 1;
        await note({
          reviewId: String(row._id),
          eventId: String(existing._id),
          action: "held-identity",
          why: JSON.stringify(identity),
          stored: { state: existing.location?.state, lga: existing.location?.lga, town: existing.location?.town },
          candidate: { state: candidate.location?.state, lga: candidate.location?.lga, town: candidate.location?.town },
        });
        continue;
      }

      // The held article has to be readable before the model is asked anything.
      // The queue stores no article text for this lead kind, and summaries are not
      // evidence, so a page that will not load leaves the row for a person.
      const fetched = await fetchArticleText(row.sourceUrl, row.title || "");
      if (!fetched || fetched.text.length < 200) {
        summary.held += 1;
        await note({
          reviewId: String(row._id),
          eventId: String(existing._id),
          action: "held-no-article",
          why: "the held article could not be fetched, so there is nothing to ground the decision in",
        });
        continue;
      }
      const candidateArticleText = fetched.text;
      const recordEvidenceText = [
        existing.description || "",
        existing.dateEvidence || "",
        ...Object.values((existing.casualtyMeta || {}) as Record<string, { sourceText?: string; note?: string } | undefined>)
          .flatMap((meta) => [meta?.sourceText || "", meta?.note || ""]),
        (existing.sources || []).map((source) => `${source.title || ""} (${source.publisher || ""})`).join("; "),
      ].filter(Boolean).join("\n");

      // Claim-level linkage. The candidate came from the held article, so anything
      // quoted from it is nearly guaranteed. The other half of the comparison is the
      // stored record's own reporting, which has to be read too.
      const candidateClaims = await extractArticleClaims(candidateArticleText);
      const recordUrls = [...new Set((existing.sources || []).map((source) => String(source.url || "")))]
        .filter((url) => /^https?:\/\//i.test(url) && url !== row.sourceUrl)
        .slice(0, 3);
      const recordClaims: ArticleClaims = { people: [], sites: [], times: [], tolls: [], distinctive: [] };
      const recordArticlesRead: string[] = [];
      for (const url of recordUrls) {
        const text = await fetchArticleText(url);
        if (!text) continue;
        const claims = await extractArticleClaims(text.text);
        recordClaims.people.push(...claims.people);
        recordClaims.sites.push(...claims.sites);
        recordClaims.times.push(...claims.times);
        recordClaims.tolls.push(...claims.tolls);
        recordClaims.distinctive.push(...claims.distinctive);
        recordArticlesRead.push(url);
      }

      if (!recordArticlesRead.length) {
        summary.held += 1;
        await note({
          reviewId: String(row._id),
          eventId: String(existing._id),
          action: "held-no-record-article",
          why: "none of the stored record's source articles could be fetched, so there is nothing to compare the held article against",
          tried: recordUrls,
        });
        continue;
      }

      const linkage = claimsLink({
        candidate: candidateClaims,
        record: recordClaims,
        sharedPlaceNames: [existing.location?.state || "", existing.location?.lga || "", existing.location?.town || ""],
        tollFigures: [
          existing.casualties?.killed, existing.casualties?.kidnapped, existing.casualties?.injured, existing.casualties?.displaced,
          candidate.casualties?.killed, candidate.casualties?.kidnapped, candidate.casualties?.injured, candidate.casualties?.displaced,
        ].filter((value): value is number => typeof value === "number"),
      });
      if (!linkage.linked) {
        summary.held += 1;
        await note({
          reviewId: String(row._id),
          eventId: String(existing._id),
          action: "held-no-linkage",
          why: linkage.why,
          recordArticles: recordArticlesRead,
          candidateClaims,
          recordClaims,
        });
        continue;
      }

      const assessment = await assessTollConflict(toIncident(existing), toIncident(candidate), {
        candidateArticleText,
        recordEvidenceText,
      });
      const existingToll = toToll(existing.casualties);
      const candidateToll = toToll(candidate.casualties);
      const decision = {
        reviewId: String(row._id),
        eventId: String(existing._id),
        title: existing.title,
        existingToll,
        candidateToll,
        candidateSource: row.sourceUrl,
        classification: assessment.classification,
        modelReason: assessment.reason,
        linkageQuote: assessment.linkageQuote,
        linkage: linkage.evidence,
      };

      // A generic rationale is not evidence. Treat it like a refusal.
      const thinReason = assessment.reason.trim().length < 40;
      if (assessment.classification === "review_required" || thinReason) {
        summary.held += 1;
        await note({ ...decision, action: thinReason ? "held-thin-reason" : "held", thinReason });
        continue;
      }

      // Verify the quote against the article we fetched. A same-event verdict that
      // cannot point at one real sentence naming the settlement and the toll is a
      // guess, not a decision.
      const tollFigures = [
        existingToll.killed, existingToll.kidnapped, existingToll.injured, existingToll.displaced,
        candidateToll.killed, candidateToll.kidnapped, candidateToll.injured, candidateToll.displaced,
      ].filter((value): value is number => typeof value === "number");
        const grounded = groundingCheck({
        quote: assessment.linkageQuote,
        articleText: candidateArticleText,
        place: existing.location?.town || existing.location?.lga || "",
        tollFigures,
        recordEvidenceText,
        sharedFields: [
          existing.title || "",
          existing.location?.state || "",
          existing.location?.lga || "",
          existing.location?.town || "",
        ],
      });if (!grounded.ok) {
        summary.held += 1;
        await note({ ...decision, action: "held-ungrounded", why: grounded.why });
        continue;
      }

      if (assessment.classification === "different_event") {
        // Never dismiss here. A distinct result means this article describes an
        // event that is not in the record, and AGENTS.md says such a lead must be
        // promoted, not closed. Closing it would also make it unpromotable,
        // because promote-review-lead only accepts pending rows.
        summary.heldDistinct += 1;
        await note({ ...decision, action: "held-distinct-needs-promotion" });
        continue;
      }

      // same_event_counts_differ: this article belongs to the stored record.
      // Append only the sources that are missing, so a concurrent writer is not
      // overwritten by a snapshot read earlier in the loop. Casualty figures are
      // left alone and both are recorded.
      const merged = mergeSourceMetadata(existing.sources || [], (candidate.sources || []) as never);
      const existingUrls = new Set((existing.sources || []).map((source) => String(source.url || "")));
      const additions = merged.sources.filter((source) => !existingUrls.has(String(source.url || "")));
      await note({ ...decision, action: "resolve-same-event", sourcesAdded: additions.map((source) => source.url) });

      if (args.apply) {
        // Snapshot before the write, so a crash cannot leave a resolved row with
        // no record of what it looked like. The article itself is kept too, because
        // the live page will change and the Jina reader is a third party.
        if (outDir) {
          await fs.mkdir(path.join(outDir, "before"), { recursive: true });
          await fs.writeFile(
            path.join(outDir, "before", `${String(row._id)}.json`),
            JSON.stringify({ review: row, record: existing, additions, viaJina: fetched.viaJina }, null, 2),
          ).catch(() => undefined);
          await fs.writeFile(path.join(outDir, "before", `${String(row._id)}.article.txt`), candidateArticleText).catch(() => undefined);
        }

        if (additions.length) {
          // Guard the push itself: if the record was deleted after the read, or a
          // concurrent writer already added the URL, do not claim the resolution.
          const pushed = await Attack.updateOne(
            {
              _id: existing._id,
              _deleted: { $ne: true },
              "sources.url": { $nin: additions.map((source) => String(source.url || "")) },
            },
            { $push: { sources: { $each: additions } }, $set: { updatedAt: new Date() } },
          );
          if (pushed.matchedCount !== 1) {
            summary.errors += 1;
            await note({ reviewId: String(row._id), action: "conflict", why: "the record changed or disappeared before the source could be attached" });
            continue;
          }
        }
        const closed = await IncidentReview.updateOne(
          { _id: row._id, status: "pending" },
          {
            $set: {
              status: "resolved",
              reviewedAt: new Date(),
              reviewedBy: "auto-adjudicator",
              retryable: false,
              nextRetryAt: null,
              dispositionNote:
                `Same event, counted differently: ${additions.length} source(s) attached to the existing record and no casualty figure changed. ` +
                `Stored record reports ${tollText(existingToll)}, the article reports ${tollText(candidateToll)}. ` +
                `Linked by ${linkage.evidence.join(", ")} and the quote "${assessment.linkageQuote.slice(0, 240)}". Model: ${assessment.reason}`.slice(0, 2000),
            },
          },
        );
        // Someone else may have closed it first; do not claim a resolution we did not make.
        if (closed.modifiedCount !== 1) {
          summary.errors += 1;
          await note({ reviewId: String(row._id), action: "conflict", why: "row was no longer pending" });
          continue;
        }

        if (outDir) {
          const after = await Attack.findById(existing._id).lean();
          await fs.mkdir(path.join(outDir, "after"), { recursive: true });
          await fs.writeFile(path.join(outDir, "after", `${String(row._id)}.json`), JSON.stringify({ record: after }, null, 2)).catch(() => undefined);
        }
      }

      summary.resolved += 1;
    } catch (error) {
      // One bad row must not abandon the rest of the pass.
      summary.errors += 1;
      await note({ reviewId: String(row._id), action: "error", why: error instanceof Error ? error.message : String(error) });
    }
  }

  if (summary.decisions.length) console.log(JSON.stringify(summary.decisions, null, 2));
  console.log(
    `\n${summary.mode}: scanned ${summary.scanned}, resolved ${summary.resolved}, held ${summary.held}, ` +
      `held-distinct ${summary.heldDistinct}, skipped ${summary.skipped}, errors ${summary.errors}`,
  );
  if (args.apply && outDir) {
    try {
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
      console.log(`artifact: ${outDir}`);
    } catch (error) {
      console.warn(`summary artifact was not written: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else if (!args.apply) {
    console.log("dry run: nothing was written. Re-run with --apply.");
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
