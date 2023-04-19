import { getExpiredDeleted } from "../server/model/db_expiration.js";
import { getFFInfoById } from "../server/model/db_ff_r.js";
import { findParentPathByFFId } from "../server/service/path/iter.js";
import {
	permDeleteByFileId,
	permDeleteByFolderId,
} from "../server/model/db_ff_d.js";

import dotenv from "dotenv";
dotenv.config();
const { S3_MAIN_BUCKET_NAME } = process.env;
import { s3clientGeneral } from "../../service/s3/s3_client.js";
import { deleteAllVersionsForOneObject } from "../server/service/s3/s3_delete.js";
import { deleteObject } from "../server/service/s3/s3_delete.js";

// ============================================================================
const clearDeleted = async () => {
  try {
    const nowDT = Date.now();
    const expiredDeletedList = await getExpiredDeleted(nowDT);
    if (expiredDeletedList.length === 0) {
      return;
    }

    let expiredFiles = [];
    let expireFolders = [];
    for (const element of expiredDeletedList) {
      // get user_id & type & name & id by ff_id
      // get file/folder full path by ff_id
      // remove file first
      // remove folder (no need to recursively find children under folder)

      const info = await getFFInfoById(element);
      // info.id info.name, info.type, info.user_id

      if (info.type === "folder") expireFolders.push(info);
      else if (info.type === "file") expiredFiles.push(info);
    }

    // file
    for (const element of expiredFiles) {
      const parentPath = await findParentPathByFFId(element.id);
      const fullPath = parentPath.replace(/^Home\//, "") + element.name;
      // remove file from DB
      const deleteDB = await permDeleteByFileId(element.id);
      console.log("deleteDB: ", deleteDB);
      // remove file from S3
      const deleteS3 = await deleteAllVersionsForOneObject(
        s3clientGeneral,
        S3_MAIN_BUCKET_NAME,
        `user_${element.user_id}/${fullPath}`
      );
      console.log("deleteS3: ", deleteS3);
    }

    // folder
    for (const element of expireFolders) {
      const parentPath = await findParentPathByFFId(element.id);
      const fullPath = parentPath.replace(/^Home\//, "") + element.name;
      // remove folder from DB
      const deleteDB = await permDeleteByFolderId(element.id);
      console.log("deleteDB: ", deleteDB);
      // remove folder from S3
      const deleteS3 = await deleteObject(
        s3clientGeneral,
        S3_MAIN_BUCKET_NAME,
        `user_${element.user_id}/${fullPath}`
      );
      console.log("deleteS3: ", deleteS3);
    }
    console.log("clear deleted files/folders > expiration DT");
    return true;
  } catch (e) {
    console.log("clearDeleted - error: ", e);
    return false;
  } finally {
    process.exit();
  }
};

export { clearDeleted };