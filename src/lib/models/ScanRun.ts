import mongoose, { Document, Model, Schema } from "mongoose";

export const SCAN_COVERAGE_STATUSES = [
  "RUNNING",
  "FAILED",
  "COMPLETE",
  "DEGRADED",
  "REVIEW_REQUIRED",
  "INCOMPLETE",
] as const;

export const COMPLETED_SCAN_STATUSES = ["COMPLETE", "DEGRADED", "REVIEW_REQUIRED"] as const;

export type ScanCoverageStatus = (typeof SCAN_COVERAGE_STATUSES)[number];

export interface ScanRunCounts {
  urlsDiscovered: number;
  urlsFetched: number;
  fetchRetries: number;
  fetchFailures: number;
  feedFailures: number;
  searchFailures: number;
  admitted: number;
  rejected: number;
  inserted: number;
  merged: number;
  reviewQueued: number;
  duplicateReviews: number;
  ingestErrors: number;
  braveFallbackCalls: number;
  deepseekCalls: number;
  deepseekConfirmed: number;
  deepseekRejected: number;
  deepseekReviewRequired: number;
  deepseekErrors: number;
}

export interface ScanRunJurisdiction {
  state: string;
  status: "PASS" | "RECOVERED" | "DEGRADED" | "FAILED";
  providerErrors: string[];
  retries: number;
  resultCount: number;
}

export interface IScanRun extends Document {
  runId: string;
  startedAt: Date;
  finishedAt: Date | null;
  coverageStatus: ScanCoverageStatus;
  totalStates: number;
  completedStates: number;
  failedStates: string[];
  lookbackHours: number;
  source: string;
  jurisdictions: ScanRunJurisdiction[];
  counts: ScanRunCounts;
  createdAt: Date;
  updatedAt: Date;
}

const countField = { type: Number, required: true, default: 0, min: 0 } as const;

const ScanRunSchema = new Schema<IScanRun>(
  {
    runId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      index: true,
      trim: true,
      maxlength: 200,
    },
    startedAt: { type: Date, required: true, index: true },
    finishedAt: { type: Date, default: null, index: true },
    coverageStatus: {
      type: String,
      required: true,
      enum: SCAN_COVERAGE_STATUSES,
      default: "RUNNING",
      index: true,
    },
    totalStates: { type: Number, required: true, min: 0, default: 0 },
    completedStates: { type: Number, required: true, min: 0, default: 0 },
    failedStates: [{ type: String, trim: true, maxlength: 100 }],
    lookbackHours: { type: Number, required: true, min: 1, max: 336 },
    source: { type: String, required: true, trim: true, maxlength: 100, index: true },
    jurisdictions: [
      new Schema(
        {
          state: { type: String, required: true, trim: true, maxlength: 100 },
          status: {
            type: String,
            required: true,
            enum: ["PASS", "RECOVERED", "DEGRADED", "FAILED"],
          },
          providerErrors: [{ type: String, trim: true, maxlength: 1000 }],
          retries: { type: Number, required: true, default: 0, min: 0 },
          resultCount: { type: Number, required: true, default: 0, min: 0 },
        },
        { _id: false },
      ),
    ],
    counts: {
      urlsDiscovered: countField,
      urlsFetched: countField,
      fetchRetries: countField,
      fetchFailures: countField,
      feedFailures: countField,
      searchFailures: countField,
      admitted: countField,
      rejected: countField,
      inserted: countField,
      merged: countField,
      reviewQueued: countField,
      duplicateReviews: countField,
      ingestErrors: countField,
      braveFallbackCalls: countField,
      deepseekCalls: countField,
      deepseekConfirmed: countField,
      deepseekRejected: countField,
      deepseekReviewRequired: countField,
      deepseekErrors: countField,
    },
  },
  { timestamps: true, collection: "scan_runs" },
);

ScanRunSchema.index({ coverageStatus: 1, finishedAt: -1, startedAt: -1 });

const ScanRun: Model<IScanRun> =
  mongoose.models.ScanRun || mongoose.model<IScanRun>("ScanRun", ScanRunSchema, "scan_runs");

export default ScanRun;
