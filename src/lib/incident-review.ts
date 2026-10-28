import IncidentReview, { createIncidentReviewKey, normalizeIncidentReviewSourceUrl, MAX_INCIDENT_REVIEW_ATTEMPTS } from "./models/IncidentReview";
import { normalizeIncidentDate } from "./incident-date";
import Attack from "./models/Attack";
import { ingestSearchLedAttacks, reextractSearchLedSource, type SearchLedReport, type SearchLedIngestResult, type SearchLedReviewLead } from "./search-led-discovery";
import type { RawAttackData } from "./free-news";
import type { IAttack } from "./models/Attack";

/**
 * The widest window any scheduled scan asks for: the Sunday catch-up uses 336
 * hours. A late report newer than this can still be carried by that slot.
 */
export const WIDEST_SCAN_WINDOW_HOURS = 336;

/**
 * Semantic findings on stored records also belong in the permanent queue.
 *
 * `same_event` is included deliberately. The model only reaches this function
 * after the heuristic pass, and a confident match was previously discarded,
 * which is how a duplicate could sit live with nothing flagging it. It is
 * queued for a decision rather than merged automatically: a post-hoc merge has
 * no user in the loop and the pre-insert gates already handle the routine case.
 */
export async function persistDuplicateReviewPairs(pairs: Array<{ reportA: IAttack; reportB: IAttack; deepSeekClassification?: string; deepSeekReason?: string }>) {
  let queued = 0;
  for (const pair of pairs) {
    const classification = pair.deepSeekClassification || "not_assessed";
    if (classification !== "review_required" && classification !== "not_assessed" && classification !== "same_event") continue;
    const ordered = [pair.reportA, pair.reportB].sort((a, b) => String(a._id).localeCompare(String(b._id)));
    const source = ordered[1].sources?.[0] || ordered[0].sources?.[0];
    if (!source || !/^https?:\/\//i.test(source.url)) continue;
    const ids = [String(pair.reportA._id), String(pair.reportB._id)].sort();
    const sourceUrl = normalizeIncidentReviewSourceUrl(source.url);
    const reviewKey = createIncidentReviewKey({ sourceUrl, kind: "duplicate", reason: `Stored event pair ${ids.join("/")}` });
    const now = new Date();
    const outcome = await IncidentReview.updateOne({ reviewKey }, {
      $set: { title: pair.reportB.title, publisher: source.publisher || "", state: pair.reportB.location.state,
        reason: classification === "same_event"
          ? `same_event: ${pair.deepSeekReason || "Both records describe the same event."} Merge the pair or dismiss it after checking the evidence.`
          : `${classification}: ${pair.deepSeekReason || "Possible duplicate requires event-level review."}`,
        lastSeenAt: now, publishedAt: source.publishedAt || null,
        sourceEvidence: { existingId: String(pair.reportA._id), candidateId: String(pair.reportB._id), classification },
        candidates: [pair.reportA, pair.reportB] },
      $setOnInsert: { sourceUrl, kind: "duplicate", status: "pending", attempts: 0, retryable: false, nextRetryAt: null },
    }, { upsert: true, runValidators: true });
    queued += outcome.upsertedCount;
  }
  return queued;
}

function reviewKind(lead: SearchLedReviewLead): "extraction" | "fetch" | "late_report" {
  if (/fetch|http|reader|timeout/i.test(lead.reason) && !lead.articleText) return "fetch";
  return /outside.*(?:window|horizon)|late.report/i.test(lead.reason) ? "late_report" : "extraction";
}

/** Repeated sightings preserve human dispositions and the source's retry budget. */
export async function persistIncidentReviews(report: SearchLedReport, ingest?: SearchLedIngestResult, candidates: RawAttackData[] = []) {
  let queued = 0;
  const now = new Date();
  const leads: Array<SearchLedReviewLead & { kind: "extraction" | "fetch" | "late_report" | "duplicate"; existingId: string }> = report.reviewLeads.map((lead) => ({ ...lead, kind: reviewKind(lead), existingId: "" }));
  for (const conflict of ingest?.reviewRequired || []) {
    const candidate = candidates.find((item) => item.title === conflict.candidateTitle && item.sources.some((source) => source.url === conflict.url));
    leads.push({ url: conflict.url, title: conflict.candidateTitle, publisher: candidate?.sources[0]?.publisher || "", reason: conflict.reason,
      retryable: false, candidates: candidate ? [candidate] : [], kind: "duplicate", existingId: conflict.existingId,
      state: candidate?.location.state, publishedAt: candidate?.sources[0]?.publishedAt });
  }
  for (const lead of leads) {
    if (!/^https?:\/\//i.test(lead.url)) continue;
    const reviewKey = createIncidentReviewKey({ sourceUrl: lead.url, kind: lead.kind, reason: lead.reason });
    const sourceUrl = normalizeIncidentReviewSourceUrl(lead.url);
    // Include budgets from past reasons, so a changed extraction error cannot reset retries.
    const prior = await IncidentReview.findOne({ sourceUrl, kind: lead.kind }).sort({ attempts: -1 }).select("attempts").lean();
    const attempts = prior?.attempts || 0;
    const retryable = lead.retryable && ["extraction", "fetch"].includes(lead.kind) && attempts < MAX_INCIDENT_REVIEW_ATTEMPTS;
    const outcome = await IncidentReview.updateOne({ reviewKey }, {
      $set: { title: lead.title, publisher: lead.publisher, reason: lead.reason, lastSeenAt: now,
        state: lead.state || "Unknown", publishedAt: lead.publishedAt ? new Date(lead.publishedAt) : null,
        sourceEvidence: { articleText: lead.articleText?.slice(0, 30000) || "", existingId: lead.existingId },
        candidates: lead.candidates || [] },
      $setOnInsert: { sourceUrl, kind: lead.kind, status: "pending", attempts, retryable,
        nextRetryAt: retryable ? new Date(now.getTime() + 6 * 3600000) : null },
    }, { upsert: true, runValidators: true });
    queued += outcome.upsertedCount;
  }
  // A normal scan may recover a source before its queued retry becomes due.
  // Keep human dismissals and unresolved per-source conflicts intact.
  if (ingest && ingest.errors === 0) {
    const blockedSources = new Set(leads.map((lead) => normalizeIncidentReviewSourceUrl(lead.url)));
    const capturedSources = [...new Set(candidates.flatMap((candidate) => candidate.sources.map((source) => normalizeIncidentReviewSourceUrl(source.url))))]
      .filter((url) => !blockedSources.has(url));
    if (capturedSources.length) await IncidentReview.updateMany({ sourceUrl: { $in: capturedSources }, status: "pending", kind: { $ne: "duplicate" } }, { $set: {
      status: "resolved", reviewedAt: now, reviewedBy: "collector", nextRetryAt: null,
      dispositionNote: "Source captured by a scan after source admission and duplicate checks.",
    } });
  }
  return queued;
}

/** Retry a small due batch through the same source evidence and duplicate gates. */
export async function retryIncidentReviews(limit = 5) {  const result = { processed: 0, resolved: 0, dismissed: 0, held: 0, errors: 0, inserted: 0, merged: 0 };
  const boundedLimit = Number.isFinite(limit) ? Math.max(0, Math.min(20, Math.floor(limit))) : 5;
  const now = new Date();
  const due = await IncidentReview.find({ status: "pending", retryable: true, attempts: { $lt: MAX_INCIDENT_REVIEW_ATTEMPTS }, nextRetryAt: { $ne: null, $lte: now } })
    .sort({ nextRetryAt: 1 }).limit(boundedLimit || 1).select("_id sourceUrl kind").lean();
  if (!boundedLimit) return result;
  const seenSources = new Set<string>();
  for (const item of due) {
    const sourceKey = `${item.sourceUrl}|${item.kind}`;
    if (seenSources.has(sourceKey)) continue;
    const claimed = await IncidentReview.findOneAndUpdate({ _id: item._id, status: "pending", retryable: true,
      attempts: { $lt: MAX_INCIDENT_REVIEW_ATTEMPTS }, nextRetryAt: { $ne: null, $lte: now } },
    { $inc: { attempts: 1 }, $set: { nextRetryAt: new Date(now.getTime() + 30 * 60000) } }, { returnDocument: "after" }).lean();
    if (!claimed) continue;
    seenSources.add(sourceKey);
    result.processed++;
    try {
      const { attacks, report } = await reextractSearchLedSource({ url: claimed.sourceUrl, title: claimed.title, publisher: claimed.publisher }, WIDEST_SCAN_WINDOW_HOURS);
      const ingest = await ingestSearchLedAttacks(attacks, "ReviewRetry");
      result.inserted += ingest.inserted;
      result.merged += ingest.merged;
      const resolved = attacks.length > 0 && ingest.errors === 0 && ingest.reviewRequired.length === 0 && report.reviewLeads.length === 0;
      // The source was read again and yielded no incident and no new lead. That is a
      // conclusive answer, not a failure to retry: the article no longer supports an
      // eligible event. Leaving the row pending is the treadmill that kept the queue
      // at over a hundred rows.
      const nothingFound = attacks.length === 0 && report.reviewLeads.length === 0 && ingest.errors === 0;
      await persistIncidentReviews(report, ingest, attacks);
      // Only the claimed row can change disposition; a concurrent admin dismissal wins.
      await IncidentReview.updateOne({ _id: claimed._id, status: "pending" }, { $set: resolved
        ? { status: "resolved", reviewedAt: new Date(), reviewedBy: "collector", dispositionNote: "Re-extracted and passed source admission and duplicate checks.", nextRetryAt: null, retryable: false }
        : nothingFound
          ? {
            status: "dismissed",
            reviewedAt: new Date(),
            reviewedBy: "collector",
            retryable: false,
            nextRetryAt: null,
            dispositionNote: "Re-read the source and it reports no eligible incident any more, so retrying cannot change the outcome.",
          }
          : { nextRetryAt: claimed.attempts < MAX_INCIDENT_REVIEW_ATTEMPTS ? new Date(Date.now() + 6 * 3600000) : null,
            retryable: claimed.attempts < MAX_INCIDENT_REVIEW_ATTEMPTS } });
      // Apply the same budget to parallel reasons from this source, preventing unbounded retry loops.
      await IncidentReview.updateMany({ sourceUrl: claimed.sourceUrl, kind: claimed.kind, attempts: { $lt: claimed.attempts } }, { $set: { attempts: claimed.attempts,
        ...(claimed.attempts >= MAX_INCIDENT_REVIEW_ATTEMPTS ? { retryable: false, nextRetryAt: null } : {}) } });
      if (resolved) result.resolved++; else if (nothingFound) result.dismissed++; else result.held++;
      result.errors += ingest.errors;
    } catch {
      result.errors++;
      await IncidentReview.updateOne({ _id: claimed._id, status: "pending" }, { $set: {
        nextRetryAt: claimed.attempts < MAX_INCIDENT_REVIEW_ATTEMPTS ? new Date(Date.now() + 6 * 3600000) : null,
        retryable: claimed.attempts < MAX_INCIDENT_REVIEW_ATTEMPTS,
      } });
      await IncidentReview.updateMany({ sourceUrl: claimed.sourceUrl, kind: claimed.kind, attempts: { $lt: claimed.attempts } }, { $set: { attempts: claimed.attempts,
        ...(claimed.attempts >= MAX_INCIDENT_REVIEW_ATTEMPTS ? { retryable: false, nextRetryAt: null } : {}) } });
    }
  }
  return result;
}

/**
 * Content rejections that retrying the same URL cannot change. The article
 * itself does not carry the fact the extraction needs, so leaving the row
 * pending only inflates the queue. Evidence-grounding failures are excluded
 * on purpose: those are extraction quality, not proof the article is unusable,
 * so they stay pending for another attempt or a human.
 */
const PERMANENT_EXTRACTION_REJECTION = [
  /^no Nigerian state/i,
  /^no explicit incident date/i,
  /^rescue or release headline does not identify the original incident date/i,
  /^DeepSeek not_incident/i,
  /^DeepSeek rejection: scope re-check failed/i,
  /retrospective analysis/i,
  /fact-check/i,
];

function isPermanentExtractionRejection(reason: string): boolean {
  return PERMANENT_EXTRACTION_REJECTION.some((pattern) => pattern.test(reason || ""));
}

/**
 * Keep the review queue honest without a human sweeping it.
 *
 * Five dispositions are deterministic and safe:
 * - a pending lead whose source is already cited by an active record is resolved;
 * - a duplicate row whose referenced record was merged or removed is resolved;
 * - a row that spent its retry budget is dismissed;
 * - an extraction row whose rejection is content-based is dismissed;
 * - a late report is requeued when its event is still inside the widest scan
 *   window, and dismissed as historical backfill when it is not.
 *
 * Event-level judgement is deliberately left to the duplicate review, because
 * whether two reports describe one attack needs evidence, not a heuristic.
 */
export async function sweepIncidentReviews(now = new Date(), dryRun = false) {
  const result = {
    scanned: 0,
    capturedSources: 0,
    staleReferences: 0,
    exhausted: 0,
    permanentRejections: 0,
    lateReportsRequeued: 0,
    lateReportsDismissed: 0,
  };
  const rows = await IncidentReview.find({ status: "pending" })
    .select("sourceUrl kind reason attempts retryable sourceEvidence candidates").lean();
  result.scanned = rows.length;
  if (!rows.length) return result;

  const active = await Attack.find({ _deleted: { $ne: true } }).select("_id sources.url").lean();
  const capturedSources = new Set<string>();
  const activeIds = new Set<string>();
  for (const record of active) {
    activeIds.add(String(record._id));
    for (const source of record.sources || []) {
      const key = normalizeIncidentReviewSourceUrl(source.url || "");
      if (key) capturedSources.add(key);
    }
  }

  const captured: string[] = [];
  const stale: string[] = [];
  const exhausted: string[] = [];
  const permanent: string[] = [];
  const lateReportsOld: string[] = [];
  const lateReportsDue: string[] = [];
  for (const row of rows) {
    const sourceKey = normalizeIncidentReviewSourceUrl(row.sourceUrl || "");
    if (row.kind !== "duplicate" && sourceKey && capturedSources.has(sourceKey)) {
      captured.push(String(row._id));
      continue;
    }
    if (row.kind === "duplicate") {
      const existingId = (row.sourceEvidence as { existingId?: string } | undefined)?.existingId;
      if (existingId && !activeIds.has(String(existingId))) {
        stale.push(String(row._id));
        continue;
      }
    }
    // A late report is an event the collector saw but would not ingest because it
    // fell outside the scan window. Two outcomes are deterministic:
    //   - inside the widest window the pipeline ever collects, the weekly catch-up
    //     can still carry it, so make it due for one re-extraction;
    //   - older than that, it belongs to historical backfill, not the daily queue.
    // Row with no parsed candidate has no event date, so it stays pending.
    if (row.kind === "late_report") {
      const candidate = (row.candidates as Array<{ date?: string | Date; datePrecision?: string; dateRange?: { start?: string | Date | null; end?: string | Date | null } }> | undefined)?.[0];
      const normalized = candidate
        ? normalizeIncidentDate({
          date: candidate.date,
          datePrecision: candidate.datePrecision as never,
          dateRange: candidate.dateRange,
        })
        : null;
      if (normalized) {
        const ageMs = now.getTime() - normalized.interval.end.getTime();
        if (ageMs > WIDEST_SCAN_WINDOW_HOURS * 3_600_000) {
          lateReportsOld.push(String(row._id));
          continue;
        }
        // Still reachable by the catch-up window. Requeue it once; a row that is
        // already due, or that has spent its retry budget, falls through to the
        // exhausted check rather than being silently skipped.
        if ((row.attempts || 0) < MAX_INCIDENT_REVIEW_ATTEMPTS && row.retryable !== true) {
          lateReportsDue.push(String(row._id));
          continue;
        }
      }
    }
    if ((row.attempts || 0) >= MAX_INCIDENT_REVIEW_ATTEMPTS) {
      exhausted.push(String(row._id));
      continue;
    }
    if (row.kind === "extraction" && isPermanentExtractionRejection(row.reason)) {
      permanent.push(String(row._id));
      continue;
    }
  }

  const apply = async (ids: string[], disposition: "resolved" | "dismissed", note: string) => {
    if (!ids.length) return 0;
    if (dryRun) return ids.length;
    const outcome = await IncidentReview.updateMany({ _id: { $in: ids }, status: "pending" }, { $set: {
      status: disposition,
      reviewedAt: now,
      reviewedBy: "queue-sweep",
      dispositionNote: note,
      nextRetryAt: null,
      retryable: false,
      updatedAt: now,
    } });
    return outcome.modifiedCount;
  };

  result.capturedSources = await apply(captured, "resolved", "Source is cited by an active incident record.");
  result.staleReferences = await apply(stale, "resolved", "The referenced record was merged into another incident or removed.");
  result.exhausted = await apply(exhausted, "dismissed", "Retry budget exhausted without usable source evidence.");
  result.permanentRejections = await apply(permanent, "dismissed", "The source cannot supply the missing fact, so retrying it cannot change the outcome.");
  result.lateReportsDismissed = await apply(
    lateReportsOld,
    "dismissed",
    `The reported event predates the widest window the scan collects (${WIDEST_SCAN_WINDOW_HOURS} hours), so no scheduled scan can carry it. Belongs to historical backfill, not the daily queue.`,
  );

  // Make the recent ones due now so the next scan retries them through the same
  // evidence and duplicate gates with the fourteen-day window.
  if (lateReportsDue.length) {
    if (dryRun) {
      result.lateReportsRequeued = lateReportsDue.length;
    } else {
      const outcome = await IncidentReview.updateMany(
        { _id: { $in: lateReportsDue }, status: "pending", retryable: { $ne: true } },
        { $set: { retryable: true, nextRetryAt: now, updatedAt: now } },
      );
      result.lateReportsRequeued = outcome.modifiedCount;
    }
  }
  return result;
}
