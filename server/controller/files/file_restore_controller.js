import { v4 as uuidv4 } from "uuid";
import { generateCurrentTime } from "../../util/util.js";
import { CustomError } from "../../error/custom_error.js";

import dotenv from "dotenv";
dotenv.config();
const { S3_MAIN_BUCKET_NAME } = process.env;

import { s3clientGeneral } from "../../service/s3/s3_client.js";
import { copyS3Obj } from "../../service/s3/s3_copy.js";

import { restoreFileToPrev, restoreDeletedFile } from "../../model/db_files_restore.js";
import { commitMetadata } from "../../model/db_files_commit.js";

import { updateSpaceUsedByUser } from "../../model/db_plan.js";
import {
	findFileIdByPath,
	findDeletedFileIdByPath,
	findTargetFolderId,
} from "../../service/path/iter.js";
import { restoreRecur } from "../../service/path/recur.js";

import { emitNewList, emitHistoryList, emitTrashList, emitUsage } from "../../service/sync/list.js";
import { getCurrentSizeByFileId, getSizeByFileIdAndVersion } from "../../model/db_files_read.js";
// ===================================================================================
const restoreHistory = async (req, res, next) => {
	console.log("restoreHistory ", req.body);
	const { version, fileWholePath, parentPath } = req.body;
	const userId = req.session.user.id;
	const decodeFileWholePath = decodeURIComponent(fileWholePath);
	const decodeParentPath = decodeURIComponent(parentPath);

	// find the fileId by path
	const fileId = await findFileIdByPath(userId, decodeFileWholePath);
	// const fileId = -1;
	console.log("fileId: ", fileId);
	if (fileId === -1) {
		return next(CustomError.badRequest("This file may not exist."));
	}

	// check capacity
	const targetSize = await getSizeByFileIdAndVersion(fileId, version);
	if (targetSize < 0) {
		return next(CustomError.badRequest("Cannot find record by this file id and version"));
	}
	const currentSize = await getCurrentSizeByFileId(fileId);
	if (currentSize < 0) {
		return next(CustomError.internalServerError("(fn) getCurrentSizeByFileId Error"));
	}
	console.log("targetSize: ", targetSize);
	console.log("currentSize: ", currentSize);

	const allocated = Number(req.session.user.allocated);
	const used = Number(req.session.user.used);
	if (used - currentSize + targetSize > allocated) {
		return next(CustomError.badRequest("You don't have enough space."));
	}

	// update DB
	const token = uuidv4();
	const nowTime = generateCurrentTime();
	const restore = await restoreFileToPrev(token, fileId, version, nowTime, userId);
	console.log("restore: ", restore); // new version
	if (!restore) {
		return next(CustomError.internalServerError("(fn) restoreFileToPrev Error"));
	}

	// update S3 - copy this version file as new version file (S3)
	const newRecordInS3 = await copyS3Obj(
		s3clientGeneral,
		S3_MAIN_BUCKET_NAME,
		`user_${userId}/${fileWholePath}.v${version}`,
		`user_${userId}/${decodeFileWholePath}.v${restore.new_ver}`
	);
	// const newRecordInS3 = null;
	console.log("newRecordInS3: ", newRecordInS3);
	if (!newRecordInS3) {
		return next(CustomError.internalServerError("(fn) copyS3Obj Error"));
	}

	// commit metadata
	const commit = await commitMetadata("done", token, userId, nowTime);
	if (!commit) {
		return next(CustomError.internalServerError("(fn) commitMetadata Error"));
	}

	// update usage of a user
	const currentUsed = await updateSpaceUsedByUser(userId, nowTime);
	if (currentUsed === -1) {
		return next(CustomError.internalServerError("(fn) updateSpaceUsedByUser Error"));
	}
	req.session.user.used = currentUsed;

	// emit new list
	const io = req.app.get("socketio");
	emitNewList(io, userId, decodeParentPath);
	emitHistoryList(io, userId, fileId);
	emitUsage(io, userId, req.session.user);

	return res.json({ msg: "ok" });
};

const restoreDeleted = async (req, res, next) => {
	console.log("restoreDeleted: ", req.body);
	const { restoreList } = req.body;
	const userId = req.session.user.id;

	// if it's folder -> find the children under deleted folder
	// if it's file -> find the deleted file by path

	for (let i = 0; i < restoreList.length; i++) {
		const token = uuidv4();
		const nowTime = generateCurrentTime();

		let key = restoreList[i];
		let encodeKey = encodeURIComponent(restoreList[i]);

		if (key.endsWith("/")) {
			console.log("restore folder - key: ", key);
			// get parentId
			const folders = key.slice(0, key.length - 1).split("/");
			const parentId = await findTargetFolderId(userId, folders);
			console.log("parentId: ", parentId);
			if (parentId === -1) {
				return next(CustomError.badRequest("This file/folder may not exist."));
			}

			// update DB & S3
			const restoreRecurRes = await restoreRecur(
				parentId,
				key.replace(/\/$/, ""),
				nowTime,
				token,
				userId,
				req.session
			);
			console.log("restoreRecurRes: ", restoreRecurRes);
			if (!restoreRecurRes) {
				return next(CustomError.internalServerError());
			}
		} else {
			console.log("restore file - key: ", key);
			// get fileId
			const fileId = await findDeletedFileIdByPath(userId, key);
			// const fileId = -1;
			console.log("fileId: ", fileId);
			if (fileId === -1) {
				return next(CustomError.badRequest("This file/folder may not exist."));
			}

			// check capacity
			const currentSize = await getCurrentSizeByFileId(fileId);
			if (currentSize < 0) {
				return next(CustomError.internalServerError());
			}
			console.log("currentSize: ", currentSize);

			const allocated = Number(req.session.user.allocated);
			const used = Number(req.session.user.used);
			if (used + currentSize > allocated) {
				return next(CustomError.badRequest("You don't have enough space."));
			}

			// update DB
			const restoreDeleted = await restoreDeletedFile(token, fileId, nowTime, userId);
			console.log("restoreDeleted: ", restoreDeleted); // cur version & new version
			if (!restoreDeleted) {
				return next(CustomError.internalServerError("(fn) restoreDeletedFile Error"));
			}

			// update S3
			const newRecordInS3 = await copyS3Obj(
				s3clientGeneral,
				S3_MAIN_BUCKET_NAME,
				`user_${userId}/${encodeKey}.v${restoreDeleted.cur_ver}`,
				`user_${userId}/${key}.v${restoreDeleted.new_ver}`
			);
			console.log("newRecordInS3: ", newRecordInS3);
			if (!newRecordInS3) {
				return next(CustomError.internalServerError("(fn) copyS3Obj Error"));
			}
		}
		const commit = await commitMetadata("done", token, userId, nowTime);
		if (!commit) {
			return next(CustomError.internalServerError("(fn) commitMetadata Error"));
		}
	}

	const nowTime = generateCurrentTime();
	// update usage of a user
	const currentUsed = await updateSpaceUsedByUser(userId, nowTime);
	if (currentUsed === -1) {
		return next(CustomError.internalServerError("(fn) updateSpaceUsedByUser Error"));
	}
	req.session.user.used = currentUsed;

	// emit new list
	const io = req.app.get("socketio");
	emitTrashList(io, userId);
	emitUsage(io, userId, req.session.user);

	return res.json({ msg: "ok" });
};

export { restoreHistory, restoreDeleted };
