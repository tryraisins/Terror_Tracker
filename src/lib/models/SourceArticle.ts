import mongoose, { Model, Schema } from "mongoose";

/** Permanent receipt for every source article inspected by the free collector. */
const SourceArticleSchema = new Schema(
  {
    url: { type: String, required: true, unique: true, index: true },
    publisher: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 500 },
    publishedAt: { type: Date, required: true, index: true },
    incidentDate: { type: Date, default: null, index: true },
    outcome: { type: String, enum: ["published", "merged", "reference", "rejected"], required: true, index: true },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    attackId: { type: Schema.Types.ObjectId, ref: "Attack", default: null },
  },
  { timestamps: true },
);

const SourceArticle: Model<any> =
  mongoose.models.SourceArticle || mongoose.model("SourceArticle", SourceArticleSchema);

export default SourceArticle;
