import { Pool } from "pg";
import { getDatabaseUrl, usePgSsl } from "./config/databaseUrl";
import { runSeed } from "./seed";

const SETUP_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "users" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar(255) NOT NULL,
    "role" varchar(255) NOT NULL,
    "department" varchar(255)
  )`,
  `CREATE TABLE IF NOT EXISTS "patients" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar(255) NOT NULL,
    "age" integer NOT NULL,
    "phone" varchar(20) DEFAULT '',
    "chief_complaint" varchar(500)
  )`,
  `CREATE TABLE IF NOT EXISTS "tokens" (
    "id" serial PRIMARY KEY NOT NULL,
    "token_number" varchar(255) NOT NULL,
    "patient_id" integer,
    "department" varchar(255) DEFAULT 'GEN',
    "status" varchar(255) NOT NULL,
    "priority" varchar(255) NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "logs" (
    "id" serial PRIMARY KEY NOT NULL,
    "token_id" integer,
    "issue_time" timestamp NOT NULL,
    "call_time" timestamp NOT NULL,
    "end_time" timestamp NOT NULL
  )`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "department" varchar(255)`,
  `ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "phone" varchar(20) DEFAULT ''`,
  `ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "chief_complaint" varchar(500)`,
  `ALTER TABLE "tokens" ADD COLUMN IF NOT EXISTS "department" varchar(255) DEFAULT 'GEN'`,
  `ALTER TABLE "tokens" DROP CONSTRAINT IF EXISTS "tokens_doctor_id_users_id_fk"`,
  `ALTER TABLE "tokens" DROP COLUMN IF EXISTS "doctor_id"`,
  `DO $$ BEGIN
    ALTER TABLE "logs" ADD CONSTRAINT "logs_token_id_tokens_id_fk"
      FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id")
      ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "tokens" ADD CONSTRAINT "tokens_patient_id_patients_id_fk"
      FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id")
      ON DELETE no action ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
];

function logDbTarget(connectionString: string) {
  try {
    const url = new URL(connectionString.replace(/^postgresql:\/\//, "http://"));
    console.log(`[db] target host=${url.hostname} db=${url.pathname.slice(1)}`);
  } catch {
    console.log("[db] target configured (could not parse URL for log)");
  }
}

export async function bootstrapDb(): Promise<{ ok: true; doctors: number }> {
  const connectionString = getDatabaseUrl();
  logDbTarget(connectionString);

  const pool = new Pool({
    connectionString,
    ssl: usePgSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await pool.query("SELECT 1");
    console.log("[db] connected");

    for (let i = 0; i < SETUP_STATEMENTS.length; i++) {
      try {
        await pool.query(SETUP_STATEMENTS[i]);
      } catch (err) {
        console.error(`[db] statement ${i + 1} failed:`, err);
        throw err;
      }
    }
    console.log("[db] schema OK");

    await runSeed();
    console.log("[db] seed OK");

    const doctors = await pool.query(
      `SELECT count(*)::int AS n FROM "users" WHERE "role" = 'doctor'`
    );
    const count = doctors.rows[0]?.n ?? 0;
    console.log(`[db] doctors in DB: ${count}`);
    return { ok: true, doctors: count };
  } finally {
    await pool.end();
  }
}

export async function checkDbHealth(): Promise<{
  ok: boolean;
  doctors?: number;
  error?: string;
}> {
  try {
    const connectionString = getDatabaseUrl();
    const pool = new Pool({
      connectionString,
      ssl: usePgSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
    });
    try {
      await pool.query("SELECT 1");
      const result = await pool.query(
        `SELECT count(*)::int AS n FROM "users" WHERE "role" = 'doctor'`
      );
      return { ok: true, doctors: result.rows[0]?.n ?? 0 };
    } finally {
      await pool.end();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
