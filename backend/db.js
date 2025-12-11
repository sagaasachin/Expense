import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

// Load from .env
const uri = process.env.MONGO_URI;
const dbName = process.env.DATABASE_NAME;

const client = new MongoClient(uri, {
  tls: true,
  serverSelectionTimeoutMS: 10000,
});

let transactionsCollection;

// EXPORT #1: connectDB
export async function connectDB() {
  try {
    await client.connect();
    const db = client.db(dbName);
    transactionsCollection = db.collection("transactions");
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
  }
}

// EXPORT #2: get collection when needed
export function getTransactionsCollection() {
  return transactionsCollection;
}
