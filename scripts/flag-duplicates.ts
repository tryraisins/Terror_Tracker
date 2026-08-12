/**
 * One-time script to flag duplicate incidents and normalize state names in MongoDB.
 *
 * Usage:
 *   node scripts/flag-duplicates.js            # Dry run (preview changes)
 *   node scripts/flag-duplicates.js --execute   # Apply changes to DB
 */

const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

const mongoose = require("mongoose");

// ── State normalization (mirrors src/lib/normalize-state.ts) ──

const CANONICAL_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const STATE_LOOKUP = new Map(CANONICAL_STATES.map((s) => [s.toLowerCase(), s]));

const ALIASES: Record<string, string> = {
  "federal capital territory": "FCT",
  "abuja": "FCT",
  "fct": "FCT",
  "akwa-ibom": "Akwa Ibom",
  "cross-river": "Cross River",
  "nassarawa": "Nasarawa",
};

function normalizeStateName(raw: string) {
  if (!raw) return "Unknown";
  let s = raw.trim();

  // Split multi-state entries and take the first (primary) state
  if (/[\/;]/.test(s) || /\band\b/i.test(s)) {
    const parts = s.split(/[\/;]|\s+and\s+/i).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) s = parts[0];
  }

  // Strip trailing " State"
  s = s.replace(/\s+state$/i, "").trim();

  const aliasMatch = ALIASES[s.toLowerCase()];
  if (aliasMatch) return aliasMatch;

  const canonical = STATE_LOOKUP.get(s.toLowerCase());
  if (canonical) return canonical;

  const cleaned = s.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  const cleanedMatch = STATE_LOOKUP.get(cleaned.toLowerCase());
  if (cleanedMatch) return cleanedMatch;

  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Confirmed duplicate groups (from analysis) ──

const DUPLICATE_GROUPS = [
  {
    name: "Borno abduction Feb 12",
    primaryId: "69902b9b94f094d88f68b4db",
    secondaryIds: ["699209d057708fc8d93ebedc"],
  },
  {
    name: "Kebbi police killed Mar 4-5",
    primaryId: "69ac055ab223a20962c66cb1",
    secondaryIds: ["69aab3e849725aacbec8efb4"],
  },
  {
    name: "ISWAP coordinated attacks Mar 8-9",
    primaryId: "69b2ce14bab84295248d4aab",
    secondaryIds: ["69b198b63fbb13f16143b05f", "69b3308cf2303bcbf77c0d35"],
  },
  {
    // Both reports cover the same midnight bandit attack across Sabon Birni LGA on Apr 9 2026.
    // Secondary had Unknown LGA/Town; primary has LGA=Sabon Birni and 9 merged sources.
    name: "Sokoto Sabon Birni bandit attack Apr 9 2026",
    primaryId: "69d84d18c94c5844bb675e74",
    secondaryIds: ["69d83e9c5328e58b4d23d73e"],
  },
  {
    // Same Igbesa motorcyclist stabbing (Apr 8 2026). Secondary stored Igbesa (a town) as the LGA.
    // Primary has correct LGA=Ado-Odo/Ota, Town=Igbesa, and merged sources.
    name: "Ogun Igbesa motorcyclist stabbing Apr 8 2026",
    primaryId: "69d8009aef6f39593bfb1b41",
    secondaryIds: ["69d839999e19cdfd23c350ea"],
  },
  {
    name: "Niger village attacks Feb 14-17",
    primaryId: "699217cf4048faea94b8672d",
    secondaryIds: ["6997b2422c9f37dc506662c6"],
  },
  {
    name: "ISWAP Borno military base Feb 28-Mar 1",
    primaryId: "69a56dcfc3d80d72cdc57a97",
    secondaryIds: ["69a5de5a96f6e1bee58759c9"],
  },
];

// ── Main ──

