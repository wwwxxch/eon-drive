import {
	getOneLevelChildByParentId,
	getCurrentVersionByFileId,
} from "../../model/db_ff_r.js";
import {
	restoreDeletedFile,
	restoreDeletedFolder,
} from "../../model/db_ff_u.js";
import { markDeleteById } from "../../model/db_ff_d.js";
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
				} else {
					await deleteRecur(list[i].id, userId, time);
				}
			}
		}
		// delete folder itself
		const deleteFolderRes = await markDeleteById(time, parentId);
		console.log("deleteFolderRes: ", deleteFolderRes);
		return true;
	} catch (e) {
		console.error("(fn) deleteRecur - error ", e);
		return false;
	}
};

const folderRecur = async (userId, parentId, arrNoVer, arrWithVer, currentPath) => {
	const arr = await getOneLevelChildByParentId(userId, parentId, 0);
	for (let i = 0; i < arr.length; i++) {
		if (arr[i].type === "file") {
			arrNoVer.push(`${currentPath}/${arr[i].name}`);
			const version = await getCurrentVersionByFileId(arr[i].id);
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
	const childsNoVer = [];
	const childsWithVer = [];
	await folderRecur(userId, parentId, childsNoVer, childsWithVer, path);
	console.log("getAllChildren: childsNoVer: ", childsNoVer);
	console.log("getAllChildren: childsWithVer: ", childsWithVer);
	return { childsNoVer, childsWithVer };
};

// for restoring deleted folder
const restoreRecur = async (parentId, currentPath, time, token, userId) => {
	try {
    // find deleted children
		const list = await getOneLevelChildByParentId(userId, parentId, 1);
		if (list.length > 0) {
			for (let i = 0; i < list.length; i++) {
				if (list[i].type === "file") {
					// update DB for file restore
					const restoreFileRes = await restoreDeletedFile(
						token,
						list[i].id,
						time,
						userId
					);
					console.log("restoreFileRes: ", restoreFileRes);
					// copy new version in S3
					const newRecordInS3 = await copyS3Obj(
						s3clientGeneral,
						S3_MAIN_BUCKET_NAME,
						`user_${userId}/${currentPath}/${list[i].name}.v${restoreFileRes.cur_ver}`,
						`user_${userId}/${currentPath}/${list[i].name}.v${restoreFileRes.new_ver}`
					);
					console.log("newRecordInS3: ", newRecordInS3);
				} else {
					await restoreRecur(
						list[i].id,
						`${currentPath}/${list[i].name}`,
						time,
						token,
						userId
					);
				}
			}
		}
		// update DB for folder restore
		const restoreFolderRes = await restoreDeletedFolder(token, parentId, time);
		console.log("restoreFolderRes: ", restoreFolderRes);
		return true;
	} catch (e) {
		console.error("(fn) restoreRecur - error ", e);
		return false;
	}
};

// for restoring deleted folder
const folderRecurDeleted = async (userId, parentId, currentPath, result) => {
	const arr = await getOneLevelChildByParentId(userId, parentId, 1);
	for (let i = 0; i < arr.length; i++) {
		if (arr[i].type === "file") {
			result.push(`${currentPath}/${arr[i].name}`);
		} else {
			await folderRecurDeleted(userId, arr[i].id, `${currentPath}/${arr[i].name}`,result);
		}
	}
};

// for restoring deleted folder
const getAllChildrenDeleted = async (userId, currentPath) => {
	const folders = currentPath.split("/");
	const parentId = await iterForParentId(userId, folders);
	const result = [];
	// find children where parent_id = parentId
	// if that child is "file" => return path
	// if that children is "folder" => call recur function
	await folderRecurDeleted(userId, parentId, currentPath, result);
	// console.log("result: ", result);
	return result;
};

export { deleteRecur, getAllChildren, restoreRecur, getAllChildrenDeleted };
