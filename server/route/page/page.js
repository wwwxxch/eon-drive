import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { findFileIdByPath } from "../../service/path/iter.js";
import { getVersionsByFileId } from "../../model/db_ff_r.js";
import { getDeleteRecordsByFileId } from "../../model/db_ff_r.js";
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

router.get("/history/*", async (req, res) => {
  console.log(req.path);
  const fileWholePath = req.path.replace(/^\/history\//,"");
  const fileName = fileWholePath.split("/").pop();
  const userId = req.session.user.id;
  
  const fileId = await findFileIdByPath(userId, fileWholePath);
  console.log("fileId: ", fileId);
  if (!fileId) {
    return res.staatus(404).send("404");
  }
  
  // const versions = await getVersionsByFileId(fileId);
  // console.log("versions", versions);

  // const deleteRecords = await getDeleteRecordsByFileId(fileId);
  // console.log("deleteRecords: ", deleteRecords); 
  
  // return res.json({ versions, deleteRecords });
  // return res.sendFile(path.join(__dirname, "../../../views", "history.html"));
  return res.render("history", { fileName });
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
