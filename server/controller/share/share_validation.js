import dotenv from "dotenv";
dotenv.config();

import { getTargetByLink, getAccessList } from "../../model/db_share.js";
import { getFileDetail, getOneLevelChildByParentId } from "../../model/db_ff_r.js";

import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ===========================================================================
const shareTokenValid = async (req, res, next) => {
	console.log(req.path);
	console.log(req.params);
	const shareToken = req.params.shareToken;

	// if length not correct
	if (shareToken.length !== parseInt(process.env.SHARE_TOKEN_LENGTH)) {
		console.log("ERROR req.path: ", req.path);
		const err = new Error("=====Page not found=====");
		err.status = 404;
		return next(err);
	}

	next();
};

const checkShareTarget = async (req, res, next) => {
	const shareToken = req.params.shareToken;

	const target = await getTargetByLink(shareToken);
	// console.log("target: ", target);
  // target: id, name, is_public, user_id, type
  if (target.length === 0) {
		console.log("ERROR req.path: ", req.path);
		const err = new Error("=====Page not found=====");
		err.status = 404;
		return next(err);
	}

	const basePath = req.path.split(shareToken)[0];
	if (
		(target.type === "file" && basePath !== "/s/") ||
		(target.type === "folder" && basePath !== "/sdir/")
	) {
		console.log("ERROR req.path: ", req.path);
		const err = new Error("=====Page not found=====");
		err.status = 404;
		return next(err);
	}

	req.target = target;
	next();
};

const checkSharePermission = async (req, res, next) => {
	const target = req.target;
	// check permission
	if (target.is_public === 0) {
    if (!req.session.user) {
      return res.status(403).json({ msg: "No access" });
    }

    const userList = await getAccessList(target.id);
		const userId = req.session.user.id;
		if (!userList.includes(userId) && userId !== target.user_id) {
			return res.status(403).json({ msg: "No access" });
		}
	}
	next();
};

const returnFileInfo = async (req, res) => {
	const target = req.target;

	const detail = await getFileDetail(target.id);
	// console.log("detail: ", detail);
  const { name, size, updated_at, owner } = detail;
	// return res.json({ data: detail });
  return res.render("view_file", {
    name, size, updated_at, owner
  });
};

const returnFolderInfo = async (req, res) => {
  const target = req.target;

  const children = await getOneLevelChildByParentId(target.user_id, target.id, 0);
  // console.log("children: ", children);

  // return res.json({ data: children });
  return res.render("view_folder");
};

export {
	shareTokenValid,
	checkShareTarget,
	checkSharePermission,
	returnFileInfo,
	returnFolderInfo,
};
