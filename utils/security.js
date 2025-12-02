import fs from "fs";
import path from "path";

const ROOT = "./storage";

export function ensureUserStorage(email) {
  const dir = path.join(ROOT, email);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function safePath(user, subPath) {
  const clean = path.normalize(subPath).replace(/^(\.\.[\/\\])+/, "");
  return path.join(ROOT, user, clean);
}
