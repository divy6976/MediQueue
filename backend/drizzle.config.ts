import dotenv from "dotenv";
import { getDatabaseUrl } from "./src/config/databaseUrl";

dotenv.config();

type DrizzleConfig = {
  schema: string;
  out: string;
  dialect: "postgresql";
  dbCredentials: { url: string };
};

export default {
  schema: "./src/config/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: getDatabaseUrl(),
  },
} satisfies DrizzleConfig;