import {
	getOneLevelChildByParentId,
	getOneLevelListByParentId,
	getCurrentVersionByFileId,
} from "../../model/db_ff_r.js";

import { markDeleteById } from "../../model/db_ff_d.js";

import { iterForParentId } from "./iter.js";
// ========================================================================================
const deleteRecur = async (parentId, userId, time) => {
	try {
		const list = await getOneLevelChildByParentId(parentId);
		if (list.length > 0) {
			for (let i = 0; i < list.length; i++) {
				if (list[i].type === "file") {
					const deleteFileRes = await markDeleteById(time, list[i].id);
					console.log("deleteFileRes: ", deleteFileRes);
				} else {
					await deleteRecur(list[i].id);
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

const folderRecur = async (parentId, arrNoVer, arrWithVer, currentPath) => {
	const arr = await getOneLevelListByParentId(parentId);
	for (let i = 0; i < arr.length; i++) {
		if (arr[i].type === "file") {
			arrNoVer.push(`${currentPath}/${arr[i].name}`);
			const version = await getCurrentVersionByFileId(arr[i].id);
			arrWithVer.push(`${currentPath}/${arr[i].name}.v${version}`);
		} else {
			await folderRecur(
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
	await folderRecur(parentId, childsNoVer, childsWithVer, path);
  console.log("getAllChildren: childsNoVer: ", childsNoVer);
  console.log("getAllChildren: childsWithVer: ", childsWithVer);
	return { childsNoVer, childsWithVer };
};

export { deleteRecur, getAllChildren };
