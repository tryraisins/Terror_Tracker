/**
 * Convert valid string dates in active incident records to MongoDB BSON Dates.
 *
 * Usage:
 *   npx tsx scripts/normalize-attack-date-types.ts
 *   npx tsx scripts/normalize-attack-date-types.ts --apply
 *
 * The dry run lists only affected record IDs and normalized values. Apply uses
 * conditional updates, so it refuses to overwrite a record that changed after
 * the preflight read.
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { INVALID_ACTIVE_ATTACK_DATE_FILTER, parseIncidentDate } from "../src/lib/attack-data-integrity";

dotenv.config({ path: ".env.local", quiet: true });

const apply = process.argv.includes("--apply");

type InvalidAttack = {
  _id: mongoose.Types.ObjectId;
  date: unknown;
  title?: string;
};

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required in .env.local; no database work was performed.");

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15_000, socketTimeoutMS: 45_000 });
  const attacks = mongoose.connection.collection<InvalidAttack>("attacks");
  const invalid = await attacks
    .find(INVALID_ACTIVE_ATTACK_DATE_FILTER)
    .project<InvalidAttack>({ _id: 1, date: 1, title: 1 })
    .toArray();

  const targets = invalid.map((attack) => ({
    _id: attack._id,
    originalDate: attack.date,
    normalizedDate: parseIncidentDate(attack.date, `Attack ${attack._id}`).toISOString(),
  }));

  console.log(JSON.stringify({
    mode: apply ? "apply" : "dry-run",
    invalidDateCountBefore: targets.length,
    targets: targets.map(({ _id, normalizedDate }) => ({ _id: String(_id), normalizedDate })),
  }, null, 2));

  if (!apply || targets.length === 0) return;

  const updatedAt = new Date();
  for (const target of targets) {
    const result = await attacks.updateOne(
      { _id: target._id, date: target.originalDate, _deleted: { $ne: true } },
      { $set: { date: new Date(target.normalizedDate), updatedAt } },
    );
    if (result.modifiedCount !== 1) {
      throw new Error(`Attack ${target._id} changed after preflight; no further updates were attempted.`);
    }
  }

  const invalidDateCountAfter = await attacks.countDocuments(INVALID_ACTIVE_ATTACK_DATE_FILTER);
  if (invalidDateCountAfter !== 0) {
    throw new Error(`${invalidDateCountAfter} active incident record(s) still do not have BSON dates after repair.`);
  }

  console.log(JSON.stringify({ applied: targets.length, invalidDateCountAfter }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => undefined);
  });
