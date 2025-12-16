import mongoose from "mongoose";
import { getEnv } from "../services/utils/get-env";

async function dropUsernameIndex() {
  try {
    const mongoUri = getEnv("MONGO_URI");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not established");
    }
    const collection = db.collection("users");

    // List all indexes
    const indexes = await collection.indexes();
    console.log("Current indexes:", JSON.stringify(indexes, null, 2));

    // Check if username_1 index exists
    const hasUsernameIndex = indexes.some(
      (idx: any) => idx.name === "username_1"
    );

    if (hasUsernameIndex) {
      // Drop the username_1 index
      await collection.dropIndex("username_1");
      console.log("✅ Successfully dropped username_1 index");
    } else {
      console.log("ℹ️  username_1 index does not exist");
    }

    // Verify indexes after drop
    const indexesAfter = await collection.indexes();
    console.log(
      "Indexes after operation:",
      JSON.stringify(indexesAfter, null, 2)
    );
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("Connection closed");
    process.exit(0);
  }
}

dropUsernameIndex();
