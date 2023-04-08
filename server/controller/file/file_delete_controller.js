import dotenv from "dotenv";
dotenv.config();
const { S3_MAIN_BUCKET_NAME } = process.env;

import { s3clientGeneral } from "../../service/s3/s3_client.js";

import {
  deleteObject,
  deleteFolderAndContents
} from "../../service/s3/s3_delete.js";

import {
  deleteById,
  deleteWholeFolder,
  getDirId,
  getFileId
} from "../../model/db_file.js";

import { updateUsed } from "../../model/db_plan.js";

import { emitNewList } from "../../service/sync_list.js";

// ===============================================================================================
const deleteS3AndDB = async (req, res) => {
  // req.body = { "delList": ["folder/", "file.ext"] }
  const { delList, parentPath } = req.body; 
  const userId = req.session.user.id;

  for (let i = 0; i < delList.length; i++) {
    // TODO: delete S3 object
    const key = delList[i];
    if (key.endsWith("/")) {
      await deleteFolderAndContents(s3clientGeneral, S3_MAIN_BUCKET_NAME, `user_${userId}/${key}`);
    } else {
      await deleteObject(s3clientGeneral, S3_MAIN_BUCKET_NAME, `user_${userId}/${key}`);
    }

    // TODO: delete DB record
    const type = delList[i].endsWith("/") ? "folder" : "file";

		const parts = delList[i].split("/");
		const split = parts.filter((item) => item !== "");
		console.log("split: ", split);

		const iterNum = type === "folder" ? split.length : split.length - 1;
		let parentId = 0;
		for (let j = 0; j < iterNum; j++) {
			const chkDir = await getDirId(userId, parentId, split[j]);
			console.log("chkDir: ", chkDir);
			if (chkDir.length === 0) {
				parentId = null;
				break;
			}
			parentId = chkDir[0].id;
		}

		if (type === "folder") {
			console.log(parentId);
			if (parentId) {
				await deleteWholeFolder(userId, parentId);
			}
		} else {
			console.log(parentId, split[split.length - 1]);
			const [fileId] = await getFileId(
				userId,
				parentId,
				split[split.length - 1]
			);
			console.log(fileId);
			if (fileId) {
				await deleteById(userId, fileId.id);
			}
		}
  }

  // update user.used
  const updUsed = await updateUsed(userId);

  // emit new file list
  emitNewList(req, userId, parentPath);

  return res.json({ msg: "delete" });
};

export { deleteS3AndDB };
