import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import patientRoutes from "./routes/patient.routes";
import tokenRoutes from "./routes/token.routes";
import queueRoutes from "./routes/queue.routes";
import userRoutes from "./routes/user.routes";
import adminRoutes from "./routes/admin.routes";
import { bootstrapDb, checkDbHealth } from "./bootstrapDb";
import { formatError, getDatabaseUrlHint } from "./utils/formatError";
import "./events/queueSubscriber";

if (!process.stdin.isTTY) {
  process.stdin.resume();
}

const app = express();

app.use(cors());
app.use(express.json());
const port = process.env.PORT || 3001;

app.get("/", (_req, res) => {
  res.send("MediQueue server is running");
});

app.get("/health/db", async (_req, res) => {
  const health = await checkDbHealth();
  res.status(health.ok ? 200 : 503).json(health);
});

/** One-time setup — open in browser if tables missing (Render free tier has no Shell). */
app.get("/setup-db", async (_req, res) => {
  try {
    const result = await bootstrapDb();
    res.json({ message: "Database ready", ...result });
  } catch (err) {
    const hint = getDatabaseUrlHint();
    const message = formatError(err);
    console.error("[setup-db]", err);
    res.status(500).json({
      message: "Database setup failed",
      error: message,
      databaseUrlConfigured: hint.configured,
      databaseHost: hint.host,
      hint: hint.configured
        ? "Check Render Logs. Postgres may be unreachable or seed failed."
        : "Add DATABASE_URL in Render → MediQueue Web Service → Environment (Postgres Internal URL).",
    });
  }
});

app.use("/patient", patientRoutes);
app.use("/token", tokenRoutes);
app.use("/queue", queueRoutes);
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);

async function start() {
  try {
    const result = await bootstrapDb();
    console.log(`[db] startup bootstrap OK (${result.doctors} doctors)`);
  } catch (err) {
    console.error("[db] startup bootstrap FAILED:", err);
    console.error(
      "[db] Fix: set DATABASE_URL on Render (Postgres Internal URL), then open GET /setup-db"
    );
  }

  app.listen(port, () => {
    console.log(`MediQueue server is running on port ${port}`);
  });
}

void start();
