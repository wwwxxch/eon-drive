import { customError } from "../../error/custom_error.js";
import { generateCurrentTime } from "../../util/util.js";

import { markDeleteById, permDeleteByFileId } from "../../model/db_files_delete.js";
import {
	findFileIdByPath,
	findTargetFolderId,
	findDeletedFileIdByPath,
} from "../../service/path/iter.js";
import { deleteRecur, permDeleteRecur } from "../../service/path/recur.js";
import { updateSpaceUsedByUser } from "../../model/db_plan.js";

import { emitNewList, emitTrashList, emitUsage } from "../../service/sync/list.js";

import dotenv from "dotenv";
dotenv.config();
const { S3_MAIN_BUCKET_NAME } = process.env;

import { s3clientGeneral } from "../../service/s3/s3_client.js";

import {
	deleteAllVersionsForOneObject,
	deleteFolderAndContents,
} from "../../service/s3/s3_delete.js";
// ======================================================================
const deleteDB = async (req, res, next) => {
	console.log("/deleteDB: req.body: ", req.body);
	// req.body = { "delList": ["folder/", "file.ext"] }
	const { delList, parentPath } = req.body;
	const userId = req.session.user.id;
	const nowTime = generateCurrentTime();

	for (let i = 0; i < delList.length; i++) {
		const key = delList[i];
		if (key.endsWith("/")) {
			console.log("delete folder");

			// DB
			const folders = key.slice(0, key.length - 1).split("/");
			const parentId = await findTargetFolderId(userId, folders);
			// const parentId = -1;
			console.log("parentId: ", parentId);
			if (parentId === -1) {
				return next(customError.badRequest("This file/folder may not exist."));
			}
			const deleteRecurRes = await deleteRecur(parentId, userId, nowTime);
			// const deleteRecurRes = null;
			console.log("deleteRecurRes: ", deleteRecurRes);
			if (!deleteRecurRes) {
				return next(customError.internalServerError("(fn) deleteRecur Error"));
			}
		} else {
			console.log("delete file");

			// DB
			const fileId = await findFileIdByPath(userId, key);
			// const fileId = -1;
			console.log("fileId: ", fileId);
			if (fileId === -1) {
				return next(customError.badRequest("This file/folder may not exist."));
			}
			const deleteRes = await markDeleteById(nowTime, fileId, userId);
			console.log("deleteRes: ", deleteRes);
			if (!deleteRes) {
				return next(customError.internalServerError("(fn) markDeleteById Error"));
			}
		}
	}

	// update usage of a user
	const currentUsed = await updateSpaceUsedByUser(userId, nowTime);
	if (currentUsed === -1) {
		return next(customError.internalServerError("(fn) updateSpaceUsedByUser Error"));
	}
	req.session.user.used = currentUsed;

	// emit list
	const io = req.app.get("socketio");
	emitNewList(io, userId, parentPath);
	emitTrashList(io, userId);
	emitUsage(io, userId, req.session.user);

	// TODO: return 204 code ?
	return res.json({ msg: "ok" });
};

const permDelete = async (req, res, next) => {
	console.log("/perm-delete: ", req.body);
	const { permDeleteList } = req.body;
	const userId = req.session.user.id;

	// if it's folder -> find the children under deleted folder
	// if it's file -> find the deleted file by path

	for (let i = 0; i < permDeleteList.length; i++) {
		let key = permDeleteList[i];

		if (key.endsWith("/")) {
			console.log("perm delete folder - ", key);

			// get parentId
			const folders = key.slice(0, key.length - 1).split("/");
			console.log("folders: ", folders);

			const parentId = await findTargetFolderId(userId, folders);
			console.log("parentId: ", parentId);
			if (parentId === -1) {
				return next(customError.badRequest("This file/folder may not exist."));
			}

			// update DB
			const deleteDB = await permDeleteRecur(parentId, userId);
			// const deleteDB = null;
			console.log("deleteDB: ", deleteDB);
			if (!deleteDB) {
				return next(customError.internalServerError("(fn) permDeleteRecur Error"));
			}

			// update S3
			const deleteS3 = await deleteFolderAndContents(
				s3clientGeneral,
				S3_MAIN_BUCKET_NAME,
				`user_${userId}/${key}`
			);
			console.log("deleteS3: ", deleteS3);
		} else {
			console.log("perm delete file - ", key);

			// get fileId
			const fileId = await findDeletedFileIdByPath(userId, key);
			// const fileId = -1;
			console.log("fileId: ", fileId);
			if (fileId === -1) {
				return next(customError.badRequest("This file/folder may not exist."));
			}

			// update DB
			const deleteDB = await permDeleteByFileId(fileId, userId);
			console.log("deleteDB: ", deleteDB);
			if (!deleteDB) {
				return next(customError.internalServerError("(fn) permDeleteByFileId Error"));
			}

			// update S3
			const deleteS3 = await deleteAllVersionsForOneObject(
				s3clientGeneral,
				S3_MAIN_BUCKET_NAME,
				`user_${userId}/${key}`
			);
			console.log("deleteS3: ", deleteS3);
		}
	}

	// emit trash list
	const io = req.app.get("socketio");
	emitTrashList(io, userId);
	return res.json({ msg: "ok" });
};

export { deleteDB, permDelete };
