import { v4 as uuidv4 } from "uuid";
import { DateTime } from "luxon";

import { generateCurrentTime } from "../../util/util.js";
import { customError } from "../../error/custom_error.js";

import { findFileIdByPath } from "../../service/path/iter.js";
import {
	getCurrentSizeByFileId,
	getFolderId,
	getFileId,
	checkPendingFileStatus,
} from "../../model/db_ff_r.js";

import { createFolder, createFile } from "../../model/db_ff_c.js";
import {
	changeFolderDeleteStatus,
	updateDeletedFile,
	updateExistedFile,
	commitMetadata,
} from "../../model/db_ff_u.js";

import { updateSpaceUsedByUser } from "../../model/db_plan.js";

import dotenv from "dotenv";
dotenv.config();
const { S3_MAIN_BUCKET_NAME } = process.env;

import { s3clientGeneral } from "../../service/s3/s3_client.js";
import { getSingleSignedUrl, getMultiSignedUrl } from "../../service/s3/s3_upload.js";

import { emitNewList, emitUsage } from "../../service/sync/list.js";
import {
	cleanUploadDeletedPending,
	cleanUploadExistedPending,
	cleanUploadNewPending,
} from "../../model/db_ff_d.js";
// ======================================================================
const checkUsed = async (req, res, next) => {
	console.log("checkUsed: ", req.body);

	const { fileWholePath } = req.body;
	const fileSize = Number(req.body.fileSize);
	const userId = req.session.user.id;

	const fileId = await findFileIdByPath(userId, fileWholePath);
	console.log("fileId: ", fileId);

	const allocated = Number(req.session.user.allocated);
	const used = Number(req.session.user.used);

	if (fileId === -1) {
		if (fileSize + used > allocated) {
			return next(customError.badRequest("You don't have enough space."));
		}
		return next();
	}

	const currentSize = await getCurrentSizeByFileId(fileId);
	if (currentSize < 0) {
		return next(customError.internalServerError("(fn) getCurrentSizeByFileId Error"));
	}
	if (used - currentSize + fileSize > allocated) {
		return next(customError.badRequest("You don't have enough space."));
	}

	next();
};

const uploadChangeDB = async (req, res, next) => {
	console.log("uploadChangeDB: req.body: ", req.body);
	const { fileName, fileWholePath, fileSize } = req.body;
	const userId = req.session.user.id;

	const folders = fileWholePath.split("/");
	folders.pop();
	console.log("folders: ", folders);
	const now = DateTime.utc();
	const nowTime = now.toFormat("yyyy-MM-dd HH:mm:ss");

	// get parentId
	let parentId = 0;
	const token = uuidv4();
	if (folders.length > 0) {
		for (let i = 0; i < folders.length; i++) {
			const chkDir = await getFolderId(userId, parentId, folders[i]);
			if (chkDir.length === 0) {
				// if no such dir, create new dir
				const newDir = await createFolder(parentId, folders[i], userId, token, nowTime);
				if (newDir === -1) {
					return next(customError.internalServerError("(fn) createFolder Error"));
				}
				parentId = newDir;
			} else if (chkDir[0].is_delete === 1) {
				// if dir has been deleted, change delete status
				const chgFolderStatus = await changeFolderDeleteStatus(0, chkDir[0].id, token, nowTime);
				if (!chgFolderStatus) {
					return next(customError.internalServerError("(fn) changeFolderDeleteStatus Error"));
				}
				parentId = chkDir[0].id;
			} else {
				parentId = chkDir[0].id;
			}
		}
	}

	const chkFile = await getFileId(userId, parentId, fileName);
	console.log("chkFile: ", chkFile);

	let chgDBres;
	let version;

	if (chkFile.length > 1) {
		// 0. something wrong with getFileId function
		return next(customError.internalServerError("(fn) getFileId Error"));
	} else if (chkFile.length === 0) {
		// 1. create new file record
		chgDBres = await createFile(parentId, fileName, fileSize, userId, token, nowTime);
		console.log("newFile: ", chgDBres);
		if (!chgDBres) {
			return next(customError.internalServerError("(fn) createFile Error"));
		}
	} else if (chkFile[0].is_delete === 1) {
		// 2. if file has been deleted, change delete status & update tables
		chgDBres = await updateDeletedFile(0, token, chkFile[0].id, fileSize, nowTime);
		console.log("updDelFile: ", chgDBres);
		if (!chgDBres) {
			return next(customError.internalServerError("(fn) updateDeletedFile Error"));
		}
	} else {
		// 3. add new version for update
		chgDBres = await updateExistedFile(token, chkFile[0].id, fileSize, nowTime);
		console.log("updExsFile: ", chgDBres);
		if (!chgDBres) {
			return next(customError.internalServerError("(fn) updateExistedFile Error"));
		}
	}

	version = chgDBres.new_ver;

	req.token = token;
	req.version = version;
	next();
};

