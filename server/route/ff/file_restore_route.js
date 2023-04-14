import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";
import { authentication } from "../../controller/user/user_auth_controller.js";

import { findFileIdByPath } from "../../service/path/iter.js";
import { restoreFileTo } from "../../model/db_ff_u.js";

import { v4 as uuidv4 } from "uuid";

import dotenv from "dotenv";
dotenv.config();
const { S3_MAIN_BUCKET_NAME } = process.env;
import { s3clientGeneral } from "../../service/s3/s3_client.js";
import { copyS3Obj } from "../../service/s3/s3_copy.js";
import { commitMetadata } from "../../model/db_ff_u.js";
import { emitNewList } from "../../service/sync/list.js";
// ===============================================================================

router.post("/restore-history", authentication, async (req, res) => {
	console.log("/restore-history: ", req.body);
	const { version, fileWholePath, parentPath } = req.body;
	const userId = req.session.user.id;
	// find the fileId by path
	const fileId = await findFileIdByPath(userId, fileWholePath);
	console.log("fileId: ", fileId);

	// change table
	const token = uuidv4();
	const nowTime = Date.now();
	const restore = await restoreFileTo(token, fileId, version, nowTime, userId);
	console.log("restore: ", restore); // new version

	// copy this version file as new version file (S3)
	const newRecordInS3 = await copyS3Obj(
    s3clientGeneral, 
    S3_MAIN_BUCKET_NAME, 
    `user_${userId}/${fileWholePath}.v${version}`, 
    `user_${userId}/${fileWholePath}.v${restore.new_ver}`);
  console.log("newRecordInS3: ", newRecordInS3);
  
  // commit metadata
  const commit = await commitMetadata("done", token);
	console.log("commit: ", commit);

	// emit new list
	emitNewList(req, userId, parentPath);

  return res.send("done");
});

export { router as file_restore_route };
