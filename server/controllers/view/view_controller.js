import * as geoip from "geoip-lite";
import { DateTime } from "luxon";
import { CustomError } from "../../utils/custom_error.js";

import { getTargetByLink, getAccessList } from "../../models/db_share.js";
import {
	getFileDetail,
	getOneLevelChildByParentId,
	getCurrentVersionByFileId,
} from "../../models/db_files_read.js";

import {
	getFileListByPath,
	findParentPathByFilesId,
	findFileIdByPath,
} from "../../services/path/iter.js";
import { getAllChildren } from "../../services/path/recur.js";

import dotenv from "dotenv";
dotenv.config();
const { S3_MAIN_BUCKET_NAME } = process.env;

import { s3clientGeneral } from "../../services/s3/s3_client.js";

import { copyS3Obj } from "../../services/s3/s3_copy.js";
import { getDownloadUrl } from "../../services/s3/s3_download.js";
import { callLambdaZip } from "../../services/lambda/lambda_invoke.js";

// ===========================================================================
const checkShareTarget = async (req, res, next) => {
	const shareToken = req.params.shareToken;

	const target = await getTargetByLink(shareToken);
	console.log("target: ", target);
	// target: id, name, is_public, user_id, type
	if (!target) {
		return res.status(404).render("error/error", {
			status: 404,
			message: "The pages you requested is not existed.",
		});
	}

	const basePath = req.path.split(shareToken)[0];
	console.log("basePath: ", basePath);
	if (
		(target.type === "file" && basePath !== "/view/fi/") ||
		(target.type === "folder" && basePath !== "/view/fo/")
	) {
		return res.status(404).render("error/error", {
			status: 404,
			message: "The pages you requested is not existed.",
		});
	}

	req.target = target;
	next();
};

const checkSharePermission = async (req, res, next) => {
	const target = req.target;

	// check permission
	if (target.is_public === 1) {
		return next();
	}

	if (!req.session.user) {
		return res.status(403).render("error/error", {
			status: 403,
			message: "You don't have the access.",
		});
	}

	const userList = await getAccessList(target.id);
	const userId = req.session.user.id;
	// console.log("userList: ", userList);
	// console.log("userId: ", userId);
	if (!userList.includes(userId) && userId !== target.user_id) {
		return res.status(403).render("error/error", {
			status: 403,
			message: "You don't have the access.",
		});
	}

	next();
};

const returnFileInfo = async (req, res) => {
	const target = req.target;

	const detail = await getFileDetail(target.id);
	// console.log("detail: ", detail);

	const { name, size, updated_at, owner } = detail;

	console.log(`req.headers["x-forwarded-for"]: `, req.headers["x-forwarded-for"]);
	// console.log("req.ip: ", req.ip);

	const ip = req.headers["x-forwarded-for"];
	const geo = geoip.default.lookup(ip);
	let clientTimeZone;
	if (!geo) {
		clientTimeZone = "Asia/Taipei";
	} else {
		clientTimeZone = geo.timezone;
	}

	if (!req.session.user) {
		return res.render("visitor/view_file", {
			name,
			size,
			updated_at,
			owner,
			DateTime,
			clientTimeZone,
		});
	}
	return res.render("member/view_file", {
		name,
		size,
		updated_at,
		owner,
		DateTime,
		clientTimeZone,
	});
};

const returnFolderInfo = async (req, res) => {
	const shareToken = req.params.shareToken;
	// console.log("req.target: ", req.target);
	const { id, name } = req.target;

	if (!req.session.user) {
		return res.render("visitor/view_folder", { id, name, shareToken });
	}
	return res.render("member/view_folder", { id, name, shareToken });
};

