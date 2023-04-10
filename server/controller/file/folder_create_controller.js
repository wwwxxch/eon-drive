import { v4 as uuidv4 } from "uuid";

import dotenv from "dotenv";
dotenv.config();

const { S3_MAIN_BUCKET_NAME } = process.env;

import { s3clientGeneral } from "../../service/s3/s3_client.js";

import { createS3Folder } from "../../service/s3/s3_create.js";

import { iterPath } from "../../service/find_child.js";

import { createNewDir, getDirId, commitMetadata } from "../../model/db_file.js";

import { emitNewList } from "../../service/sync_list.js";
// ======================================================================================
const createFolderS3AndDB = async (req, res) => {
  console.log("/create-folder: ", req.body);
	const userId = req.session.user.id;
	const { parentPath, folderName } = req.body;

	// DB
	// find parentId first
	const parentId = await iterPath(userId, parentPath);
	console.log(parentId);

	// check if there's same folder under the directory
  const chkFolder = await getDirId(userId, parentId, folderName);
  if (chkFolder.length > 0) {
    return res.status(400).json({ msg: "Folder existed" });
  }

	// if no -> createNewDir, status = "pending"
  const token = uuidv4();
  const createFolderInDB = await createNewDir(userId, parentId, folderName, token);
  if (createFolderInDB.affectedRows !== 1) {
    return res.status(500).json({ msg: "Something Wrong" });
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
  const commit = await commitMetadata(userId, "done", token);
	console.log("commit.affectedRows: ", commit.affectedRows);

	// emit new list
	emitNewList(req, userId, parentPath);

	return res.json({ msg: "ok" });
};

export { createFolderS3AndDB };
