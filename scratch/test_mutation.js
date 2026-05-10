import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.VITE_CONVEX_URL;
if (!url) {
    console.error("VITE_CONVEX_URL not found");
    process.exit(1);
}

const client = new ConvexHttpClient(url);

async function test() {
  try {
    const result = await client.mutation(api.matches.createManual, {
      token: "invalid-token",
      teamAId: "jd74v1h649w2qmx5e3v0v7rjr51p7v1h", // Example ID format
      teamBId: "jd74v1h649w2qmx5e3v0v7rjr51p7v1h",
      categoryId: "youth",
      categoryLabel: "Youth",
      date: "2024-05-10",
      time: "10:00"
    });
    console.log("Result:", result);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
