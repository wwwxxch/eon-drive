import { generateCurrentTime } from "../../util/util.js";
import { v4 as uuidv4 } from "uuid";

const { S3_MAIN_BUCKET_NAME } = process.env;
import { s3clientGeneral } from "../../service/s3/s3_client.js";
import { createS3Folder } from "../../service/s3/s3_create.js";

import { getFolderId } from "../../model/db_files_read.js";
import { createFolder, changeFolderDeleteStatus } from "../../model/db_files_upload.js";
import { commitMetadata } from "../../model/db_files_commit.js";

import { findTargetFolderId } from "../../service/path/iter.js";
import { emitNewList } from "../../service/sync/list.js";
import { CustomError } from "../../error/custom_error.js";
// ===========================================================================
const createFolderS3AndDB = async (req, res, next) => {
	console.log("createFolderS3AndDB: ", req.body);
	const userId = req.session.user.id;
	const { parentPath, folderName } = req.body;
	const nowTime = generateCurrentTime();

	// DB - insert new record
	let token;
	const folders = parentPath.split("/");
	console.log("folders: ", folders);
	const parentId = await findTargetFolderId(userId, folders);
	// const parentId = -1;
	console.log("findTargetFolderId: parentId: ", parentId);
	if (parentId === -1) {
		return next(CustomError.badRequest("This file/folder may not exist."));
	}

	// check if there's same folder under the directory
	const chkDir = await getFolderId(userId, parentId, folderName);
	if (chkDir.length > 0 && chkDir[0].is_delete === 0 && chkDir[0].files_upd_status === "done") {
		// if yes & is_delete === 0
		return next(CustomError.badRequest("Folder is already existed"));
	} else if (chkDir.length > 0 && chkDir[0].is_delete === 1) {
		// if yes & is_delete === 1 -> change folder delete status
		const chgDelStatus = await changeFolderDeleteStatus(0, chkDir[0].id, nowTime);
		console.log("chgDelStatus.affectedRows: ", chgDelStatus.affectedRows);

		if (!chgDelStatus || chgDelStatus.affectedRows !== 1) {
			return next(CustomError.internalServerError("(fn) changeFolderDeleteStatus Error"));
		}
	} else {
		// if no -> createNewDir
		token = uuidv4();
		const newDirId = await createFolder(parentId, folderName, userId, token, nowTime);
		console.log("newDirId: ", newDirId);
		if (newDirId === -1) {
			return next(CustomError.internalServerError("(fn) createFolder Error"));
		}
	}

	// S3
	let key;
	if (parentPath === "") {
		key = `user_${userId}/${folderName}`;
	} else {
		key = `user_${userId}/${parentPath}/${folderName}`;
	}
	const createS3Res = await createS3Folder(s3clientGeneral, S3_MAIN_BUCKET_NAME, key);
	console.log("createS3Res: ", createS3Res);
	if (!createS3Res) {
		return next(CustomError.internalServerError("(fn) createS3Folder Error"));
	}

	// DB - commit
	const commit = await commitMetadata("done", token, userId, nowTime, 1);
	if (!commit) {
		return next(CustomError.internalServerError("(fn) commitMetadata Error"));
	}

	// emit new list
	const io = req.app.get("socketio");
	emitNewList(io, userId, parentPath);

	return res.json({ msg: "ok" });
};

export { createFolderS3AndDB };
