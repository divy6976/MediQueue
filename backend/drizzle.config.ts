import dotenv from "dotenv";
dotenv.config();

declare const process: {
  env: Record<string, string | undefined>;
};

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
    url: process.env.DATABASE_URL!,
  },
} satisfies DrizzleConfig;