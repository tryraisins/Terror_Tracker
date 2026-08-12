import { config } from "dotenv";
config({ path: ".env.local" });
import mongoose from "mongoose";
import Attack from "../src/lib/models/Attack";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const since = new Date(Date.now() - 48 * 3600 * 1000);
  const docs = await Attack.find({ date: { $gte: since }, _deleted: { $ne: true } })
    .sort({ date: -1 }).lean();
  if (docs.length === 0) {
    console.log("No incidents found in the last 48 hours.");
  } else {
    docs.forEach((d: any) => {
      console.log("---");
      console.log("Title    :", d.title);
      console.log("Date     :", new Date(d.date).toISOString().split("T")[0]);
      console.log("State    :", d.location?.state, "|", d.location?.lga);
      console.log("Group    :", d.group);
      console.log("Casualties:", JSON.stringify(d.casualties));
      console.log("Tags     :", d.tags?.join(", "));
    });
  }
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
