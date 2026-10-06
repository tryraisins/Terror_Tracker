import crypto from "crypto";
import mongoose, { Document, Model, Schema } from "mongoose";

export const INCIDENT_REVIEW_KINDS = ["extraction", "fetch", "duplicate", "late_report"] as const;
export const INCIDENT_REVIEW_STATUSES = ["pending", "resolved", "dismissed"] as const;
export const MAX_INCIDENT_REVIEW_ATTEMPTS = 3;

export type IncidentReviewKind = (typeof INCIDENT_REVIEW_KINDS)[number];
export type IncidentReviewStatus = (typeof INCIDENT_REVIEW_STATUSES)[number];

export interface IIncidentReview extends Document {
  reviewKey: string;
  sourceUrl: string;
  kind: IncidentReviewKind;
  reason: string;
  title: string;
  publisher: string;
  publishedAt: Date | null;
  state: string;
  sourceEvidence: unknown;
  candidates: unknown;
  attempts: number;
  nextRetryAt: Date | null;
  lastSeenAt: Date;
  status: IncidentReviewStatus;
  retryable: boolean;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  dispositionNote: string;
  createdAt: Date;
  updatedAt: Date;
}

export function normalizeIncidentReviewSourceUrl(value: string): string {
  try {
    const url = new URL(value.trim());
    url.hash = "";
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_.+|fbclid|gclid|mc_cid|mc_eid|ref|source)$/i.test(key)) {
        url.searchParams.delete(key);
      }
    }
    url.searchParams.sort();
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString().replace(/\/$/, "");
  } catch {
    return value.trim().replace(/\/+$/, "");
  }
}

export function createIncidentReviewKey(input: {
  sourceUrl: string;
  kind: IncidentReviewKind;
  reason: string;
}): string {
  const url = normalizeIncidentReviewSourceUrl(input.sourceUrl);
  const reason = input.reason.trim().replace(/\s+/g, " ").toLowerCase();
  return crypto.createHash("sha256").update(`${url}|${input.kind}|${reason}`).digest("hex");
}

const IncidentReviewSchema = new Schema<IIncidentReview>(
  {
    reviewKey: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      index: true,
      match: /^[a-f0-9]{64}$/,
    },
    sourceUrl: { type: String, required: true, trim: true, match: /^https?:\/\//i },
    kind: { type: String, required: true, enum: INCIDENT_REVIEW_KINDS, index: true },
    reason: { type: String, required: true, trim: true, maxlength: 2000 },
    title: { type: String, default: "", trim: true, maxlength: 500 },
    publisher: { type: String, default: "", trim: true, maxlength: 200 },
    publishedAt: { type: Date, default: null, index: true },
    state: { type: String, default: "Unknown", trim: true, maxlength: 100, index: true },
    sourceEvidence: { type: Schema.Types.Mixed, default: null, select: false },
    candidates: { type: Schema.Types.Mixed, default: null },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
      max: MAX_INCIDENT_REVIEW_ATTEMPTS,
    },
    nextRetryAt: { type: Date, default: null, index: true },
    lastSeenAt: { type: Date, required: true, default: Date.now, index: true },
    status: {
      type: String,
      required: true,
      enum: INCIDENT_REVIEW_STATUSES,
      default: "pending",
      index: true,
    },
    retryable: { type: Boolean, required: true, default: false, index: true },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: String, default: null, trim: true, maxlength: 128 },
    dispositionNote: { type: String, default: "", trim: true, maxlength: 2000 },
  },
  { timestamps: true, collection: "incident_reviews" },
);

IncidentReviewSchema.index({ status: 1, retryable: 1, nextRetryAt: 1, attempts: 1 });
IncidentReviewSchema.index({ status: 1, lastSeenAt: -1 });

const IncidentReview: Model<IIncidentReview> =
  mongoose.models.IncidentReview ||
  mongoose.model<IIncidentReview>("IncidentReview", IncidentReviewSchema, "incident_reviews");

export default IncidentReview;
