import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "data", "database.json");

const defaultDb = () => ({ users: [], folders: [], files: [] });

export function readDb() {
  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const data = JSON.parse(raw);
    return {
      users: data.users ?? [],
      folders: data.folders ?? [],
      files: data.files ?? [],
    };
  } catch {
    return defaultDb();
  }
}

export function writeDb(data) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

export function updateDb(mutator) {
  const db = readDb();
  mutator(db);
  writeDb(db);
  return db;
}
