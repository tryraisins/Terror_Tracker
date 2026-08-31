import mongoose, { Document, Model, Schema } from "mongoose";
import { CANONICAL_NIGERIA_JURISDICTIONS } from "../incident-audit-contract";

export interface IIncidentCrosswalkEvidence extends Document {
  evidenceHash: string;
  auditRunId: string;
  recordType: "source_crosswalk" | "historical_revalidation" | "dataset_access" | "trend_gate";
  jurisdiction: string | null;
  periodStart: Date;
  periodEnd: Date;
  sourceAuthority: string;
  sourceType: "official" | "trusted_media" | "structured_dataset" | "repository_evidence";
  accessStatus: "PASS" | "PARTIAL" | "BLOCKED" | "FAIL" | "UNRESOLVED";
  coverageStatus: "MATCHED_ATTACK" | "MATCHED_UNRESOLVED" | "NO_RELEASE_FOUND" | "UNLINKED" | "NON_INCIDENT" | "NOT_APPLICABLE" | "GATE";
  sourceUrl: string | null;
  sourceTitle: string;
  publishedAt: Date | null;
  eventDate: Date | null;
  attackIds: mongoose.Types.ObjectId[];
  candidateHashes: string[];
  findings: string[];
  requiredNextEvidence: string;
  trendEligible: boolean;
  recordFingerprint: string;
  createdAt: Date;
  updatedAt: Date;
}

const IncidentCrosswalkEvidenceSchema = new Schema<IIncidentCrosswalkEvidence>(
  {
    evidenceHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
      immutable: true,
      match: /^[a-f0-9]{64}$/,
    },
    auditRunId: { type: String, required: true, trim: true, index: true },
    recordType: {
      type: String,
      required: true,
      enum: ["source_crosswalk", "historical_revalidation", "dataset_access", "trend_gate"],
      index: true,
    },
    jurisdiction: {
      type: String,
      default: null,
      enum: [...CANONICAL_NIGERIA_JURISDICTIONS, null],
      index: true,
    },
    periodStart: { type: Date, required: true, index: true },
    periodEnd: { type: Date, required: true, index: true },
    sourceAuthority: { type: String, required: true, trim: true, maxlength: 300 },
    sourceType: {
      type: String,
      required: true,
      enum: ["official", "trusted_media", "structured_dataset", "repository_evidence"],
    },
    accessStatus: {
      type: String,
      required: true,
      enum: ["PASS", "PARTIAL", "BLOCKED", "FAIL", "UNRESOLVED"],
      index: true,
    },
    coverageStatus: {
      type: String,
      required: true,
      enum: ["MATCHED_ATTACK", "MATCHED_UNRESOLVED", "NO_RELEASE_FOUND", "UNLINKED", "NON_INCIDENT", "NOT_APPLICABLE", "GATE"],
      index: true,
    },
    sourceUrl: { type: String, default: null, trim: true, match: /^https?:\/\//i },
    sourceTitle: { type: String, required: true, trim: true, maxlength: 500 },
    publishedAt: { type: Date, default: null },
    eventDate: { type: Date, default: null },
    attackIds: [{ type: Schema.Types.ObjectId, ref: "Attack" }],
    candidateHashes: [{ type: String, match: /^[a-f0-9]{64}$/ }],
    findings: [{ type: String, trim: true, maxlength: 2000 }],
    requiredNextEvidence: { type: String, required: true, trim: true, maxlength: 2000 },
    trendEligible: { type: Boolean, required: true, default: false, index: true },
    recordFingerprint: { type: String, required: true, match: /^[a-f0-9]{64}$/ },
  },
  { timestamps: true, collection: "incident_crosswalk_evidence" },
);

IncidentCrosswalkEvidenceSchema.index({ auditRunId: 1, recordType: 1, jurisdiction: 1 });
IncidentCrosswalkEvidenceSchema.index({ recordType: 1, trendEligible: 1, createdAt: -1 });

const IncidentCrosswalkEvidence: Model<IIncidentCrosswalkEvidence> =
  mongoose.models.IncidentCrosswalkEvidence ||
  mongoose.model<IIncidentCrosswalkEvidence>(
    "IncidentCrosswalkEvidence",
    IncidentCrosswalkEvidenceSchema,
    "incident_crosswalk_evidence",
  );

export default IncidentCrosswalkEvidence;
