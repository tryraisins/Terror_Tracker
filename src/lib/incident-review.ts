import IncidentReview, { createIncidentReviewKey, normalizeIncidentReviewSourceUrl, MAX_INCIDENT_REVIEW_ATTEMPTS } from "./models/IncidentReview";
import { ingestSearchLedAttacks, reextractSearchLedSource, type SearchLedReport, type SearchLedIngestResult, type SearchLedReviewLead } from "./search-led-discovery";
import type { RawAttackData } from "./free-news";

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
export async function retryIncidentReviews(limit = 5) {
  const result = { processed: 0, resolved: 0, held: 0, errors: 0, inserted: 0, merged: 0 };
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
      const { attacks, report } = await reextractSearchLedSource({ url: claimed.sourceUrl, title: claimed.title, publisher: claimed.publisher }, 336);
      const ingest = await ingestSearchLedAttacks(attacks, "ReviewRetry");
      result.inserted += ingest.inserted;
      result.merged += ingest.merged;
      const resolved = attacks.length > 0 && ingest.errors === 0 && ingest.reviewRequired.length === 0 && report.reviewLeads.length === 0;
      await persistIncidentReviews(report, ingest, attacks);
      // Only the claimed row can change disposition; a concurrent admin dismissal wins.
      await IncidentReview.updateOne({ _id: claimed._id, status: "pending" }, { $set: resolved
        ? { status: "resolved", reviewedAt: new Date(), reviewedBy: "collector", dispositionNote: "Re-extracted and passed source admission and duplicate checks.", nextRetryAt: null }
        : { nextRetryAt: claimed.attempts < MAX_INCIDENT_REVIEW_ATTEMPTS ? new Date(Date.now() + 6 * 3600000) : null,
          retryable: claimed.attempts < MAX_INCIDENT_REVIEW_ATTEMPTS } });
      // Apply the same budget to parallel reasons from this source, preventing unbounded retry loops.
      await IncidentReview.updateMany({ sourceUrl: claimed.sourceUrl, kind: claimed.kind, attempts: { $lt: claimed.attempts } }, { $set: { attempts: claimed.attempts,
        ...(claimed.attempts >= MAX_INCIDENT_REVIEW_ATTEMPTS ? { retryable: false, nextRetryAt: null } : {}) } });
      if (resolved) result.resolved++; else result.held++;
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
