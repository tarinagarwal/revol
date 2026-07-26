import mongoose from "mongoose";
import { env, isProd } from "../config/env.js";

/**
 * MongoDB connection. Required in production; in development the server
 * boots without it (with a loud warning) so non-DB work isn't blocked.
 */
export async function connectDb(): Promise<boolean> {
  if (!env.MONGODB_URI) {
    if (isProd) {
      throw new Error("MONGODB_URI is required in production");
    }
    console.warn("[db] MONGODB_URI not set — booting without MongoDB (dev only)");
    return false;
  }

  await mongoose.connect(env.MONGODB_URI, { dbName: "revol" });
  console.log("[db] MongoDB connected");
  return true;
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
