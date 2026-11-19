import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import questionRoutes from "./routes/questions.js";

const { PORT = 3000, MONGODB_URI, CORS_ORIGIN = "*" } = process.env;

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI. Copy .env.example to .env and set it.");
  process.exit(1);
}

const app = express();
app.use(cors({ origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN.split(",").map((s) => s.trim()) }));
app.use(express.json());

app.get("/api/health", (_req, res) =>
  res.json({ ok: true, db: mongoose.connection.readyState === 1 ? "connected" : "disconnected" })
);
app.use("/api", questionRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

try {
  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected");
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
} catch (err) {
  console.error("MongoDB connection failed:", err.message);
  process.exit(1);
}
