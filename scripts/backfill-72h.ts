import fs from "fs";
import os from "os";
import path from "path";
import { readFileSync } from "fs";

// Load .env.local FIRST — before any app module imports
const envPath = path.join(__dirname, "../.env.local");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const eqIdx = line.indexOf("=");
  if (eqIdx === -1) continue;
  const key = line.slice(0, eqIdx).trim();
  let val = line.slice(eqIdx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
  if (!process.env[key]) process.env[key] = val;
}

const tmpPath = path.join(os.tmpdir(), "gcp-backfill-creds.json");
fs.writeFileSync(tmpPath, process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON!, { mode: 0o600 });
process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;

const STATE_GROUPS: Record<string, string[]> = {
  Northeast:    ["Borno", "Yobe", "Adamawa", "Gombe", "Bauchi", "Taraba"],
  Northwest:    ["Kaduna", "Kano", "Katsina", "Zamfara", "Sokoto", "Kebbi", "Jigawa"],
  NorthCentral: ["Plateau", "Benue", "Niger", "Kwara", "FCT", "Kogi", "Nasarawa"],
  Southwest:    ["Lagos", "Ogun", "Ondo", "Ekiti", "Osun", "Oyo"],
  SouthSouth:   ["Rivers", "Delta", "Edo", "Bayelsa", "Akwa Ibom", "Cross River"],
  Southeast:    ["Anambra", "Imo", "Abia", "Enugu", "Ebonyi"],
};

const LOOKBACK_DAYS = 3;

async function main() {
  const { default: connectDB } = await import("../src/lib/db.ts");
  const { fetchRecentAttacks, fetchAttacksForStates } = await import("../src/lib/gemini.ts");
  const { ingestAttacks } = await import("../src/lib/ingest-attacks.ts");

  let totalSaved = 0, totalMerged = 0, totalErrors = 0;

  async function runBatch(label: string, fetchFn: () => Promise<any>) {
    const t0 = Date.now();
    process.stdout.write(`\n[${label}] Fetching...`);
    try {
      const attacks = await fetchFn();
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      process.stdout.write(` ${attacks.length} incident(s) in ${elapsed}s\n`);

      if (attacks.length === 0) {
        console.log(`[${label}] Nothing to ingest`);
        return;
      }

      const { saved, merged, errors } = await ingestAttacks(attacks, label);
      console.log(`[${label}] saved=${saved}  merged=${merged}  errors=${errors}`);
      for (const a of attacks) {
        console.log(`  • [${String(a.date).slice(0, 10)}] ${a.title} (${a.location?.state})`);
      }
      totalSaved += saved;
      totalMerged += merged;
      totalErrors += errors;
    } catch (err: any) {
      console.error(`[${label}] ERROR: ${err?.message || err}`);
      totalErrors++;
    }
  }

  await connectDB();
  console.log("Connected to MongoDB");
  console.log(`Running 72h backfill — general scan + 6 state group batches\n${"─".repeat(60)}`);

  await runBatch("General", () => fetchRecentAttacks());

  for (const [region, states] of Object.entries(STATE_GROUPS)) {
    await runBatch(`States/${region}`, () => fetchAttacksForStates(states, LOOKBACK_DAYS));
  }

  console.log(`\n${"─".repeat(60)}`);
  console.log(`TOTAL — saved: ${totalSaved}  merged: ${totalMerged}  errors: ${totalErrors}`);

  fs.unlinkSync(tmpPath);
  process.exit(0);
}

main().catch(err => {
  console.error("Fatal:", err);
  if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  process.exit(1);
});
