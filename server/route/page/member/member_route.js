import express from "express";

const router = express.Router();

import { pageAuth } from "../../../../server/controller/user/user_auth_controller.js";

import { findFileIdByPath } from "../../../../server/service/path/iter.js";
// =====================================================================================
router.get(/^\/home(\/.*)?$/, pageAuth, (req, res) => {
  return res.render("member/home");
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

// TODO: use client side to render page?
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
	return res.render("member/history", { fileName, fileId });
});

export { router as page_member };
