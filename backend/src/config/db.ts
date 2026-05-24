import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import dotenv from "dotenv";
import { getDatabaseUrl, usePgSsl } from "./databaseUrl";

dotenv.config();

const connectionString = getDatabaseUrl();
const pool = new Pool({
  connectionString,
  ssl: usePgSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
});

const db = drizzle(pool);

export { db, pool };