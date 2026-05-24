import { Pool } from "pg";
import { getDatabaseUrl, usePgSsl } from "./config/databaseUrl";
import { runSeed } from "./seed";

const SETUP_SQL = `
CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(255) NOT NULL,
  "role" varchar(255) NOT NULL,
  "department" varchar(255)
);

CREATE TABLE IF NOT EXISTS "patients" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(255) NOT NULL,
  "age" integer NOT NULL,
  "phone" varchar(20) NOT NULL DEFAULT '',
  "chief_complaint" varchar(500)
);

CREATE TABLE IF NOT EXISTS "tokens" (
  "id" serial PRIMARY KEY NOT NULL,
  "token_number" varchar(255) NOT NULL,
  "patient_id" integer,
  "department" varchar(255) NOT NULL DEFAULT 'GEN',
  "status" varchar(255) NOT NULL,
  "priority" varchar(255) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "logs" (
  "id" serial PRIMARY KEY NOT NULL,
  "token_id" integer,
  "issue_time" timestamp NOT NULL,
  "call_time" timestamp NOT NULL,
  "end_time" timestamp NOT NULL
);

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "department" varchar(255);
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "phone" varchar(20) NOT NULL DEFAULT '';
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "chief_complaint" varchar(500);
ALTER TABLE "tokens" ADD COLUMN IF NOT EXISTS "department" varchar(255);
ALTER TABLE "tokens" DROP CONSTRAINT IF EXISTS "tokens_doctor_id_users_id_fk";
ALTER TABLE "tokens" DROP COLUMN IF EXISTS "doctor_id";

DO $$ BEGIN
  ALTER TABLE "logs" ADD CONSTRAINT "logs_token_id_tokens_id_fk"
    FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id")
    ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "tokens" ADD CONSTRAINT "tokens_patient_id_patients_id_fk"
    FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id")
    ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
`;

export async function bootstrapDb(): Promise<void> {
  const connectionString = getDatabaseUrl();
  const pool = new Pool({
    connectionString,
    ssl: usePgSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
  });

  try {
    console.log("[db] applying schema...");
    await pool.query(SETUP_SQL);
    console.log("[db] schema OK, seeding...");
    await runSeed();
    console.log("[db] bootstrap complete");
  } finally {
    await pool.end();
  }
}
