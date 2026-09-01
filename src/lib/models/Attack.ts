import mongoose, { Schema, Document, Model } from "mongoose";
import {
  CASUALTY_PRECISION_VALUES,
  LOCATION_PRECISION_VALUES,
  type CasualtyMetadata,
  type LocationPrecision,
} from "../incident-uncertainty";

export interface IAttack extends Document {
  title: string;
  description: string;
  date: Date;
  location: {
    state: string;
    lga: string; // Local Government Area
    town: string;
    precision?: LocationPrecision;
    notes?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  group: string; // Terrorist group responsible
  casualties: {
    killed: number | null;
    injured: number | null;
    kidnapped: number | null;
    displaced: number | null;
  };
  casualtyMeta?: CasualtyMetadata;
  sources: {
    url: string;
    title: string;
    publisher: string;
  }[];
  status: "confirmed" | "unconfirmed" | "developing";
  tags: string[];
  hash: string; // SHA-256 hash for deduplication
  _deleted: boolean;
  _deletedReason?: string;
  _deletedAt?: Date;
  _deletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttackSchema = new Schema<IAttack>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    location: {
      state: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },
      lga: {
        type: String,
        default: "Unknown",
        trim: true,
      },
      town: {
        type: String,
        default: "Unknown",
        trim: true,
      },
      precision: {
        type: String,
        enum: LOCATION_PRECISION_VALUES,
        default: "exact",
      },
      notes: {
        type: String,
        default: "",
        trim: true,
        maxlength: 500,
      },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    group: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    casualties: {
      killed: { type: Number, default: null },
      injured: { type: Number, default: null },
      kidnapped: { type: Number, default: null },
      displaced: { type: Number, default: null },
    },
    casualtyMeta: {
      killed: {
        precision: { type: String, enum: CASUALTY_PRECISION_VALUES },
        min: { type: Number, default: null, min: 0 },
        max: { type: Number, default: null, min: 0 },
        estimate: { type: Number, default: null, min: 0 },
        sourceText: { type: String, trim: true, maxlength: 300 },
        note: { type: String, trim: true, maxlength: 500 },
      },
      injured: {
        precision: { type: String, enum: CASUALTY_PRECISION_VALUES },
        min: { type: Number, default: null, min: 0 },
        max: { type: Number, default: null, min: 0 },
        estimate: { type: Number, default: null, min: 0 },
        sourceText: { type: String, trim: true, maxlength: 300 },
        note: { type: String, trim: true, maxlength: 500 },
      },
      kidnapped: {
        precision: { type: String, enum: CASUALTY_PRECISION_VALUES },
        min: { type: Number, default: null, min: 0 },
        max: { type: Number, default: null, min: 0 },
        estimate: { type: Number, default: null, min: 0 },
        sourceText: { type: String, trim: true, maxlength: 300 },
        note: { type: String, trim: true, maxlength: 500 },
      },
      displaced: {
        precision: { type: String, enum: CASUALTY_PRECISION_VALUES },
        min: { type: Number, default: null, min: 0 },
        max: { type: Number, default: null, min: 0 },
        estimate: { type: Number, default: null, min: 0 },
        sourceText: { type: String, trim: true, maxlength: 300 },
        note: { type: String, trim: true, maxlength: 500 },
      },
    },
    sources: [
      {
        url: { type: String, required: true, trim: true },
        title: { type: String, trim: true, default: "" },
        publisher: { type: String, trim: true, default: "" },
      },
    ],
    status: {
      type: String,
      enum: ["confirmed", "unconfirmed", "developing"],
      default: "unconfirmed",
      index: true,
    },
    tags: [{ type: String, trim: true }],
    hash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    _deleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    _deletedReason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    _deletedAt: {
      type: Date,
      default: null,
    },
    _deletedBy: {
      type: String,
      default: "",
      trim: true,
      maxlength: 128,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for query performance
AttackSchema.index({ date: -1, "location.state": 1 });
AttackSchema.index({ createdAt: -1 });
AttackSchema.index({ _deleted: 1, date: -1 });

const Attack: Model<IAttack> =
  mongoose.models.Attack || mongoose.model<IAttack>("Attack", AttackSchema);

export default Attack;
