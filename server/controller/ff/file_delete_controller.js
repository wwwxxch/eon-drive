import { 
  iterForParentId,
  findFileIdByPath 
} from "../../service/path/iter.js";
import { deleteRecur } from "../../service/path/recur.js";
import { markDeleteById } from "../../model/db_ff_d.js";
import { updSpaceUsed } from "../../model/db_plan.js";
import { emitNewList } from "../../service/sync/list.js";
// ======================================================================
const deleteDB = async(req, res) => {
  console.log("/deleteDB: ", req.body);
  // req.body = { "delList": ["folder/", "file.ext"] }
  const { delList, parentPath } = req.body; 
  const userId = req.session.user.id;
  const nowTime = Date.now();

  for (let i = 0; i < delList.length; i++) {
    const key = delList[i];
    if (key.endsWith("/")) {
      console.log("delete folder");
      
      // S3
      // await deleteFolderAndContents(s3clientGeneral, S3_MAIN_BUCKET_NAME, `user_${userId}/${key}`);
      
      // DB
      const folders = key.slice(0, key.length-1).split("/");
      const parentId = await iterForParentId(userId, folders);
      const deleteRecurRes = await deleteRecur(parentId, userId, nowTime);
      console.log("deleteRecurRes: ", deleteRecurRes);
    } else {
      console.log("delete file");
      
      // S3
      // await deleteObject(s3clientGeneral, S3_MAIN_BUCKET_NAME, `user_${userId}/${key}`);
      
      // DB
      const fileId = await findFileIdByPath(userId, key);
      console.log("fileId: ", fileId);
      const deleteRes = await markDeleteById(nowTime, fileId);
      console.log("deleteRes: ", deleteRes);
    }
  }

  // update usage of an user
	const currentUsed = await updSpaceUsed(userId, nowTime);
	req.session.user.used = currentUsed;
  
  // emit list
  emitNewList(req, userId, parentPath);

  return res.json({ msg: "delete" });
};

export { deleteDB };
