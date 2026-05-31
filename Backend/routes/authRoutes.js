import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { readDb, updateDb } from "../db.js";
import { signToken, verifyJWT } from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const db = readDb();
  if (db.users.some((u) => u.email === normalizedEmail)) {
    return res.status(409).json({ message: "An account with this email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(),
    name: String(name || normalizedEmail.split("@")[0]).trim(),
    email: normalizedEmail,
    passwordHash,
    createdAt: Date.now(),
  };

  updateDb((d) => {
    d.users.push(user);
  });

  const token = signToken(user.id);
  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();

  const db = readDb();
  const user = db.users.find((u) => u.email === normalizedEmail);
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = signToken(user.id);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

router.get("/me", verifyJWT, (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json({ user: { id: user.id, name: user.name, email: user.email } });
});

export default router;
