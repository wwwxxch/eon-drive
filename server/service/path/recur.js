import {
	getOneLevelChildByParentId,
	getCurrentVersionByFileId,
  getCurrentSizeByFileId
} from "../../model/db_ff_r.js";
import {
	restoreDeletedFile,
	restoreDeletedFolder,
} from "../../model/db_ff_u.js";
import {
	markDeleteById,
	permDeleteByFileId,
	permDeleteByFolderId,
} from "../../model/db_ff_d.js";
import { iterForParentId } from "./iter.js";

import dotenv from "dotenv";
dotenv.config();
const { S3_MAIN_BUCKET_NAME } = process.env;

import { s3clientGeneral } from "../../service/s3/s3_client.js";
import { copyS3Obj } from "../../service/s3/s3_copy.js";
// ========================================================================================
const deleteRecur = async (parentId, userId, time) => {
	try {
		// find not deleted list
		const list = await getOneLevelChildByParentId(userId, parentId, 0);
		if (list.length > 0) {
			for (let i = 0; i < list.length; i++) {
				if (list[i].type === "file") {
					const deleteFileRes = await markDeleteById(time, list[i].id);
					console.log("deleteFileRes: ", deleteFileRes);
          if (!deleteFileRes) {
            throw new Error("markDeleteById error");
          }
				} else {
					await deleteRecur(list[i].id, userId, time);
				}
			}
		}
		// delete folder itself
		const deleteFolderRes = await markDeleteById(time, parentId);
    console.log("deleteFolderRes: ", deleteFolderRes);
    if (!deleteFolderRes) {
      throw new Error("markDeleteById error");
    }
		return true;
	} catch (e) {
		console.error("deleteRecur: ", e);
		return false;
	}
};

const permDeleteRecur = async (parentId, userId) => {
	try {
		// find deleted list
		const list = await getOneLevelChildByParentId(userId, parentId, 1);
		if (list.length > 0) {
			for (let i = 0; i < list.length; i++) {
				if (list[i].type === "file") {
					const permDeleteFileRes = await permDeleteByFileId(list[i].id);
					console.log("permDeleteFileRes: ", permDeleteFileRes);
          if (!permDeleteFileRes) {
            throw new Error("permDeleteByFileId error");
          }
				} else {
					await permDeleteRecur(list[i].id, userId);
				}
			}
		}
		// delete folder itself
		const deleteFolderRes = await permDeleteByFolderId(parentId);
		console.log("deleteFolderRes: ", deleteFolderRes);
    if (!deleteFolderRes) {
      throw new Error("permDeleteByFolderId error");
    }
		return true;
	} catch (e) {
		console.error("deleteRecur: ", e);
		return false;
	}
};

const folderRecur = async (
	userId,
	parentId,
	arrNoVer,
	arrWithVer,
	currentPath
) => {
	const arr = await getOneLevelChildByParentId(userId, parentId, 0);
	for (let i = 0; i < arr.length; i++) {
		if (arr[i].type === "file") {
			arrNoVer.push(`${currentPath}/${arr[i].name}`);
			
      const version = await getCurrentVersionByFileId(arr[i].id);
			if (version === -1) {
        arrNoVer = [];
        arrWithVer = [];
        return;
      }
      arrWithVer.push(`${currentPath}/${arr[i].name}.v${version}`);
		} else {
			await folderRecur(
				userId,
				arr[i].id,
				arrNoVer,
				arrWithVer,
				`${currentPath}/${arr[i].name}`
			);
		}
	}
};

// input path should be "test1/folderintest1/level2", not starting with "/" nor ending with "/"
const getAllChildren = async (userId, path) => {
	const folders = path.split("/");
	const parentId = await iterForParentId(userId, folders);
  if (parentId === -1) {
    return { childsNoVer: [], childsWithVer: [] };
  }
	const childsNoVer = [];
	const childsWithVer = [];
	await folderRecur(userId, parentId, childsNoVer, childsWithVer, path);
	console.log("getAllChildren: childsNoVer: ", childsNoVer);
	console.log("getAllChildren: childsWithVer: ", childsWithVer);
	return { childsNoVer, childsWithVer };
};

// for restoring deleted folder
const restoreRecur = async (parentId, currentPath, time, token, userId, session) => {
	try {
		// find deleted children
		const list = await getOneLevelChildByParentId(userId, parentId, 1);
		if (list.length > 0) {
			for (let i = 0; i < list.length; i++) {
				if (list[i].type === "file") {
          // check capacity
          const currentSize = await getCurrentSizeByFileId(list[i].id);
          if (currentSize < 0) {
            throw new Error("getCurrentSizeByFileId error");
          }
          const allocated = Number(session.user.allocated);
          const used = Number(session.user.used);
          if (used + currentSize > allocated) {
            throw new Error("Youd don't have enough space.");
          }
					
          // update DB for file restore
					const restoreFileRes = await restoreDeletedFile(
						token,
						list[i].id,
						time,
						userId
					);
					console.log("restoreFileRes: ", restoreFileRes);
          if (!restoreFileRes) {
            throw new Error("restoreDeletedFile error");
          }
					
          // copy new version in S3
          const encodeParentPath = encodeURIComponent(currentPath);
          const encodeKey = encodeURIComponent(list[i].name);

					const newRecordInS3 = await copyS3Obj(
						s3clientGeneral,
						S3_MAIN_BUCKET_NAME,
						`user_${userId}/${encodeParentPath}/${encodeKey}.v${restoreFileRes.cur_ver}`,
						`user_${userId}/${currentPath}/${list[i].name}.v${restoreFileRes.new_ver}`
					);
					console.log("newRecordInS3: ", newRecordInS3);
          if (!newRecordInS3) {
            throw new Error("newRecordInS3 error");
          }

          // update usage (temporarily)
          session.user.used = used + currentSize;
				} else {
					await restoreRecur(
						list[i].id,
						`${currentPath}/${list[i].name}`,
						time,
						token,
						userId,
            session
					);
				}
			}
		}
		// update DB for folder restore
		const restoreFolderRes = await restoreDeletedFolder(token, parentId, time);
		console.log("restoreFolderRes: ", restoreFolderRes);
    if (restoreFolderRes.affectedRows !== 1) {
      throw new Error("restoreDeletedFolder error");
    }
		return true;
	} catch (e) {
		console.error("restoreRecur: ", e);
		return false;
	}
};

export {
	deleteRecur,
	permDeleteRecur,
	getAllChildren,
	restoreRecur
};
