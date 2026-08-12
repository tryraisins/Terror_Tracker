import { config } from "dotenv";
config({ path: ".env.local" });
import mongoose from "mongoose";
import Attack from "../src/lib/models/Attack";

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const count = await Attack.countDocuments({ date: { $lt: new Date("2026-02-08T00:00:00Z") } });
  console.log(`Incidents before 2026-02-08: ${count}`);
  const sample = await Attack.find({ date: { $lt: new Date("2026-02-08T00:00:00Z") } }).limit(2).sort({date:1});
  console.log("Earliest samples:");
  sample.forEach(s => {
      console.log(`- ${s.date.toISOString().split("T")[0]}: ${s.title}`);
  });
  
  const total = await Attack.countDocuments();
  console.log(`Total incidents in database: ${total}`);
  process.exit(0);
}
verify();
