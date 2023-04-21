import { getFileListByPath, findParentPathByFFId } from "../path/iter.js";
import {
	getDeletedList,
	getVersionsByFileId,
	getDeleteRecordsByFileId,
} from "../../model/db_ff_r.js";
// =============================================================================
const emitNewList = async (io, userId, parentPath) => {
	const refresh = await getFileListByPath(userId, parentPath);
	// console.log("refresh: ", refresh);

	io.to(`user_${userId}`).emit("listupd", {
		parentPath: parentPath,
		list: refresh,
	});
};

const emitHistoryList = async (io, userId, fileId) => {
	const versions = await getVersionsByFileId(fileId);
	console.log("versions", versions);

	const deleteRecords = await getDeleteRecordsByFileId(fileId);
	console.log("deleteRecords: ", deleteRecords);

	io.to(`user_${userId}`).emit("historyupd", {
    fileId,
		versions,
		deleteRecords,
	});
};

const emitTrashList = async (io, userId) => {
	const deleted = await getDeletedList(userId);
	// console.log("deleted: ", deleted);

	const { all, folders } = deleted;
	const folderIdList = folders.map((item) => item.id);
	const trashList = [];
	all.forEach((item) => {
		if (!folderIdList.includes(item.parent_id)) trashList.push(item);
	});
	// console.log("trashList: ", trashList);

	for (let i = 0; i < trashList.length; i++) {
		const parentPath = await findParentPathByFFId(trashList[i].id);
		trashList[i].parentPath = parentPath;
	}

	io.to(`user_${userId}`).emit("trashupd", {
		list: trashList,
	});
};

export { emitNewList, emitHistoryList, emitTrashList };
