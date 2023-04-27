import express from "express";

const router = express.Router();

import { pageAuth } from "../../../../server/controller/user/user_auth_controller.js";
import { historyFileCheck } from "../../../middleware/page_validator.js";
// =====================================================================================
router.get(/^\/home(\/.*)?$/, pageAuth, (req, res) => {
	return res.render("member/home");
});

router.get("/history/*", pageAuth, historyFileCheck, (req, res) => {
	return res.render("member/history", {
		fileName: req.fileName,
		fileId: req.fileId,
	});
});

router.get("/trash", pageAuth, (req, res) => {
	return res.render("member/trash");
});

router.get("/shared", pageAuth, (req, res) => {
	return res.render("member/shared");
});

router.get("/links", pageAuth, (req, res) => {
	return res.render("member/links");
});

export { router as page_member };
