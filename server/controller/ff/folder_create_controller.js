import { DateTime } from "luxon";
import { v4 as uuidv4 } from "uuid";

const { S3_MAIN_BUCKET_NAME } = process.env;
import { s3clientGeneral } from "../../service/s3/s3_client.js";
import { createS3Folder } from "../../service/s3/s3_create.js";

import { getFolderId } from "../../model/db_ff_r.js";
import { createFolder } from "../../model/db_ff_c.js";
import {
	changeFolderDeleteStatus,
	commitMetadata,
} from "../../model/db_ff_u.js";

import { iterForParentId } from "../../service/path/iter.js";
import { emitNewList } from "../../service/sync/list.js";
import { customError } from "../../error/custom_error.js";
// ===========================================================================
const createFolderS3AndDB = async (req, res, next) => {
	console.log("createFolderS3AndDB: ", req.body);
	const userId = req.session.user.id;
	const { parentPath, folderName } = req.body;
	const now = DateTime.utc();
  const nowTime = now.toFormat("yyyy-MM-dd HH:mm:ss");

	// DB
	let token;
	const folders = parentPath.split("/");
	const parentId = await iterForParentId(userId, folders);
  // const parentId = -1;
	console.log("iterForParentId: parentId: ", parentId);
  if (parentId === -1) {
    return next(customError.badRequest("No such key"));
  }
	// check if there's same folder under the directory
	const chkDir = await getFolderId(userId, parentId, folderName);
	if (chkDir.length > 0 && chkDir[0].is_delete === 0 && chkDir[0].upd_status === "done") {
		// if yes & is_delete === 0
    return next(customError.badRequest("Folder is already existed"));

	} else if (chkDir.length > 0 && chkDir[0].is_delete === 1) {
		// if yes & is_delete === 1 -> change folder delete status
		const chgDelStatus = await changeFolderDeleteStatus(0, chkDir[0].id, nowTime);
		console.log("chgDelStatus.affectedRows: ", chgDelStatus.affectedRows);
    
    if (!chgDelStatus || chgDelStatus.affectedRows !== 1) {
      return next(customError.internalServerError());
    }

	} else {
		// if no -> createNewDir, status = "pending"
		token = uuidv4();
		const newDirId = await createFolder(
			parentId,
			folderName,
      userId,
			token,
			nowTime
		);
		console.log("newDirId: ", newDirId);
    if (newDirId === -1) {
      return next(customError.internalServerError());
    }
	}

	// S3
	let key;
	if (parentPath === "") {
		key = `user_${userId}/${folderName}`;
	} else {
		key = `user_${userId}/${parentPath}/${folderName}`;
	}
	const createS3Res = await createS3Folder(
		s3clientGeneral,
		S3_MAIN_BUCKET_NAME,
		key
	);
	console.log("createS3Res: ", createS3Res);
	if (!createS3Res) {
		return next(customError.internalServerError());
	}
  
	// DB
	// update status = "done"
	const commit = await commitMetadata("done", token);
  if (!commit) {
    return next(customError.internalServerError());
  }
  // console.log("commit: ", commit);
  console.log("commit.affectedRows: ", commit.affectedRows);
  console.log("commit.info: ", commit.info);
  if (commit.affectedRows !== 1) {
    return next(customError.badRequest("Token is wrong"));
  }

	// emit new list
  const io = req.app.get("socketio");
	emitNewList(io, userId, parentPath);

	return res.json({ msg: "ok" });
};

export { createFolderS3AndDB };
