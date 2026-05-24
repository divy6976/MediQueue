import Redis from "ioredis";
import dotenv from "dotenv";
import { broadcast } from "../utils/sseStore";

dotenv.config();

const QUEUE_UPDATED = "QUEUE_UPDATED";
const url = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";

/** Separate subscriber connection (required for Redis pub/sub). */
const subscriber = new Redis(url, {
  maxRetriesPerRequest: null,
});

subscriber.on("error", (err: Error) => {
  console.error("[redis subscriber]", err.message);
});

void subscriber.subscribe(QUEUE_UPDATED, (err) => {
  if (err) {
    console.error("[queueSubscriber] subscribe failed:", err.message);
  }
});

subscriber.on("message", (channel, message) => {
  if (channel !== QUEUE_UPDATED) return;
  try {
    const data = JSON.parse(message) as { department?: string };
    const dept = data.department;
    if (typeof dept === "string" && dept.length > 0) {
      broadcast(dept, data);
    }
  } catch (e) {
    console.error("[queueSubscriber] message parse error:", e);
  }
});
