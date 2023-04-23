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

router.get("/profile", pageAuth, (req, res, next) => {
  // if (!req.session.user) {
  //   const err = new Error("Unauthorized: Access is denied due to invalid credentials.");
  //     err.status = 401;
  //     return next(err);
  // }

  return res.render("main/profile", { data: req.session.user });
});

export { router as page };