async function main() {
  const isExecute = process.argv.includes("--execute");
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("ERROR: MONGODB_URI not found in .env.local");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri, { family: 4, serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;
  const collection = db.collection("attacks");

  const total = await collection.countDocuments();
  console.log(`Total attacks in DB: ${total}`);
  console.log(`Mode: ${isExecute ? "EXECUTE" : "DRY RUN"}\n`);

  // ── Phase 1: Flag duplicates and merge ──

  console.log("═══════════════════════════════════════");
  console.log("  PHASE 1: Flag Duplicates & Merge");
  console.log("═══════════════════════════════════════\n");

  for (const group of DUPLICATE_GROUPS) {
    const primary = await collection.findOne({
      _id: new mongoose.Types.ObjectId(group.primaryId),
    });
    if (!primary) {
      console.log(`SKIP: Primary ${group.primaryId} not found for "${group.name}"`);
      continue;
    }

    const secondaries = [];
    for (const secId of group.secondaryIds) {
      const sec = await collection.findOne({
        _id: new mongoose.Types.ObjectId(secId),
      });
      if (sec) secondaries.push(sec);
      else console.log(`  SKIP: Secondary ${secId} not found`);
    }

    if (secondaries.length === 0) {
      console.log(`SKIP: No secondaries found for "${group.name}"`);
      continue;
    }

    // Merge sources (unique by normalized URL)
    const sourceMap = new Map();
    for (const s of primary.sources || []) {
      const key = (s.url || "").trim().replace(/\/$/, "").toLowerCase();
      if (key) sourceMap.set(key, s);
    }
    for (const sec of secondaries) {
      for (const s of sec.sources || []) {
        const key = (s.url || "").trim().replace(/\/$/, "").toLowerCase();
        if (key && !sourceMap.has(key)) sourceMap.set(key, s);
      }
    }
    const mergedSources = Array.from(sourceMap.values());

    // Merge casualties (take max)
    let maxKilled = primary.casualties?.killed ?? 0;
    let maxInjured = primary.casualties?.injured ?? 0;
    let maxKidnapped = primary.casualties?.kidnapped ?? 0;
    let maxDisplaced = primary.casualties?.displaced ?? 0;
    for (const sec of secondaries) {
      maxKilled = Math.max(maxKilled, sec.casualties?.killed ?? 0);
      maxInjured = Math.max(maxInjured, sec.casualties?.injured ?? 0);
      maxKidnapped = Math.max(maxKidnapped, sec.casualties?.kidnapped ?? 0);
      maxDisplaced = Math.max(maxDisplaced, sec.casualties?.displaced ?? 0);
    }

    console.log(`GROUP: "${group.name}"`);
    console.log(`  PRIMARY: [${primary._id}] "${primary.title}"`);
    console.log(`    Sources: ${(primary.sources || []).length} → ${mergedSources.length}`);
    console.log(`    Casualties: killed ${primary.casualties?.killed ?? "?"} → ${maxKilled || "?"}`);
    for (const sec of secondaries) {
      console.log(`  FLAG: [${sec._id}] "${sec.title}" (state: "${sec.location?.state}")`);
    }

    if (isExecute) {
      // Update primary with merged data
      await collection.updateOne(
        { _id: primary._id },
        {
          $set: {
            sources: mergedSources,
            "casualties.killed": maxKilled || null,
            "casualties.injured": maxInjured || null,
            "casualties.kidnapped": maxKidnapped || null,
            "casualties.displaced": maxDisplaced || null,
          },
        }
      );

      // Flag secondaries
      for (const sec of secondaries) {
        await collection.updateOne(
          { _id: sec._id },
          {
            $set: {
              _deleted: true,
              _deletedReason: `Duplicate of ${primary._id}`,
            },
          }
        );
      }
      console.log(`  ✓ Applied: merged ${secondaries.length} secondary record(s) into primary\n`);
    } else {
      console.log(`  [DRY RUN] Would merge ${secondaries.length} secondary record(s)\n`);
    }
  }

  // ── Phase 2: Normalize all state names ──

  console.log("═══════════════════════════════════════");
  console.log("  PHASE 2: Normalize State Names");
  console.log("═══════════════════════════════════════\n");

  const allAttacks = await collection.find({}).project({ _id: 1, "location.state": 1 }).toArray();
  let stateChanges = 0;

  for (const attack of allAttacks) {
    const rawState = attack.location?.state;
    if (!rawState) continue;

    const normalized = normalizeStateName(rawState);
    if (normalized !== rawState) {
      console.log(`  "${rawState}" → "${normalized}" (ID: ${attack._id})`);
      stateChanges++;

      if (isExecute) {
        await collection.updateOne(
          { _id: attack._id },
          { $set: { "location.state": normalized } }
        );
      }
    }
  }

  if (stateChanges === 0) {
    console.log("  No state names need normalization.\n");
  } else {
    console.log(`\n  Total state changes: ${stateChanges}`);
    if (isExecute) {
      console.log("  ✓ All state names normalized.\n");
    } else {
      console.log("  [DRY RUN] Would normalize these state names.\n");
    }
  }

  // ── Summary ──

  const totalFlagged = DUPLICATE_GROUPS.reduce((sum, g) => sum + g.secondaryIds.length, 0);
  console.log("═══════════════════════════════════════");
  console.log("  SUMMARY");
  console.log("═══════════════════════════════════════");
  console.log(`  Duplicate groups: ${DUPLICATE_GROUPS.length}`);
  console.log(`  Records to flag: ${totalFlagged}`);
  console.log(`  State names to normalize: ${stateChanges}`);
  if (!isExecute) {
    console.log("\n  Run with --execute to apply changes.");
  }

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
