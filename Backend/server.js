import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import dataRoutes, { fileContentHandler } from "./routes/dataRoutes.js";
import { verifyJWT } from "./middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "https://cloudware-hierarchical-file-management-d0xj.onrender.com"],
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.get("/api/files/:id/content", verifyJWT, fileContentHandler);
app.use("/api", dataRoutes);

app.listen(PORT, () => {
  console.log(`Cloudware API running at http://localhost:${PORT}`);
  console.log(`Database file: ${path.join(__dirname, "data", "database.json")}`);
});
