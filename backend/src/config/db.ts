import dotenv from "dotenv";

dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getDatabaseUrl, usePgSsl } from "./databaseUrl";

function createPool() {
  const connectionString = getDatabaseUrl();
  return new Pool({
    connectionString,
    ssl: usePgSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
  });
}

const pool = createPool();
const db = drizzle(pool);

export { db, pool };
