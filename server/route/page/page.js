import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =========================================================
router.get("/", (req, res) => {
  return res.sendFile(path.join(__dirname, "../../../views", "index.html"));
});

router.get("/login", (req, res) => {
  return res.sendFile(path.join(__dirname, "../../../views", "login.html"));
});

router.get("/register", (req, res) => {
  return res.sendFile(path.join(__dirname, "../../../views", "register.html"));
});

router.get(/^\/home(\/.*)?$/, (req, res) => {
  return res.sendFile(path.join(__dirname, "../../../views", "home.html"));
});

router.get("/history/*", (req, res) => {
  return res.sendFile(path.join(__dirname, "../../../views", "history.html"));
});

router.get("/trash", (req, res) => {
  return res.sendFile(path.join(__dirname, "../../../views", "trash.html"));
});

router.get("/shared", (req, res) => {
  return res.sendFile(path.join(__dirname, "../../../views", "shared.html"));
});

router.get("/links", (req, res) => {
  return res.sendFile(path.join(__dirname, "../../../views", "links.html"));
});

export { router as page };
