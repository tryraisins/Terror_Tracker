import dbConnect from "@/lib/db";
import IncidentReview from "@/lib/models/IncidentReview";
import ScanRun, {
  COMPLETED_SCAN_STATUSES,
  type ScanCoverageStatus,
  type ScanRunCounts,
} from "@/lib/models/ScanRun";

const configuredStaleHours = Number(process.env.SCAN_HEALTH_STALE_HOURS || 18);
export const SCAN_STALE_AFTER_HOURS = Number.isFinite(configuredStaleHours)
  ? Math.min(168, Math.max(1, configuredStaleHours))
  : 18;
export const SCAN_RUNNING_TIMEOUT_MINUTES = 90;

export interface PublicScanRun {
  runId: string;
  startedAt: string;
  finishedAt: string | null;
  coverageStatus: ScanCoverageStatus;
  totalStates: number;
  completedStates: number;
  failedStates: string[];
  lookbackHours: number;
  source: string;
  jurisdictions: Array<{
    state: string;
    status: "PASS" | "RECOVERED" | "DEGRADED" | "FAILED";
    retries: number;
    resultCount: number;
  }>;
  counts: ScanRunCounts;
}

export interface ScanHealthData {
  generatedAt: string;
  stale: boolean;
  staleAfterHours: number;
  warning: "bootstrap" | "stale" | "missed" | null;
  warningMessage: string | null;
  lastCompleted: PublicScanRun | null;
  latestAttempt: PublicScanRun | null;
  reviewQueue: { pending: number };
}

type ScanRunRecord = {
  runId: string;
  startedAt: Date;
  finishedAt?: Date | null;
  coverageStatus: ScanCoverageStatus;
  totalStates: number;
  completedStates: number;
  failedStates?: string[];
  lookbackHours: number;
  source: string;
  jurisdictions?: Array<{
    state: string;
    status: "PASS" | "RECOVERED" | "DEGRADED" | "FAILED";
    providerErrors?: string[];
    retries: number;
    resultCount: number;
  }>;
  counts?: Partial<ScanRunCounts>;
};

const COUNT_KEYS: Array<keyof ScanRunCounts> = [
  "urlsDiscovered",
  "urlsFetched",
  "fetchRetries",
  "fetchFailures",
  "feedFailures",
  "searchFailures",
  "admitted",
  "rejected",
  "inserted",
  "merged",
  "reviewQueued",
  "duplicateReviews",
  "ingestErrors",
  "braveFallbackCalls",
  "deepseekCalls",
  "deepseekConfirmed",
  "deepseekRejected",
  "deepseekReviewRequired",
  "deepseekErrors",
];

function publicCounts(value: Partial<ScanRunCounts> | undefined): ScanRunCounts {
  return COUNT_KEYS.reduce((counts, key) => {
    counts[key] = Math.max(0, Number(value?.[key]) || 0);
    return counts;
  }, {} as ScanRunCounts);
}

function serializeScanRun(run: ScanRunRecord | null): PublicScanRun | null {
  if (!run) return null;
  return {
    runId: run.runId,
    startedAt: new Date(run.startedAt).toISOString(),
    finishedAt: run.finishedAt ? new Date(run.finishedAt).toISOString() : null,
    coverageStatus: run.coverageStatus,
    totalStates: Math.max(0, Number(run.totalStates) || 0),
    completedStates: Math.max(0, Number(run.completedStates) || 0),
    failedStates: (run.failedStates || []).map(String),
    lookbackHours: Math.max(0, Number(run.lookbackHours) || 0),
    source: run.source,
    jurisdictions: (run.jurisdictions || []).map((jurisdiction) => ({
      state: jurisdiction.state,
      status: jurisdiction.status,
      retries: Math.max(0, Number(jurisdiction.retries) || 0),
      resultCount: Math.max(0, Number(jurisdiction.resultCount) || 0),
    })),
    counts: publicCounts(run.counts),
  };
}

