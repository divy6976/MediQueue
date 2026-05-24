import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import patientRoutes from "./routes/patient.routes";
import tokenRoutes from "./routes/token.routes";
import queueRoutes from "./routes/queue.routes";
import userRoutes from "./routes/user.routes";
import adminRoutes from "./routes/admin.routes";
import "./events/queueSubscriber";
dotenv.config();

if (!process.stdin.isTTY) {
  process.stdin.resume();
}

const app = express();

app.use(cors());
app.use(express.json());
const port = process.env.PORT || 3001;

app.get("/", (req, res) => {
  res.send("MediQueue server is running");
});

app.use("/patient", patientRoutes);
app.use("/token", tokenRoutes);
app.use("/queue", queueRoutes);
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);
app.listen(port, () => {
  console.log(`MediQueue server is running on port ${port}`);
});
