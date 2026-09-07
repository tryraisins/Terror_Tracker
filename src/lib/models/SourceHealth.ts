import mongoose, { Model, Schema } from "mongoose";

const SourceHealthSchema = new Schema(
  {
    feedUrl: { type: String, required: true, unique: true, index: true },
    publisher: { type: String, required: true, trim: true },
    host: { type: String, required: true, trim: true, index: true },
    status: { type: String, enum: ["PASS", "PAUSED"], required: true, index: true },
    lastHttpStatus: { type: Number, default: null },
    lastCheckedAt: { type: Date, required: true, index: true },
    pausedAt: { type: Date, default: null },
    lastReason: { type: String, required: true, trim: true, maxlength: 500 },
    consecutiveFailures: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

const SourceHealth: Model<any> =
  mongoose.models.SourceHealth || mongoose.model("SourceHealth", SourceHealthSchema);

export default SourceHealth;
