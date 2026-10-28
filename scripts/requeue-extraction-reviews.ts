/**
 * Phase 3: drain the extraction backlog through the real retry path.
 *
 * An extraction lead exists because the collector asserted a date, a place or a
 * casualty figure the article did not support. Two things changed to make a retry
 * worth running:
 *   - a casualty figure whose model-supplied quote was paraphrased is rescued by
 *     finding the number in a sentence next to a victim noun;
 *   - a figure that is genuinely unsupported is dropped, and the incident is
 *     recorded with an unknown toll instead of being withheld entirely.
 *
 * The retry itself is `retryIncidentReviews`, the same code the scheduled scan
 * uses, so this script only decides which rows to make due.
 *
 *   npx tsx scripts/requeue-extraction-reviews.ts --limit 5            # dry run
 *   npx tsx scripts/requeue-extraction-reviews.ts --limit 5 --apply
 */

import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

type Args = { apply: boolean; limit: number };

function parseArgs(argv: string[]): Args {
  const args: Args = { apply: false, limit: 5 };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--apply") args.apply = true;
    else if (argv[index] === "--limit") args.limit = Math.max(1, Number(argv[++index]) || 5);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  // Imported after dotenv, because src/lib/db.ts reads the URI at module load time.
  const { default: mongoose } = await import("mongoose");
  const { default: IncidentReview } = await import("../src/lib/models/IncidentReview");
  const { retryIncidentReviews } = await import("../src/lib/incident-review");

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

  // These rows are normally retried by the scan itself, five at a time; the backlog
  // is what keeps failing. Select the ones whose turn has come.
  const rows = await IncidentReview.find({
    status: "pending",
    kind: "extraction",
    attempts: { $lt: 3 },
    $or: [{ retryable: { $ne: true } }, { nextRetryAt: null }, { nextRetryAt: { $lte: new Date() } }],
  })
    .select("_id sourceUrl reason attempts")
    .sort({ lastSeenAt: 1 })
    .limit(args.limit)
    .lean();

  console.log(`${args.apply ? "APPLY" : "DRY RUN"}: ${rows.length} extraction rows selected`);
  for (const row of rows) {
    console.log(`  ${String(row._id)} attempts=${row.attempts} ${row.reason.slice(0, 70)}`);
  }

  if (!args.apply) {
    console.log("\nDry run: nothing was written. Re-run with --apply.");
    await mongoose.disconnect();
    return;
  }

  // Make them due now, then hand them to the real retry path. It increments the
  // attempt counter, re-fetches, re-extracts and re-runs the admission gates.
  const due = await IncidentReview.updateMany(
    { _id: { $in: rows.map((row) => row._id) }, status: "pending", retryable: { $ne: true } },
    { $set: { retryable: true, nextRetryAt: new Date(), updatedAt: new Date() } },
  );
  console.log(`\nmarked ${due.modifiedCount} rows due`);

  const result = await retryIncidentReviews(rows.length);
  console.log(JSON.stringify(result, null, 2));

  const remaining = await IncidentReview.countDocuments({ status: "pending", kind: "extraction" });
  const retryable = await IncidentReview.countDocuments({ status: "pending", kind: "extraction", retryable: true });
  console.log(`\nextraction pending: ${remaining} (${retryable} still retryable)`);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
