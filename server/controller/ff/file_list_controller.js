import { getFileListByPath, findParentPathByFFId } from "../../service/path/iter.js";

import {
	getDeletedList,
	getVersionsByFileId,
	getDeleteRecordsByFileId,
} from "../../model/db_ff_r.js";
import { customError } from "../../error/custom_error.js";

// ==============================================================================
const showList = async (req, res, next) => {
	console.log("showList: ", req.body);

	// note: no slash after the folder
	// req.body = { "path": "test2/test2inside/folder_20230405" }
	// req.body = { "path": "" }
	const { path } = req.body;
	const userId = req.session.user.id;

	const decodePath = decodeURI(path);
	console.log("doecodePath: ", decodePath);

	const getFileListRes = await getFileListByPath(userId, decodePath);
	if (!getFileListRes.data) {
		return next(customError.badRequest("Invalid path"));
	}

	return res.json({ data: getFileListRes.data });
};

const showHistory = async (req, res) => {
	console.log("showHistory: ", req.body);

	const { fileId } = req.body;
	const userId = req.session.user.id;

	const versions = await getVersionsByFileId(userId, fileId);
	// console.log("versions", versions);

	const deleteRecords = await getDeleteRecordsByFileId(userId, fileId);
	// console.log("deleteRecords: ", deleteRecords);

	// versions & deleteRecords will be [] if no matched
	return res.json({ versions, deleteRecords });
};

const showTrash = async (req, res, next) => {
	console.log("showTrash");

	const userId = req.session.user.id;
	const deleted = await getDeletedList(userId);
	// console.log("deleted: ", deleted);
	if (!deleted) {
		return next(customError.internalServerError());
	}

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

	return res.json({ data: trashList });
};

export { showList, showHistory, showTrash };
