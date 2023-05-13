import express from "express";
const router = express.Router();

import { uuidv4Regex } from "../../../constant/constant.js";

import { loginRedirect } from "../../../middleware/auth_check.js";

import dotenv from "dotenv";
dotenv.config();
const { SHARE_TOKEN_LENGTH } = process.env;

import {
	checkRegisterConfirmTokenRender,
	proceedRegistration,
} from "../../../controller/user/user_auth_controller.js";

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

// two steps registration
router.get("/register", loginRedirect, (req, res) => {
	return res.render("visitor/register");
});

router.get("/register/verify-mail-sent", (req, res) => {
	return res.render("visitor/verify_mail_sent");
});

router.get(
	`/verify-mail/:confirmToken(${uuidv4Regex})`,
	checkRegisterConfirmTokenRender,
	proceedRegistration
);

// about, terms, privacy, contact
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

// visit share link
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
