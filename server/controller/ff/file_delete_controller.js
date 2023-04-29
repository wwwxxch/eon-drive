import { DateTime } from "luxon";
import { iterForParentId, findFileIdByPath } from "../../service/path/iter.js";
import { deleteRecur, permDeleteRecur } from "../../service/path/recur.js";
import { markDeleteById } from "../../model/db_ff_d.js";
import { updateSpaceUsedByUser } from "../../model/db_plan.js";
import { emitNewList, emitTrashList, emitUsage } from "../../service/sync/list.js";

import { findDeletedFileIdByPath } from "../../service/path/iter.js";
import { permDeleteByFileId } from "../../model/db_ff_d.js";

import dotenv from "dotenv";
dotenv.config();
const { S3_MAIN_BUCKET_NAME } = process.env;

import { s3clientGeneral } from "../../service/s3/s3_client.js";

import {
	deleteAllVersionsForOneObject,
	deleteFolderAndContents,
} from "../../service/s3/s3_delete.js";

import { customError } from "../../error/custom_error.js";
// ======================================================================
const deleteDB = async (req, res, next) => {
	console.log("/deleteDB: ", req.body);
	// req.body = { "delList": ["folder/", "file.ext"] }
	const { delList, parentPath } = req.body;
	const userId = req.session.user.id;
	const now = DateTime.utc();
  const nowTime = now.toFormat("yyyy-MM-dd HH:mm:ss");

	for (let i = 0; i < delList.length; i++) {
		const key = delList[i];
		if (key.endsWith("/")) {
			console.log("delete folder");

			// DB
			const folders = key.slice(0, key.length - 1).split("/");
			const parentId = await iterForParentId(userId, folders);
			console.log("parentId: ", parentId);
      if (parentId === -1) {
        return next(customError.badRequest("No such key"));
      }
			const deleteRecurRes = await deleteRecur(parentId, userId, nowTime);
			console.log("deleteRecurRes: ", deleteRecurRes);
      if (!deleteRecurRes) {
        return next(customError.internalServerError());
      }
		} else {
			console.log("delete file");

			// DB
			const fileId = await findFileIdByPath(userId, key);
			console.log("fileId: ", fileId);
      if (fileId === -1) {
        return next(customError.badRequest("No such key"));
      }
			const deleteRes = await markDeleteById(nowTime, fileId);
			console.log("deleteRes: ", deleteRes);
      if (!deleteRes) {
        return next(customError.internalServerError());
      }
		}
	}

	// update usage of an user
	const currentUsed = await updateSpaceUsedByUser(userId, nowTime);
  if (currentUsed === -1) {
    return next(customError.internalServerError());
  }
	req.session.user.used = currentUsed;

	// emit list
  const io = req.app.get("socketio");
	emitNewList(io, userId, parentPath);
  emitTrashList(io, userId);
  emitUsage(io, userId, req.session.user);

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
			const parentId = await iterForParentId(userId, folders);
			console.log("parentId: ", parentId);
      if (parentId === -1) {
        return next(customError.badRequest("No such key"));
      }

			// update DB
			const deleteDB = await permDeleteRecur(parentId, userId);
			console.log("deleteDB: ", deleteDB);
      if (!deleteDB) {
        return next(customError.internalServerError());
      }

			// update S3
			const deleteS3 = await deleteFolderAndContents(
				s3clientGeneral,
				S3_MAIN_BUCKET_NAME,
				`user_${userId}/${key}`
			);
		} else {
      console.log("perm delete file - ", key);
			// get fileId
			const fileId = await findDeletedFileIdByPath(userId, key);
			console.log("fileId: ", fileId);
			if (fileId === -1) {
        return next(customError.badRequest("No such key"));
      }

			// update DB
			const deleteDB = await permDeleteByFileId(fileId);
			console.log("deleteDB: ", deleteDB);
      if (!deleteDB) {
        return next(customError.internalServerError());
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

  const io = req.app.get("socketio");
  emitTrashList(io, userId);
	return res.json({ msg: "ok" });
};

export { deleteDB, permDelete };
