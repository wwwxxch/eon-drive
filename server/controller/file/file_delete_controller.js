import dotenv from "dotenv";
dotenv.config();
const { S3_MAIN_BUCKET_NAME } = process.env;

import { s3clientGeneral } from "../../service/s3/s3_client.js";

import {
	deleteObject,
	deleteFolderAndContents,
} from "../../service/s3/s3_delete.js";

import { deleteById } from "../../model/db_file.js";

import {
	iterForParentId,
	deleteRecur,
	findFileIdByPath,
} from "../../service/find_child.js";

import { updateUsed } from "../../model/db_plan.js";
import { getUser } from "../../model/db_user.js";
import { emitNewList } from "../../service/sync_list.js";
// ===============================================================================================
const deleteS3AndDB = async (req, res) => {
  console.log("deleteS3AndDB: ", req.body);
  // req.body = { "delList": ["folder/", "file.ext"] }
  const { delList, parentPath } = req.body; 
  const userId = req.session.user.id;

  for (let i = 0; i < delList.length; i++) {
    const key = delList[i];
    if (key.endsWith("/")) {
      // S3
      await deleteFolderAndContents(s3clientGeneral, S3_MAIN_BUCKET_NAME, `user_${userId}/${key}`);
      // DB
      const folders = key.slice(0, key.length-1).split("/");
      const parentId = await iterForParentId(userId, folders);
      const deleteRecurRes = await deleteRecur(userId, parentId);
      console.log("deleteRecurRes: ", deleteRecurRes);
    } else {
      // S3
      await deleteObject(s3clientGeneral, S3_MAIN_BUCKET_NAME, `user_${userId}/${key}`);
      // DB
      const fileId = await findFileIdByPath(userId, key);
      const deleteRes = await deleteById(userId, fileId);
      console.log("deleteRes.affectedRows: ", deleteRes.affectedRows);
    }
  }

  // TODO: check again the flow
	// update user.used
	const updUsed = await updateUsed(userId);
  const userInfo = await getUser("id", userId);
  // console.log("userInfo:", userInfo);
  req.session.user.used = userInfo.used;

  // emit new file list
  emitNewList(req, userId, parentPath);

  return res.json({ msg: "delete" });
};

export { deleteS3AndDB };
