// =========================================================
// NK CLOUD v2.3 — BACKEND COMPLETO
// Multiusuário • Login • Storage isolado • Hospedagem de sites
// Totalmente compatível com Render
// =========================================================

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import multer from "multer";

import { auth, initDB } from "./utils/auth.js";
import { ensureUserStorage, safePath } from "./utils/security.js";
import {
  listFiles,
  deleteItem,
  createFolder
} from "./utils/fileManager.js";

const app = express();
app.use(express.json());
app.use(cors());

const STORAGE_ROOT = "./storage";
if (!fs.existsSync(STORAGE_ROOT)) fs.mkdirSync(STORAGE_ROOT);

initDB();

// =========================================================
// LOGIN / REGISTER
// =========================================================
app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  const result = await global.DB.register(email, password);

  if (!result.success) return res.json(result);

  ensureUserStorage(email);

  res.json(result);
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const result = await global.DB.login(email, password);
  res.json(result);
});

// =========================================================
// MULTER UPLOAD
// =========================================================
const storageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    const userFolder = path.join(STORAGE_ROOT, req.user.email);
    const reqFolder = req.body.folder || "";
    const finalPath = path.join(userFolder, reqFolder);

    fs.mkdirSync(finalPath, { recursive: true });
    cb(null, finalPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage: storageEngine });

// =========================================================
// UPLOAD
// =========================================================
app.post("/upload", auth, upload.single("file"), (req, res) => {
  res.json({
    success: true,
    file: req.file
  });
});

// =========================================================
// LISTAR ARQUIVOS
// =========================================================
app.post("/list", auth, (req, res) => {
  const folder = req.body.folder || "";
  const fullPath = safePath(req.user.email, folder);

  if (!fs.existsSync(fullPath))
    return res.json({ success: false, msg: "Folder not found" });

  const items = listFiles(fullPath, folder);
  res.json({ success: true, items });
});

// =========================================================
// CRIAR PASTA
// =========================================================
app.post("/mkdir", auth, (req, res) => {
  const { folder } = req.body;

  if (!folder)
    return res.json({ success: false, msg: "Invalid folder name" });

  createFolder(req.user.email, folder);

  res.json({ success: true });
});

// =========================================================
// DELETAR ARQUIVO/PASTA
// =========================================================
app.post("/delete", auth, (req, res) => {
  const { path: itemPath } = req.body;

  if (!itemPath)
    return res.json({ success: false });

  deleteItem(req.user.email, itemPath);

  res.json({ success: true });
});

// =========================================================
// SERVIR ARQUIVOS (download / preview)
// =========================================================
app.get("/file/*", auth, (req, res) => {
  const fileRequested = req.params[0];
  const filePath = safePath(req.user.email, fileRequested);

  if (!fs.existsSync(filePath))
    return res.status(404).send("File not found");

  res.sendFile(path.resolve(filePath));
});

// =========================================================
// HOSPEDAR SITES
// =========================================================
app.use(
  "/site",
  express.static("storage", {
    extensions: ["html", "htm"]
  })
);

// =========================================================
app.listen(3000, () => {
  console.log("🚀 NK CLOUD v2.3 rodando no Render (porta 3000)");
});
