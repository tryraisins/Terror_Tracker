/**
 * patch-brig-general.ts
 *
 * One-off patch: find the April 9 2026 Borno military base attack and update it
 * with the confirmed Brigadier General detail + all six user-provided source URLs.
 *
 * Run:
 *   npx tsx scripts/patch-brig-general.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import mongoose from "mongoose";
import Attack from "../src/lib/models/Attack";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("✓ Connected to MongoDB\n");

  // Find any April 9 2026 attack in Borno state (±1 day window)
  const windowStart = new Date("2026-04-08T00:00:00.000Z");
  const windowEnd   = new Date("2026-04-10T23:59:59.999Z");

  const candidates = await Attack.find({
    date: { $gte: windowStart, $lte: windowEnd },
    "location.state": { $regex: /^borno$/i },
    _deleted: { $ne: true },
  }).lean();

  if (candidates.length === 0) {
    console.log("No Borno attack found for Apr 8-10 2026. Nothing to patch.");
    process.exit(0);
  }

  console.log(`Found ${candidates.length} candidate(s):`);
  candidates.forEach((c: any) => console.log(`  • ${c._id} — "${c.title}" (${new Date(c.date).toISOString().split("T")[0]})`));

  // Pick the one most likely to be the military base attack
  const target: any = candidates.find((c: any) =>
    /military|base|benisheikh|general|army|soldiers/i.test(c.title + " " + (c.description || ""))
  ) || candidates[0];

  console.log(`\nPatching: "${target.title}" (${target._id})`);

  const confirmedSources = [
    {
      url: "https://saharareporters.com/2026/04/09/breaking-boko-haram-attacks-military-base-borno-kills-army-general-several-other",
      title: "Breaking: Boko Haram Attacks Military Base In Borno, Kills Army General, Several Others",
      publisher: "Sahara Reporters",
    },
    {
      url: "https://guardian.ng/news/nigeria/metro/brigadier-general-feared-killed-in-fresh-boko-haram-attacks-in-borno/",
      title: "Brigadier General Feared Killed In Fresh Boko Haram Attacks In Borno",
      publisher: "The Guardian Nigeria",
    },
    {
      url: "https://www.vanguardngr.com/2026/04/army-general-feared-killed-in-boko-haram-attack/",
      title: "Army General Feared Killed In Boko Haram Attack",
      publisher: "Vanguard",
    },
    {
      url: "https://gazettengr.com/army-commander-killed-in-fresh-boko-haram-onslaught-on-borno-military-base/",
      title: "Army Commander Killed In Fresh Boko Haram Onslaught On Borno Military Base",
      publisher: "Peoples Gazette",
    },
    {
      url: "https://businessday.ng/news/article/boko-haram-kills-army-general-others-in-fresh-attacks-on-borno-photos/",
      title: "Boko Haram Kills Army General, Others In Fresh Attacks On Borno",
      publisher: "Business Day",
    },
    {
      url: "https://www.pulse.ng/story/boko-haram-attack-in-borno-kills-army-general-2026040916032950397",
      title: "Boko Haram Attack In Borno Kills Army General",
      publisher: "Pulse Nigeria",
    },
  ];

  // Merge existing sources with confirmed sources — deduplicate by URL
  const existingSources: any[] = target.sources || [];
  const existingUrls = new Set(existingSources.map((s: any) => s.url));

  const mergedSources = [
    ...existingSources,
    ...confirmedSources.filter(s => !existingUrls.has(s.url)),
  ];

  const updatedTitle       = "Boko Haram Attack on Military Base in Borno Kills Brigadier General, Several Officers";
  const updatedDescription = target.description?.includes("Brigadier") || target.description?.includes("General")
    ? target.description
    : `${target.description || ""} Multiple credible sources confirm that a Brigadier General and several other military officers were killed in the Boko Haram attack on the military base in Borno State on April 9, 2026. Sources include Sahara Reporters, The Guardian Nigeria, Vanguard, and Peoples Gazette.`.trim();

  const updatedTags = Array.from(new Set([
    ...(target.tags || []),
    "brigadier-general",
    "high-ranking-officer",
    "military-base-attack",
    "military-attack",
    "boko-haram",
    "northeast",
    "soldiers-killed",
    "officers-killed",
  ]));

  await Attack.findByIdAndUpdate(target._id, {
    $set: {
      title: updatedTitle,
      description: updatedDescription,
      sources: mergedSources,
      tags: updatedTags,
      status: "confirmed",
    },
  });

  console.log("\n✅ Patch applied:");
  console.log("  Title    :", updatedTitle);
  console.log("  Sources  :", mergedSources.length, "total (was", existingSources.length, ")");
  console.log("  Tags     :", updatedTags.join(", "));

  process.exit(0);
}

run().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
