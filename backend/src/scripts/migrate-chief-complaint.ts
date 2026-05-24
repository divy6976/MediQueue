import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

async function main() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query(
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS chief_complaint varchar(500)`
  );
  console.log("chief_complaint column ready");
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
