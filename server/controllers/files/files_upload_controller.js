import { v4 as uuidv4 } from "uuid";
import { generateCurrentTime } from "../../utils/utils.js";
import { CustomError } from "../../utils/custom_error.js";

import { findFileIdByPath } from "../../services/path/iter.js";
import {
	getCurrentSizeByFileId,
	getFolderId,
	getFileId,
	checkPendingFileStatus,
} from "../../models/db_files_read.js";

import {
	createFolder,
	createFile,
	changeFolderDeleteStatus,
	updateDeletedFile,
	updateExistedFile,
} from "../../models/db_files_upload.js";
import { commitMetadata } from "../../models/db_files_commit.js";

import { updateSpaceUsedByUser } from "../../models/db_plan.js";

import dotenv from "dotenv";
dotenv.config();
const { S3_MAIN_BUCKET_NAME } = process.env;

import { s3clientGeneral } from "../../services/s3/s3_client.js";
import { getSingleSignedUrl, getMultiSignedUrl } from "../../services/s3/s3_upload.js";

import { emitNewList, emitUsage } from "../../services/sync/list.js";
import {
	cleanUploadDeletedPending,
	cleanUploadExistedPending,
	cleanUploadNewPending,
} from "../../models/db_files_operation_failed.js";
// ======================================================================
const checkUsed = async (req, res, next) => {
	console.log("/upload-start - checkUsed - req.body: ", req.body);

	const { fileWholePath } = req.body;
	const fileSize = Number(req.body.fileSize);
	const userId = req.session.user.id;

	const fileId = await findFileIdByPath(userId, fileWholePath);
	console.log("fileId: ", fileId);

	const allocated = Number(req.session.user.allocated);
	const used = Number(req.session.user.used);

	if (fileId === -1) {
		if (fileSize + used > allocated) {
			return next(CustomError.badRequest("You don't have enough space."));
		}
		return next();
	}

	const currentSize = await getCurrentSizeByFileId(fileId);
	if (currentSize < 0) {
		return next(CustomError.internalServerError("(fn) getCurrentSizeByFileId Error"));
	}
	if (used - currentSize + fileSize > allocated) {
		return next(CustomError.badRequest("You don't have enough space."));
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
	const nowTime = generateCurrentTime();

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
					return next(CustomError.internalServerError("(fn) createFolder Error"));
				}
				parentId = newDir;
			} else if (chkDir[0].is_delete === 1) {
				// if dir has been deleted, change delete status
				const chgFolderStatus = await changeFolderDeleteStatus(
					0,
					chkDir[0].id,
					token,
					nowTime
				);
				if (!chgFolderStatus) {
					return next(
						CustomError.internalServerError("(fn) changeFolderDeleteStatus Error")
					);
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
		return next(CustomError.internalServerError("(fn) getFileId Error"));
	} else if (chkFile.length === 0) {
		// 1. create new file record
		chgDBres = await createFile(parentId, fileName, fileSize, userId, token, nowTime);
		console.log("newFile: ", chgDBres);
		if (!chgDBres) {
			return next(CustomError.internalServerError("(fn) createFile Error"));
		}
	} else if (chkFile[0].is_delete === 1) {
		// 2. if file has been deleted, change delete status & update tables
		chgDBres = await updateDeletedFile(0, token, chkFile[0].id, fileSize, nowTime);
		console.log("updDelFile: ", chgDBres);
		if (!chgDBres) {
			return next(CustomError.internalServerError("(fn) updateDeletedFile Error"));
		}
	} else {
		// 3. add new version for update
		chgDBres = await updateExistedFile(token, chkFile[0].id, fileSize, nowTime);
		console.log("updExsFile: ", chgDBres);
		if (!chgDBres) {
			return next(CustomError.internalServerError("(fn) updateExistedFile Error"));
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
			return next(CustomError.internalServerError("(fn) getSingleSignedUrl Error"));
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
			return next(CustomError.internalServerError("(fn) getMultiSignedUrl Error"));
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
		return next(CustomError.internalServerError("(fn) checkPendingFileStatus Error"));
	}

	const { files_id, file_ver_id, current_ver, operation } = fileStatus;

	const nowTime = generateCurrentTime();
	let clean;
	if (current_ver === 1) {
		clean = await cleanUploadNewPending(token, files_id);
	} else if (operation === "added") {
		clean = await cleanUploadDeletedPending(token, files_id, file_ver_id, current_ver);
	} else if (operation === "updated") {
		clean = await cleanUploadExistedPending(
			token,
			files_id,
			file_ver_id,
			nowTime,
			current_ver
		);
	}

	if (!clean) {
		return next(CustomError.internalServerError("Cannot clean upload failed records"));
	}

	return res.json({ msg: "ok" });
};

const uploadCommitDB = async (req, res, next) => {
	console.log("uploadCommitDB: ", req.body);
	const { token, parentPath } = req.body;
	const userId = req.session.user.id;

	const nowTime = generateCurrentTime();

	const commit = await commitMetadata("done", token, userId, nowTime);
	if (!commit) {
		return next(CustomError.internalServerError("(fn) commitMetadata Error"));
	}

	// update usage of the user
	const currentUsed = await updateSpaceUsedByUser(userId, nowTime);
	if (currentUsed === -1) {
		return next(CustomError.internalServerError());
	}
	req.session.user.used = currentUsed;

	const io = req.app.get("socketio");
	emitNewList(io, userId, parentPath);
	emitUsage(io, userId, req.session.user);

	return res.json({ msg: "ok" });
};

export { checkUsed, uploadChangeDB, getS3Url, uploadCleanPending, uploadCommitDB };
