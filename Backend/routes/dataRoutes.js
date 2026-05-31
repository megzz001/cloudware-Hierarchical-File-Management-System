import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { readDb, updateDb } from "../db.js";
import { verifyJWT } from "../middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

const router = Router();
router.use(verifyJWT);

function fileContentUrl(req, fileId) {
  const token = req.headers.authorization?.replace("Bearer ", "") || "";
  const base = `${req.protocol}://${req.get("host")}`;
  return `${base}/api/files/${fileId}/content?token=${encodeURIComponent(token)}`;
}

function toClientFile(req, record) {
  return {
    id: record.id,
    name: record.name,
    size: record.size,
    type: record.type,
    folderId: record.folderId,
    createdAt: record.createdAt,
    dataUrl: fileContentUrl(req, record.id),
  };
}

const storage = multer.diskStorage({
  destination(req, _file, cb) {
    const dir = path.join(UPLOADS_DIR, req.userId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.get("/data", (req, res) => {
  const db = readDb();
  const folders = db.folders
    .filter((f) => f.userId === req.userId)
    .map(({ id, name, createdAt }) => ({ id, name, createdAt }));
  const files = db.files
    .filter((f) => f.userId === req.userId)
    .map((f) => toClientFile(req, f));
  res.json({ folders, files });
});

router.post("/folders", (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) {
    return res.status(400).json({ message: "Folder name is required" });
  }

  const folder = {
    id: uuidv4(),
    userId: req.userId,
    name,
    createdAt: Date.now(),
  };

  updateDb((d) => {
    d.folders.push(folder);
  });

  res.status(201).json({ id: folder.id, name: folder.name, createdAt: folder.createdAt });
});

router.delete("/folders/:id", (req, res) => {
  const folderId = req.params.id;
  updateDb((d) => {
    d.folders = d.folders.filter(
      (f) => !(f.id === folderId && f.userId === req.userId)
    );
    d.files = d.files.map((file) =>
      file.userId === req.userId && file.folderId === folderId
        ? { ...file, folderId: null }
        : file
    );
  });
  res.json({ ok: true });
});

router.post("/files/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const folderId = req.body.folderId || null;
  const record = {
    id: uuidv4(),
    userId: req.userId,
    name: req.file.originalname,
    size: req.file.size,
    type: req.file.mimetype,
    folderId: folderId && folderId !== "null" ? folderId : null,
    storagePath: path.relative(path.join(__dirname, ".."), req.file.path),
    createdAt: Date.now(),
  };

  updateDb((d) => {
    d.files.push(record);
  });

  res.status(201).json(toClientFile(req, record));
});

router.patch("/files/:id", (req, res) => {
  const { folderId } = req.body;
  const db = readDb();
  const file = db.files.find(
    (f) => f.id === req.params.id && f.userId === req.userId
  );
  if (!file) {
    return res.status(404).json({ message: "File not found" });
  }

  updateDb((d) => {
    const target = d.files.find(
      (f) => f.id === req.params.id && f.userId === req.userId
    );
    if (target) {
      target.folderId = folderId ?? null;
    }
  });

  const updated = readDb().files.find((f) => f.id === req.params.id);
  res.json(toClientFile(req, updated));
});

router.delete("/files/:id", (req, res) => {
  const db = readDb();
  const file = db.files.find(
    (f) => f.id === req.params.id && f.userId === req.userId
  );
  if (!file) {
    return res.status(404).json({ message: "File not found" });
  }

  const fullPath = path.join(__dirname, "..", file.storagePath);
  try {
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch {
    /* ignore disk cleanup errors */
  }

  updateDb((d) => {
    d.files = d.files.filter(
      (f) => !(f.id === req.params.id && f.userId === req.userId)
    );
  });

  res.json({ ok: true });
});

export function fileContentHandler(req, res) {
  const db = readDb();
  const file = db.files.find((f) => f.id === req.params.id);
  if (!file || file.userId !== req.userId) {
    return res.status(404).json({ message: "File not found" });
  }

  const fullPath = path.join(__dirname, "..", file.storagePath);
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ message: "File missing on disk" });
  }

  res.setHeader("Content-Type", file.type || "application/octet-stream");
  res.setHeader("Content-Disposition", `inline; filename="${file.name}"`);
  fs.createReadStream(fullPath).pipe(res);
}

export default router;
