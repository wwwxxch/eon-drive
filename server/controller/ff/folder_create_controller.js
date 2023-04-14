const { S3_MAIN_BUCKET_NAME } = process.env;
import { s3clientGeneral } from "../../service/s3/s3_client.js";
import { createS3Folder } from "../../service/s3/s3_create.js";

import { v4 as uuidv4 } from "uuid";

import { iterForParentId } from "../../service/path/iter.js";
import { getDirId } from "../../model/db_ff_r.js";
import { createDir } from "../../model/db_ff_c.js";
import { chgDirDelStatus, commitMetadata } from "../../model/db_ff_u.js";
import { emitNewList } from "../../service/sync/list.js";
// ===========================================================================
const createFolderS3AndDB = async (req, res) => {
  console.log("/createFolderS3AndDB: ", req.body);
	const userId = req.session.user.id;
	const { parentPath, folderName } = req.body;
  const nowTime = Date.now();
	// DB
  let token;
	// find parentId first
  const folders = parentPath.split("/");
	const parentId = await iterForParentId(userId, folders);
	console.log("iterForParentId: parentId: ", parentId);

	// check if there's same folder under the directory
  const chkDir = await getDirId(folderName, userId, parentId);

  if (chkDir.length > 0 && chkDir[0].is_delete === 0) {
    // if yes & is_delete === 0
    return res.status(400).json({ msg: "Folder existed" });
  } else if (chkDir.length > 0 && chkDir[0].is_delete === 1) {
    // if yes & is_delete === 1
    console.log("create folder name as deleted folder");
    const chgDelStatus = await chgDirDelStatus(0, chkDir[0].id, nowTime);
    console.log("chgDelStatus.affectedRows: ", chgDelStatus.affectedRows);
  } else {
    // if no -> createNewDir, status = "pending"
    token = uuidv4();
    const newDirId = await createDir(userId, parentId, folderName, token, nowTime);
    console.log("newDirId: ", newDirId);
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
	if (createS3Res["$metadata"].httpStatusCode !== 200) {
		return res.status(500).json({ msg: "Something Wrong" });
	}

	// DB
	// update status = "done"
  const commit = await commitMetadata("done", token);
	console.log("commit.affectedRows: ", commit.affectedRows);

	// emit new list
	emitNewList(req, userId, parentPath);

	return res.json({ msg: "ok" });
};

export { createFolderS3AndDB };