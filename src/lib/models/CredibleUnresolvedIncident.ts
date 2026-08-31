import mongoose, { Document, Model, Schema } from "mongoose";
import {
  CANONICAL_NIGERIA_JURISDICTIONS,
  UNRESOLVED_REASON_CODES,
} from "../incident-audit-contract";

export interface ICredibleUnresolvedIncident extends Document {
  candidateHash: string;
  auditRunId: string;
  headline: string;
  description: string;
  incidentType: "abduction" | "armed_attack" | "IED" | "communal_violence" | "other";
  eventDate: Date | null;
  datePrecision: "exact_day" | "date_range" | "month_only" | "unknown";
  dateRange: { start: Date | null; end: Date | null };
  location: { state: string; lga: string; town: string };
  locationPrecision: "exact_lga_or_town" | "state_only" | "unknown";
  group: string;
  casualties: {
    killed: number | null;
    injured: number | null;
    kidnapped: number | null;
    displaced: number | null;
  };
  sources: {
    url: string;
    title: string;
    publisher: string;
    publishedAt: Date | null;
    sourceType: "official" | "trusted_media" | "structured_dataset";
  }[];
  reasonCodes: string[];
  requiredNextEvidence: string;
  productionWriteAllowed: false;
  reviewStatus: "open" | "resolved_to_attack" | "rejected" | "merged_reference";
  recordFingerprint: string;
  createdAt: Date;
  updatedAt: Date;
}

const nullableCasualty = { type: Number, default: null, min: 0 } as const;

const CredibleUnresolvedIncidentSchema = new Schema<ICredibleUnresolvedIncident>(
  {
    candidateHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
      immutable: true,
      match: /^[a-f0-9]{64}$/,
    },
    auditRunId: { type: String, required: true, trim: true, index: true },
    headline: { type: String, required: true, trim: true, maxlength: 500 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    incidentType: {
      type: String,
      required: true,
      enum: ["abduction", "armed_attack", "IED", "communal_violence", "other"],
      index: true,
    },
    eventDate: { type: Date, default: null, index: true },
    datePrecision: {
      type: String,
      required: true,
      enum: ["exact_day", "date_range", "month_only", "unknown"],
    },
    dateRange: {
      start: { type: Date, default: null },
      end: { type: Date, default: null },
    },
    location: {
      state: {
        type: String,
        required: true,
        enum: CANONICAL_NIGERIA_JURISDICTIONS,
        index: true,
      },
      lga: { type: String, required: true, default: "Unknown", trim: true },
      town: { type: String, required: true, default: "Unknown", trim: true },
    },
    locationPrecision: {
      type: String,
      required: true,
      enum: ["exact_lga_or_town", "state_only", "unknown"],
    },
    group: { type: String, required: true, default: "Unknown", trim: true },
    casualties: {
      killed: nullableCasualty,
      injured: nullableCasualty,
      kidnapped: nullableCasualty,
      displaced: nullableCasualty,
    },
    sources: {
      type: [
        new Schema(
          {
            url: { type: String, required: true, trim: true, match: /^https?:\/\//i },
            title: { type: String, required: true, trim: true, maxlength: 500 },
            publisher: { type: String, required: true, trim: true, maxlength: 200 },
            publishedAt: { type: Date, default: null },
            sourceType: {
              type: String,
              required: true,
              enum: ["official", "trusted_media", "structured_dataset"],
            },
          },
          { _id: false },
        ),
      ],
      required: true,
      validate: {
        validator: (sources: unknown[]) => Array.isArray(sources) && sources.length > 0,
        message: "At least one direct evidence URL is required.",
      },
    },
    reasonCodes: {
      type: [{ type: String, enum: UNRESOLVED_REASON_CODES }],
      required: true,
      validate: {
        validator: (codes: unknown[]) => Array.isArray(codes) && codes.length > 0,
        message: "At least one unresolved reason code is required.",
      },
    },
    requiredNextEvidence: { type: String, required: true, trim: true, maxlength: 2000 },
    productionWriteAllowed: {
      type: Boolean,
      required: true,
      default: false,
      immutable: true,
      validate: {
        validator: (value: boolean) => value === false,
        message: "Unresolved candidates can never be production-write eligible.",
      },
    },
    reviewStatus: {
      type: String,
      required: true,
      enum: ["open", "resolved_to_attack", "rejected", "merged_reference"],
      default: "open",
      index: true,
    },
    recordFingerprint: { type: String, required: true, match: /^[a-f0-9]{64}$/ },
  },
  { timestamps: true, collection: "credible_unresolved_incidents" },
);

CredibleUnresolvedIncidentSchema.index({ auditRunId: 1, "location.state": 1, reviewStatus: 1 });
CredibleUnresolvedIncidentSchema.index({ auditRunId: 1, eventDate: 1 });

const CredibleUnresolvedIncident: Model<ICredibleUnresolvedIncident> =
  mongoose.models.CredibleUnresolvedIncident ||
  mongoose.model<ICredibleUnresolvedIncident>(
    "CredibleUnresolvedIncident",
    CredibleUnresolvedIncidentSchema,
    "credible_unresolved_incidents",
  );

export default CredibleUnresolvedIncident;
