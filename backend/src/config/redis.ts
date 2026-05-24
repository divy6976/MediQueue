import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";

/** Single connection for pub (queue notifications). */
export const publisher = new Redis(url, {
  maxRetriesPerRequest: null,
});

publisher.on("error", (err: Error) => {
  console.error("[redis publisher]", err.message);
});
