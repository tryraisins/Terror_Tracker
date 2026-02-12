import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAttack extends Document {
  title: string;
  description: string;
  date: Date;
  location: {
    state: string;
    lga: string; // Local Government Area
    town: string;
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
  sources: {
    url: string;
    title: string;
    publisher: string;
  }[];
  status: "confirmed" | "unconfirmed" | "developing";
  tags: string[];
  hash: string; // SHA-256 hash for deduplication
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
  },
  {
    timestamps: true,
  }
);

// Compound index for dedup queries
AttackSchema.index({ hash: 1 }, { unique: true });
AttackSchema.index({ date: -1, "location.state": 1 });
AttackSchema.index({ createdAt: -1 });

const Attack: Model<IAttack> =
  mongoose.models.Attack || mongoose.model<IAttack>("Attack", AttackSchema);

export default Attack;