const viewFolderList = async (req, res, next) => {
	console.log("viewFolderList: req.query: ", req.query);

	// const { shareToken, subFolder } = req.body;
	const { shareToken, subFolder } = req.query;

	// find the list by token
	const target = await getTargetByLink(shareToken);
	if (!target) {
		return next(CustomError.notFound("The pages you requested is not existed."));
	}
	let list;
	if (!subFolder) {
		list = await getOneLevelChildByParentId(target.user_id, target.id, 0);
	} else {
		const parentParentPath = await findParentPathByFilesId(target.id);
		console.log(parentParentPath);
		if (!parentParentPath) {
			return next(CustomError.internalServerError("(fn) findParentPathByFilesId Error"));
		}
		const subWholePath = parentParentPath + target.name + "/" + subFolder;
		console.log(subWholePath);
		const subPathList = await getFileListByPath(
			target.user_id,
			subWholePath.replace(/^Home\//, "")
		);

		list = subPathList.data;
	}

	return res.json({ data: list });
};

// download
const viewDLcheckTarget = async (req, res, next) => {
	console.log("viewDLcheckTarget: ", req.body);
	const { shareToken } = req.body;
	const target = await getTargetByLink(shareToken);
	if (!target) {
		return next(CustomError.badRequest("This file/folder may not exist."));
	}

	if (req.path === "/view-fo-dl") {
		const { desired } = req.body;
		if (target.name !== desired.split("/")[0]) {
			return next(CustomError.badRequest("This file/folder may not exist."));
		}
	}

	req.target = target;
	next();
};

const viewDLcheckPermission = async (req, res, next) => {
	const { target } = req;
	if (target.is_public === 1) {
		return next();
	}

	if (!req.session.user) {
		return next(CustomError.forbidden());
	}
	const userList = await getAccessList(target.id);
	const userId = req.session.user.id;
	if (!userList.includes(userId) && userId !== target.user_id) {
		return next(CustomError.forbidden());
	}

	next();
};

const viewDLfile = async (req, res, next) => {
	console.log("viewDLFile: ", req.body);
	const { target } = req;
	const parentParentPath = await findParentPathByFilesId(target.id);
	if (!parentParentPath) {
		return next(CustomError.internalServerError("(fn) findParentPathByFilesId Error"));
	}
	let key;
	if (req.path === "/view-fi-dl") {
		key = (parentParentPath + target.name).replace(/^Home\//, "");
	} else {
		const { desired } = req.body;
		if (desired.endsWith("/")) {
			return next();
		}
		key = (parentParentPath + desired).replace(/^Home\//, "");
	}

	console.log("viewDLfile - key: ", key);
	const userId = target.user_id;

	// 1. get current version -> find file id by given path
	const fileId = await findFileIdByPath(userId, key);
	// const fileId = -1;
	console.log("fileId: ", fileId);
	if (fileId === -1) {
		return next(CustomError.badRequest("This file/folder may not exist."));
	}
	const version = await getCurrentVersionByFileId(fileId);
	console.log("version: ", version);
	if (version === -1) {
		return next(CustomError.internalServerError("(fn) getCurrentVersionByFileId Error"));
	}
	// 2. copy ${key}.v<version> to ${key}
	const copyS3ObjRes = await copyS3Obj(
		s3clientGeneral,
		S3_MAIN_BUCKET_NAME,
		`user_${userId}/${encodeURIComponent(key)}.v${version}`,
		`user_${userId}/${key}`
	);
	if (!copyS3ObjRes) {
		return next(CustomError.internalServerError("(fn) copyS3Obj Error"));
	}
	// 3. get presigned URL for that file
	const downloadUrl = await getDownloadUrl(
		s3clientGeneral,
		S3_MAIN_BUCKET_NAME,
		`user_${userId}/${key}`
	);
	if (!downloadUrl) {
		return next(CustomError.internalServerError("(fn) getDownloadUrl Error"));
	}

	return res.json({ downloadUrl });
};

const viewDLfolder = async (req, res, next) => {
	const { desired } = req.body;
	const { target } = req;

	const parentParentPath = await findParentPathByFilesId(target.id);
	// const parentParentPath = null;
	if (!parentParentPath) {
		return next(CustomError.internalServerError());
	}

	const modifiedPath = `${parentParentPath}${desired.replace(/\/$/, "")}`.replace(
		/^Home\//,
		""
	);
	console.log("modifiedPath: ", modifiedPath);
	const children = await getAllChildren(target.user_id, modifiedPath);
	if (children.childsNoVer.length === 0 || children.childsWithVer.length === 0) {
		return next(CustomError.badRequest("This file/folder may not exist."));
	}

	req.finalListNoVer = children.childsNoVer;
	req.finalListWithVer = children.childsWithVer;
	req.parentName = desired.replace(/\/$/, "").split("/").pop();
	req.parentPath = modifiedPath;
	next();
};

const viewDLcallLambda = async (req, res, next) => {
	// console.log("viewDLcallLambda: ", req.body);
	const { target, finalListNoVer, finalListWithVer, parentName, parentPath } = req;
	const userId = target.user_id;

	const toLambda = await callLambdaZip(
		userId,
		finalListNoVer,
		finalListWithVer,
		parentPath,
		parentName
	);
	if (!toLambda) {
		return next(CustomError.internalServerError("(fn) callLambdaZip Error"));
	} else if (toLambda.status === 500 && toLambda.error === "file size exceeds 4 GB") {
		return next(CustomError.badRequest("file size exceeds 4 GB"));
	} else if (toLambda.status === 500) {
		return next(CustomError.internalServerError("callLambdaZip returns 500 status"));
	} else if (toLambda.downloadUrl) {
		console.log("toLambda: downloadUrl is not blank");
	} else if (!toLambda.downloadUrl) {
		console.log("toLambda: downloadUrl is null");
	}

	return res.json({ downloadUrl: toLambda.downloadUrl });
};

export {
	checkShareTarget,
	checkSharePermission,
	returnFileInfo,
	returnFolderInfo,
	viewFolderList,
	viewDLcheckTarget,
	viewDLcheckPermission,
	viewDLfile,
	viewDLfolder,
	viewDLcallLambda,
};
