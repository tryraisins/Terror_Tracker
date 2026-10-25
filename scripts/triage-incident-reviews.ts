/**
 * Sweep the incident review queue with the deterministic rules in
 * `sweepIncidentReviews`. The scheduled scan runs the same sweep after every
 * run, so this CLI is for inspection and one-off cleanup.
 *
 *   npx tsx scripts/triage-incident-reviews.ts            # dry run
 *   npx tsx scripts/triage-incident-reviews.ts --apply
 */

import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: ".env.local" });

async function main() {
  const apply = process.argv.includes("--apply");
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not found in .env.local");
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000, bufferCommands: false });
  const { sweepIncidentReviews } = await import("../src/lib/incident-review");
  const summary = await sweepIncidentReviews(new Date(), !apply);
  console.log(apply ? "APPLIED" : "DRY RUN");
  console.log(JSON.stringify(summary, null, 2));
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
