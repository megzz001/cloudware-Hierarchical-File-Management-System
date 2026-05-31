import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "cloudware-dev-secret-change-in-production";

export function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyJWT(req, res, next) {
  const header = req.headers.authorization;
  const queryToken = req.query.token;
  const token =
    (header && header.startsWith("Bearer ") ? header.slice(7) : null) ||
    queryToken;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
