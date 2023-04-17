import dotenv from "dotenv";
dotenv.config();

import { getTargetByLink, getAccessList } from "../../model/db_share.js";
import {
	getFileDetail,
	getOneLevelChildByParentId,
} from "../../model/db_ff_r.js";

// import path from "path";
// import { fileURLToPath } from "url";
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
import { findParentPathByFFId, findFileIdByPath } from "../../service/path/iter.js";
import { getAllChildren } from "../../service/path/recur.js";
import { getCurrentVersionByFileId } from "../../model/db_ff_r.js";

const { S3_MAIN_BUCKET_NAME } = process.env;

import {
	s3clientGeneral
} from "../../service/s3/s3_client.js"; 

import { copyS3Obj } from "../../service/s3/s3_copy.js";
import { getDownloadUrl } from "../../service/s3/s3_download.js";
import { callLambdaZip } from "../../service/lambda/lambda_invoke.js";
// ===========================================================================
const shareTokenValid = async (req, res, next) => {
	console.log(req.path);
	console.log(req.params);
	const shareToken = req.params.shareToken;

	// if length not correct
	if (shareToken.length !== parseInt(process.env.SHARE_TOKEN_LENGTH)) {
		console.log("shareToken: ", shareToken);
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
	console.log("basePath: ", basePath);
	if (
		(target.type === "file" && basePath !== "/view/fi/") ||
		(target.type === "folder" && basePath !== "/view/fo/")
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
	console.log("detail: ", detail);
	const { name, size, updated_at, owner } = detail;
	return res.render("view_file", {
		name,
		size,
		updated_at,
		owner,
	});
};

const returnFolderInfo = async (req, res) => {
	const shareToken = req.params.shareToken;
	const target = req.target;
	console.log("target: ", target);
	// // TODO:
	// const children = await getOneLevelChildByParentId(target.user_id, target.id, 0);
	// console.log("children: ", children);
	const { id, name } = req.target;
	return res.render("view_folder", { id, name, shareToken });
};

// *************************************************************************************
// download

const viewDLvalidation = async (req, res, next) => {
	console.log("viewDLvalidation: ", req.body);
	const { shareToken, desired } = req.body;
	const target = await getTargetByLink(shareToken);
	if (!target) {
		return res.status(400).send("error");
	}

	// const firstSlashIndex = desired.indexOf("/");
	// const checkTarget = (firstSlashIndex !== -1 && desired.substring(0, firstSlashIndex) === target.name);

	if (target.name !== desired.split("/")[0]) {
		return res.status(400).send("error");
	}
	req.body.target = target;
  req.target = target;
	next();
};

const viewDLsingleFile = async (req, res, next) => {
  console.log("viewDLsingleFile: ", req.body);
	const { desired, target } = req.body;

	if (desired.endsWith("/")) {
		return next();
	}

	const parentParentPath = await findParentPathByFFId(target.id);
	
  // single file download
  const userId = target.user_id;
	const key = (parentParentPath + desired).replace(/^Home\//, "");
  console.log("viewDL single - key: ", key);
  // 1. get current version -> giving path to obtain file id
  const fileId = await findFileIdByPath(userId, key);
  const version = await getCurrentVersionByFileId(fileId);
  console.log("version: ", version);
  // 2. copy ${key}.v<version> to ${key}
  const copyS3ObjRes = await copyS3Obj(
    s3clientGeneral,
    S3_MAIN_BUCKET_NAME,
    `user_${userId}/${key}.v${version}`,
    `user_${userId}/${key}`
  );
  // 3. get presigned URL for that file
  const downloadUrl = await getDownloadUrl(
    s3clientGeneral,
    S3_MAIN_BUCKET_NAME,
    `user_${userId}/${key}`
  );

  return res.json({ downloadUrl });
};

const viewDLfolder = async (req, res, next) => {
	const { desired, target } = req.body;

	const parentParentPath = await findParentPathByFFId(target.id);
	const modifiedPath = 
    `${parentParentPath}${desired.replace(/\/$/, "")}`.replace(/^Home\//, "");
	console.log("modifiedPath: ", modifiedPath);
	const children = await getAllChildren(target.user_id, modifiedPath);

  req.body.finalListNoVer = children.childsNoVer;
	req.body.finalListWithVer = children.childsWithVer;
	req.body.parentName = desired.replace(/\/$/, "").split("/").pop();
  req.body.parentPath = modifiedPath; 
  next();
};

const viewDLcallLambda = async (req, res, next) => {
  // console.log("viewDLcallLambda: ", req.body);
  const { target, finalListNoVer, finalListWithVer, parentName, parentPath } = req.body;
  const userId = target.user_id;

  const toLambda = await callLambdaZip(
		userId,
		finalListNoVer,
		finalListWithVer,
		parentPath,
		parentName
	);
	console.log("toLambda: ", toLambda);
	if (!toLambda.downloadUrl) {
		return res.status(500).json({ err: "something wrong" });
	}
	return res.json({ downloadUrl: toLambda.downloadUrl });
};

export {
	shareTokenValid,
	checkShareTarget,
	checkSharePermission,
	returnFileInfo,
	returnFolderInfo,
	viewDLvalidation,
	viewDLsingleFile,
	viewDLfolder,
	viewDLcallLambda,
};
