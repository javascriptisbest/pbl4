/**
 * Script to remove self-friendships (where requester === recipient)
 * Run: node src/scripts/removeSelfFriendships.js
 */

import { connectDB } from "../lib/db.js";
import Friend from "../models/friend.model.js";
import { config } from "dotenv";

config();

async function removeSelfFriendships() {
  try {
    console.log("🔍 Connecting to database...");
    await connectDB();

    console.log("🔍 Looking for self-friendships...");
    
    // Find friendships where requester === recipient
    const selfFriendships = await Friend.aggregate([
      {
        $match: {
          $expr: { $eq: ["$requester", "$recipient"] }
        }
      }
    ]);

    if (selfFriendships.length === 0) {
      console.log("✅ No self-friendships found. Database is clean!");
      process.exit(0);
    }

    console.log(`⚠️ Found ${selfFriendships.length} self-friendships:`);
    selfFriendships.forEach(f => {
      console.log(`  - ID: ${f._id}, User: ${f.requester}, Status: ${f.status}`);
    });

    console.log("\n🗑️ Removing self-friendships...");
    
    const result = await Friend.deleteMany({
      $expr: { $eq: ["$requester", "$recipient"] }
    });

    console.log(`✅ Removed ${result.deletedCount} self-friendships!`);
    console.log("✨ Database cleaned successfully!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

removeSelfFriendships();
