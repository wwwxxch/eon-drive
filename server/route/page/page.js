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
// =========================================================
router.get("/", loginRedirect, (req, res) => {
	return res.sendFile(path.join(__dirname, "../../../views", "index.html"));
});

router.get("/login", loginRedirect, (req, res) => {
	return res.sendFile(path.join(__dirname, "../../../views", "login.html"));
});

router.get("/register", loginRedirect, (req, res) => {
	return res.sendFile(path.join(__dirname, "../../../views", "register.html"));
});

router.get(/^\/home(\/.*)?$/, pageAuth, (req, res) => {
	return res.sendFile(path.join(__dirname, "../../../views", "home.html"));
});

router.get("/history/*", pageAuth, async (req, res) => {
	console.log(req.path);
	const fileWholePath = req.path.replace(/^\/history\//, "");
	const fileName = fileWholePath.split("/").pop();
	const userId = req.session.user.id;

	const fileId = await findFileIdByPath(userId, fileWholePath);
	console.log("fileId: ", fileId);
	if (!fileId) {
		return res.status(404).send("404");
	}
	return res.render("history", { fileName });
});

router.get("/trash", pageAuth, (req, res) => {
	return res.sendFile(path.join(__dirname, "../../../views", "trash.html"));
});

router.get("/shared", pageAuth, (req, res) => {
	return res.sendFile(path.join(__dirname, "../../../views", "shared.html"));
});

router.get("/links", pageAuth, (req, res) => {
	return res.sendFile(path.join(__dirname, "../../../views", "links.html"));
});

export { router as page };
