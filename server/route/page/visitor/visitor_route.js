import express from "express";
const router = express.Router();

import { loginRedirect } from "../../../middleware/auth_check.js";

import dotenv from "dotenv";
dotenv.config();
const SHARE_TOKEN_LENGTH = process.env.SHARE_TOKEN_LENGTH;

import {
	checkShareTarget,
	checkSharePermission,
	returnFileInfo,
	returnFolderInfo,
} from "../../../controller/view/view_controller.js";
// =====================================================================================
router.get("/", loginRedirect, (req, res) => {
	return res.render("visitor/index");
});

router.get("/login", loginRedirect, (req, res) => {
	return res.render("visitor/login");
});

router.get("/register", loginRedirect, (req, res) => {
	return res.render("visitor/register");
});

router.get("/about", (req, res) => {
	if (!req.session.user) {
		return res.render("visitor/about");
	}
	return res.render("member/about");
});

router.get("/terms", (req, res) => {
	if (!req.session.user) {
		return res.render("visitor/terms");
	}
	return res.render("member/terms");
});

router.get("/privacy", (req, res) => {
	if (!req.session.user) {
		return res.render("visitor/privacy");
	}
	return res.render("member/privacy");
});

router.get("/contact", (req, res) => {
	if (!req.session.user) {
		return res.render("visitor/contact");
	}
	return res.render("member/contact");
});

router.get(
	`/view/fi/:shareToken([0-9a-zA-Z]{${SHARE_TOKEN_LENGTH}})`,
	checkShareTarget,
	checkSharePermission,
	returnFileInfo
);

router.get(
	`/view/fo/:shareToken([0-9a-zA-Z]{${SHARE_TOKEN_LENGTH}})*`,
	checkShareTarget,
	checkSharePermission,
	returnFolderInfo
);

export { router as page_visitor };
