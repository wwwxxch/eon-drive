import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
	loginRedirect,
	pageAuth,
} from "../../controller/user/user_auth_controller.js";

import { findFileIdByPath } from "../../service/path/iter.js";
import { getProfile } from "../../model/db_user.js";
// =====================================================================================
router.get("/", loginRedirect, (req, res) => {
  return res.render("view/index");
});

router.get("/login", loginRedirect, (req, res) => {
  return res.render("view/login");
});

router.get("/register", loginRedirect, (req, res) => {
	return res.render("view/register");
});

router.get("/info", (req, res) => {
  return res.render("view/information");
});

// =====================================================================================
router.get(/^\/home(\/.*)?$/, pageAuth, (req, res) => {
  return res.render("main/home");
});

router.get("/history/*", pageAuth, async (req, res) => {
	console.log(req.path);
	const fileWholePath = req.path.replace(/^\/history\//, "");
  console.log("/history", fileWholePath);

  const decodeFileWholePath = decodeURI(fileWholePath);
  console.log(decodeFileWholePath);

	const fileName = decodeFileWholePath.split("/").pop();
	const userId = req.session.user.id;

	const fileId = await findFileIdByPath(userId, decodeFileWholePath);
	console.log("fileId: ", fileId);
	if (!fileId) {
		return res.status(404).send("404");
	}
	return res.render("main/history", { fileName, fileId });
});

router.get("/trash", pageAuth, (req, res) => {
  return res.render("main/trash");
});

router.get("/shared", pageAuth, (req, res) => {
  return res.render("main/shared");
});

router.get("/links", pageAuth, (req, res) => {
  return res.render("main/links");
});

router.get("/profile", pageAuth, async (req, res) => {
  const userId = req.session.user.id;
  const profile = await getProfile(userId);
  const { email, name, plan, allocated, used, created_at } = profile;
  console.log(created_at);
  const usedNum = parseInt(used);
  const allocatedNum = parseInt(allocated);
  const percent = (usedNum / allocatedNum) * 100;
  const currentUse = `
    ${(usedNum / (1024 * 1024)).toFixed(2)} MB / 
    ${allocatedNum / (1024 * 1024)} MB (${percent.toFixed(2)}%)`;

  return res.render("main/profile", { 
    email, name, plan, currentUse, created_at
  });
});

export { router as page };
