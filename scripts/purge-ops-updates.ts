/**
 * purge-ops-updates.ts
 *
 * Soft-deletes records that are security-operation/rescue/arrest updates
 * rather than fresh attack incidents with civilian victims.
 *
 * These were ingested before the isLikelyOperationalUpdate filter was added
 * to gemini.ts. New records are now blocked at ingest time; this script
 * retroactively cleans up what slipped through.
 *
 * Safe: uses _deleted: true (soft delete, fully reversible).
 *
 * Usage:
 *   npx tsx scripts/purge-ops-updates.ts            # dry run
 *   npx tsx scripts/purge-ops-updates.ts --execute  # apply
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import mongoose from "mongoose";

interface IncidentDoc {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  date: Date;
  location?: { state?: string; lga?: string; town?: string };
  casualties?: { killed?: number | null; kidnapped?: number | null };
  _deleted?: boolean;
}

function isLikelyOperationalUpdate(doc: IncidentDoc): boolean {
  const title = String(doc.title || "");
  const description = String(doc.description || "");
  const combined = `${title} ${description}`.toLowerCase();

  const isSecOp =
    /\b(troops?|soldiers?|military|army|air\s*force|naf|joint\s*task\s*force|jtf|operation\s*hadin\s*kai|dhq|security\s*operatives?|police)\b/i.test(combined);

  const opVerb =
    /\b(rescue|rescued|arrest|arrested|foiled?|foil|recover|recovered|neutrali[sz]e|neutrali[sz]ed|eliminat(?:e|ed|ing)|raid(?:ed|ing)?)\b/i.test(combined);

  const attackDrivenTitle =
    /\b(boko\s*haram|iswap|bandits?|gunmen|terrorists?|insurgents?|militants?|unknown\s*gunmen)\s+(kill(?:ed|s|ing)?|abduct(?:ed|s|ing)?|attack(?:ed|s|ing)?|kidnap(?:ped|s|ping)?|storm(?:ed|s|ing)?|raid(?:ed|s|ing)?)\b/i.test(title);

  const victimRolePresent =
    /\b(civilians?|villagers?|residents?|farmers?|passengers?|worshippers?|students?|women|children|soldiers?|troops?|police|officers?|personnel|vigilantes?)\b/i.test(combined);
  const harmVerbPresent =
    /\b(killed|died|injured|wounded|kidnapped|abducted|attacked|ambushed|massacred|slaughtered)\b/i.test(combined);
  const mentionsVictimHarm = victimRolePresent && harmVerbPresent;

  return isSecOp && opVerb && !mentionsVictimHarm && !attackDrivenTitle;
}

async function run() {
  const execute = process.argv.includes("--execute");
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set");

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  const col = mongoose.connection.collection("attacks");

  const docs = await col.find({
    _deleted: { $ne: true },
    date: { $gte: new Date("2026-01-01T00:00:00.000Z"), $lt: new Date("2026-05-01T00:00:00.000Z") },
  }).toArray() as unknown as IncidentDoc[];

  const targets = docs.filter(isLikelyOperationalUpdate);

  // Group for reporting
  const byMonth: Record<string, { count: number; killed: number; kidnapped: number; samples: string[] }> = {};
  for (const d of targets) {
    const key = d.date.toISOString().slice(0, 7);
    if (!byMonth[key]) byMonth[key] = { count: 0, killed: 0, kidnapped: 0, samples: [] };
    byMonth[key].count++;
    byMonth[key].killed += d.casualties?.killed ?? 0;
    byMonth[key].kidnapped += d.casualties?.kidnapped ?? 0;
    if (byMonth[key].samples.length < 3) {
      byMonth[key].samples.push(`  [${d._id}] ${d.date.toISOString().slice(0, 10)} | "${d.title}"`);
    }
  }

  console.log(`\nMode: ${execute ? "EXECUTE" : "DRY RUN"}`);
  console.log(`Found ${targets.length} ops-update records to soft-delete:\n`);
  for (const [m, v] of Object.entries(byMonth).sort()) {
    console.log(`${m}: ${v.count} records | killed ${v.killed} | kidnapped ${v.kidnapped}`);
    for (const s of v.samples) console.log(s);
  }

  if (execute && targets.length > 0) {
    const ids = targets.map(d => d._id);
    const result = await col.updateMany(
      { _id: { $in: ids } },
      { $set: { _deleted: true, _deletedReason: "Operational update — not a fresh attack incident", updatedAt: new Date() } },
    );
    console.log(`\nSoft-deleted ${result.modifiedCount} records.`);
  }

  // Final monthly totals after purge
  const monthly = await col.aggregate([
    {
      $match: {
        _deleted: { $ne: true },
        date: { $gte: new Date("2026-01-01T00:00:00.000Z"), $lt: new Date("2027-01-01T00:00:00.000Z") },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
        incidents: { $sum: 1 },
        killed: { $sum: { $ifNull: ["$casualties.killed", 0] } },
        kidnapped: { $sum: { $ifNull: ["$casualties.kidnapped", 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]).toArray();

  console.log(`\nMonthly totals ${execute ? "after purge" : "(current, pre-purge)"}:`);
  for (const row of monthly) {
    console.log(`  ${row._id}: incidents=${row.incidents}, killed=${row.killed}, kidnapped=${row.kidnapped}`);
  }

  await mongoose.disconnect();
}

run().catch(async err => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
