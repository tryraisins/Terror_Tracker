/**
 * recent-scan.ts
 *
 * Manual trigger of the standard ingestion pipeline for the past 5 days.
 * Uses the same fetchRecentAttacks + fetchAttacksForStates functions as the
 * live cron, including all fixes (military search terms, civilianCasualties).
 *
 * Run:
 *   npx tsx scripts/recent-scan.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import mongoose from "mongoose";
import { fetchRecentAttacks, fetchAttacksForStates } from "../src/lib/gemini";
import { ingestAttacks } from "../src/lib/ingest-attacks";

async function connectDB() {
  if (mongoose.connections[0].readyState) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(uri);
}

const STATE_GROUPS: Record<string, string[]> = {
  Northeast:    ["Borno", "Yobe", "Adamawa", "Gombe", "Bauchi", "Taraba"],
  Northwest:    ["Kaduna", "Kano", "Katsina", "Zamfara", "Sokoto", "Kebbi", "Jigawa"],
  NorthCentral: ["Plateau", "Benue", "Niger", "Kwara", "FCT", "Kogi", "Nasarawa"],
  Southwest:    ["Lagos", "Ogun", "Ondo", "Ekiti", "Osun", "Oyo"],
  SouthSouth:   ["Rivers", "Delta", "Edo", "Bayelsa", "Akwa Ibom", "Cross River"],
  Southeast:    ["Anambra", "Imo", "Abia", "Enugu", "Ebonyi"],
};

const LOOKBACK_DAYS = 5;

async function run() {
  await connectDB();
  console.log("✓ Connected to MongoDB\n");

  let grand = { saved: 0, merged: 0, errors: 0 };

  // ── 1. General scan (fetchRecentAttacks covers ~4 days) ──────────────────
  console.log("═".repeat(60));
  console.log("PASS 1: General scan (fetchRecentAttacks)");
  console.log("═".repeat(60));
  try {
    const raw = await fetchRecentAttacks();
    console.log(`Gemini returned ${raw.length} candidate(s)`);
    if (raw.length > 0) {
      const r = await ingestAttacks(raw, "RecentScan/General");
      grand.saved  += r.saved;
      grand.merged += r.merged;
      grand.errors += r.errors;
      console.log(`→ saved: ${r.saved}, merged: ${r.merged}, errors: ${r.errors}`);
    }
  } catch (err: any) {
    console.error("General scan failed:", err?.message || err);
    grand.errors++;
  }

  // ── 2. Per-state scan with 5-day lookback ────────────────────────────────
  console.log(`\n${"═".repeat(60)}`);
  console.log(`PASS 2: Per-state scan (${LOOKBACK_DAYS}-day lookback, all 6 groups in parallel)`);
  console.log("═".repeat(60));

  const groupResults = await Promise.allSettled(
    Object.entries(STATE_GROUPS).map(async ([region, states]) => {
      try {
        const raw = await fetchAttacksForStates(states, LOOKBACK_DAYS);
        console.log(`[${region}] Gemini returned ${raw.length} candidate(s)`);
        if (raw.length === 0) return { region, saved: 0, merged: 0, errors: 0 };
        const r = await ingestAttacks(raw, `RecentScan/${region}`);
        return { region, ...r };
      } catch (err: any) {
        console.error(`[${region}] Failed:`, err?.message || err);
        return { region, saved: 0, merged: 0, errors: 1 };
      }
    }),
  );

  for (const r of groupResults) {
    if (r.status === "fulfilled") {
      const { region, saved, merged, errors } = r.value;
      grand.saved  += saved;
      grand.merged += merged;
      grand.errors += errors;
      if (saved > 0 || merged > 0) {
        console.log(`[${region}] saved: ${saved}, merged: ${merged}, errors: ${errors}`);
      }
    } else {
      grand.errors++;
      console.error("Group rejected:", r.reason);
    }
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log("RECENT SCAN COMPLETE");
  console.log(`Total saved : ${grand.saved}`);
  console.log(`Total merged: ${grand.merged}`);
  console.log(`Total errors: ${grand.errors}`);
  console.log("═".repeat(60));

  process.exit(0);
}

run().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
