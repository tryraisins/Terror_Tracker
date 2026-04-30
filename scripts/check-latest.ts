import fs from "fs";
import os from "os";
import path from "path";
import { readFileSync } from "fs";

const envPath = path.join(__dirname, "../.env.local");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const eqIdx = line.indexOf("=");
  if (eqIdx === -1) continue;
  const key = line.slice(0, eqIdx).trim();
  let val = line.slice(eqIdx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
  if (!process.env[key]) process.env[key] = val;
}

async function main() {
  const { default: connectDB } = await import("../src/lib/db.ts");
  const { default: Attack } = await import("../src/lib/models/Attack.ts");

  await connectDB();

  const total = await Attack.countDocuments({ _deleted: { $ne: true } });
  const latest = await Attack.find({ _deleted: { $ne: true } })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  console.log(`Total incidents in DB: ${total}\n`);
  console.log("Most recently CREATED (added to DB):");
  for (const a of latest) {
    const created = new Date((a as any).createdAt).toISOString();
    const incident = new Date((a as any).date).toISOString().slice(0, 10);
    console.log(`  [created ${created}] [incident ${incident}] ${(a as any).title} — ${(a as any).location?.state}`);
  }

  const latestByDate = await Attack.find({ _deleted: { $ne: true } })
    .sort({ date: -1 })
    .limit(5)
    .lean();

  console.log("\nMost recent by INCIDENT DATE:");
  for (const a of latestByDate) {
    const incident = new Date((a as any).date).toISOString().slice(0, 10);
    const created = new Date((a as any).createdAt).toISOString().slice(0, 16);
    console.log(`  [${incident}] ${(a as any).title} — ${(a as any).location?.state} (added ${created})`);
  }

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
