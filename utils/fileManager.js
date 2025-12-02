import fs from "fs";
import path from "path";

export function listFiles(fullPath, folder) {
  return fs.readdirSync(fullPath).map((item) => {
    const full = path.join(fullPath, item);
    return {
      name: item,
      isFolder: fs.statSync(full).isDirectory(),
      path: path.join(folder, item).replace(/\\/g, "/")
    };
  });
}

export function createFolder(user, folder) {
  const dir = path.join("storage", user, folder);
  fs.mkdirSync(dir, { recursive: true });
}

export function deleteItem(user, itemPath) {
  const target = path.join("storage", user, itemPath);
  fs.rmSync(target, { recursive: true, force: true });
}