const getS3Url = async (req, res, next) => {
	const { fileWholePath, fileSplit } = req.body;
	const splitCount = parseInt(fileSplit);
	const userId = req.session.user.id;
	const token = req.token;
	const version = req.version;
	const key = `user_${userId}/${fileWholePath}.v${version}`;

	if (splitCount === 1) {
		const singleUrl = await getSingleSignedUrl(s3clientGeneral, S3_MAIN_BUCKET_NAME, key);

		if (!singleUrl) {
			return next(customError.internalServerError("(fn) getSingleSignedUrl Error"));
		}
		return res.json({ token, singleUrl });
	} else if (splitCount > 1) {
		const multipleUrls = await getMultiSignedUrl(
			s3clientGeneral,
			S3_MAIN_BUCKET_NAME,
			key,
			fileSplit
		);

		if (!multipleUrls) {
			return next(customError.internalServerError("(fn) getMultiSignedUrl Error"));
		}
		const { partUrls, completeUrl } = multipleUrls;
		return res.json({ token, partUrls, completeUrl });
	}
};

const uploadCleanPending = async (req, res, next) => {
	console.log("upload-failed - req.body: ", req.body);
	const { token } = req.body;
	const userId = req.session.user.id;

	const fileStatus = await checkPendingFileStatus(userId, token);
	console.log("fileStatus: ", fileStatus);
	if (!fileStatus) {
		return next(customError.internalServerError("(fn) checkPendingFileStatus Error"));
	}

	const { ff_id, file_ver_id, current_ver, operation } = fileStatus;

	const nowTime = generateCurrentTime();
	let clean;
	if (current_ver === 1) {
		clean = await cleanUploadNewPending(token);
	} else if (operation === "added") {
		clean = await cleanUploadDeletedPending(token, ff_id, file_ver_id, current_ver);
	} else if (operation === "updated") {
		clean = await cleanUploadExistedPending(token, ff_id, file_ver_id, nowTime, current_ver);
	}

	if (!clean) {
		return next(customError.internalServerError("Cannot clean upload failed records"));
	}

	// update usage of an user
	// const now = DateTime.utc();
	// const nowTime = now.toFormat("yyyy-MM-dd HH:mm:ss");
	// const currentUsed = await updateSpaceUsedByUser(userId, nowTime);
	// if (currentUsed === -1) {
	// 	return next(customError.internalServerError());
	// }
	// req.session.user.used = currentUsed;

	return res.json({ msg: "ok" });
};

const uploadCommitDB = async (req, res, next) => {
	console.log("uploadCommitDB: ", req.body);
	const { token, parentPath } = req.body;
	const userId = req.session.user.id;

	const nowTime = generateCurrentTime();

	const commit = await commitMetadata("done", token, userId, nowTime);
	if (!commit) {
		return next(customError.internalServerError());
	}
	// console.log("commit: ", commit);
	// console.log("commit.row_ff.affectedRows: ", commit.row_ff.affectedRows);
	// console.log("commit.row_ff.info: ", commit.row_ff.info);
	// console.log("commit.row_file_ver.affectedRows: ", commit.row_file_ver.affectedRows);
	// console.log("commit.row_file_ver.info: ", commit.row_file_ver.info);
	// if (commit.row_ff.affectedRows < 1 || commit.row_file_ver.affectedRows < 1) {
	// 	return next(customError.badRequest("Token is wrong"));
	// }

	const currentUsed = await updateSpaceUsedByUser(userId, nowTime);
	if (currentUsed === -1) {
		return next(customError.internalServerError());
	}
	req.session.user.used = currentUsed;

	const io = req.app.get("socketio");
	emitNewList(io, userId, parentPath);
	emitUsage(io, userId, req.session.user);

	return res.json({ msg: "ok" });
};

export { checkUsed, uploadChangeDB, getS3Url, uploadCleanPending, uploadCommitDB };