export async function getScanHealth(now = new Date()): Promise<ScanHealthData> {
  await dbConnect();

  const [latestAttemptRecord, lastCompletedRecord, pendingReviews] = await Promise.all([
    ScanRun.findOne({}).sort({ startedAt: -1 }).lean<ScanRunRecord>(),
    ScanRun.findOne({ coverageStatus: { $in: [...COMPLETED_SCAN_STATUSES] }, finishedAt: { $ne: null } })
      .sort({ finishedAt: -1, startedAt: -1 })
      .lean<ScanRunRecord>(),
    IncidentReview.countDocuments({ status: "pending" }),
  ]);

  const latestAttempt = serializeScanRun(latestAttemptRecord);
  const lastCompleted = serializeScanRun(lastCompletedRecord);
  const lastCompletedAt = lastCompleted?.finishedAt || lastCompleted?.startedAt || null;
  const stale = !lastCompletedAt || now.getTime() - new Date(lastCompletedAt).getTime() > SCAN_STALE_AFTER_HOURS * 3_600_000;
  const runningTooLong = latestAttempt?.coverageStatus === "RUNNING"
    && now.getTime() - new Date(latestAttempt.startedAt).getTime() > SCAN_RUNNING_TIMEOUT_MINUTES * 60_000;
  const failedAfterCompletion = Boolean(
    latestAttempt
      && ["FAILED", "INCOMPLETE"].includes(latestAttempt.coverageStatus)
      && (!lastCompleted || new Date(latestAttempt.startedAt).getTime() > new Date(lastCompleted.startedAt).getTime()),
  );

  let warning: ScanHealthData["warning"] = null;
  let warningMessage: string | null = null;
  if (!latestAttempt && !lastCompleted) {
    warning = "bootstrap";
    warningMessage = "Scan health is waiting for the first persisted run.";
  } else if (runningTooLong || failedAfterCompletion) {
    warning = "missed";
    warningMessage = runningTooLong
      ? "The latest scan has been running for more than 90 minutes. Coverage may be delayed."
      : lastCompleted
        ? "The latest scan did not complete. The previous completed coverage remains the current reference."
        : "The latest scan did not complete, and no completed coverage has been recorded yet.";
  } else if (stale) {
    warning = "stale";
    warningMessage = `No completed scan has been recorded in the last ${SCAN_STALE_AFTER_HOURS} hours.`;
  }

  return {
    generatedAt: now.toISOString(),
    stale,
    staleAfterHours: SCAN_STALE_AFTER_HOURS,
    warning,
    warningMessage,
    lastCompleted,
    latestAttempt,
    reviewQueue: { pending: pendingReviews },
  };
}

/**
 * Public freshness only.
 *
 * The public pages show when the record was last refreshed and nothing else:
 * coverage warnings, failed states and review backlog are operator concerns and
 * are served by the session-gated admin endpoint instead.
 */
export interface PublicScanFreshness {
  lastCompletedAt: string | null;
}

export async function getPublicScanFreshness(): Promise<PublicScanFreshness> {
  await dbConnect();
  const lastCompletedRecord = await ScanRun.findOne({
    coverageStatus: { $in: [...COMPLETED_SCAN_STATUSES] },
    finishedAt: { $ne: null },
  })
    .sort({ finishedAt: -1, startedAt: -1 })
    .select({ finishedAt: 1, startedAt: 1 })
    .lean<{ finishedAt?: Date | null; startedAt?: Date | null }>();

  const at = lastCompletedRecord?.finishedAt ?? lastCompletedRecord?.startedAt ?? null;
  return { lastCompletedAt: at ? new Date(at).toISOString() : null };
}

export interface AdminScanRuns {
  health: ScanHealthData;
  recent: PublicScanRun[];
}

/** Full collection health plus the recent run history, for the admin panel. */
export async function getScanRunsForAdmin(limit = 10): Promise<AdminScanRuns> {
  const health = await getScanHealth();
  const recent = await ScanRun.find({})
    .sort({ startedAt: -1 })
    .limit(Math.min(50, Math.max(1, limit)))
    .lean<ScanRunRecord[]>();

  return {
    health,
    recent: recent
      .map((run) => serializeScanRun(run))
      .filter((run): run is PublicScanRun => run !== null),
  };
}
