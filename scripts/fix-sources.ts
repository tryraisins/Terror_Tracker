import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error("Missing MONGODB_URI");
  process.exit(1);
}

const isHomepage = (url: string) => {
  try {
    const parsed = new URL(url);
    if (!parsed.pathname || parsed.pathname === "/" || parsed.pathname.length < 3) {
      return true; // e.g. https://premiumtimesng.com or https://dailypost.ng/
    }
    return false;
  } catch {
    return true; // invalid URL
  }
};

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;
  if (!db) throw new Error("No db");
  const attacksCollection = db.collection("attacks");

  const fourDaysAgo = new Date();
  fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

  const recentAttacks = await attacksCollection.find({
    createdAt: { $gte: fourDaysAgo },
    _deleted: { $ne: true }
  }).toArray();

  console.log(`Found ${recentAttacks.length} recent attacks.`);

  let updatedCount = 0;
  let deletedCount = 0;

  for (const attack of recentAttacks) {
    const originalSources = attack.sources || [];
    const validSources = originalSources.filter((s: any) => !isHomepage(s.url));

    if (validSources.length === 0) {
      // No valid sources left, delete or soft delete
      console.log(`Deleting attack "${attack.title}" because it has no valid sources.`);
      await attacksCollection.updateOne(
        { _id: attack._id },
        { 
          $set: { 
            _deleted: true, 
            _deletedReason: "No valid article link sources (only homepages left)",
            updatedAt: new Date()
          } 
        }
      );
      deletedCount++;
    } else if (validSources.length !== originalSources.length) {
      // Some valid sources remain, update the array
      console.log(`Updating attack "${attack.title}" - removed ${originalSources.length - validSources.length} homepage links.`);
      await attacksCollection.updateOne(
        { _id: attack._id },
        { 
          $set: { 
            sources: validSources,
            updatedAt: new Date()
          } 
        }
      );
      updatedCount++;
    }
    // else it's all good, do nothing.
  }

  console.log(`Summary: Updated ${updatedCount} attacks, Soft-deleted ${deletedCount} attacks.`);
  process.exit(0);
}

run().catch(console.error);
