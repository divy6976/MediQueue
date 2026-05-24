ALTER TABLE "tokens" DROP CONSTRAINT IF EXISTS "tokens_doctor_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "tokens" DROP COLUMN IF EXISTS "doctor_id";