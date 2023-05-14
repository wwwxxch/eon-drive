import { getFileListByPath, findParentPathByFilesId } from "../../services/path/iter.js";

import {
	getDeletedList,
	getVersionsByFileId,
	getDeleteRecordsByFileId,
} from "../../models/db_files_read.js";
import { CustomError } from "../../utils/custom_error.js";

// ==============================================================================

// showList
// v1 note: no slash after the folder
// req.body = { "path": "test2/test2inside/folder_20230405" }
// req.body = { "path": "" }
const showList = async (req, res, next) => {
	// console.log("showList: ", req.body);
	console.log("showList: ", req.query);

	// const { path } = req.body;
	const { path } = req.query;
	const userId = req.session.user.id;

	const decodePath = decodeURI(path);
	console.log("decodePath: ", decodePath);

	const getFileListRes = await getFileListByPath(userId, decodePath);
	if (!getFileListRes.data) {
		return next(CustomError.badRequest("Invalid path"));
	}

	return res.json({ data: getFileListRes.data });
};

const showHistory = async (req, res) => {
	// console.log("showHistory: ", req.body);

	// const { fileId } = req.body;

	console.log("showHistory: ", req.query);
	const { fileId } = req.query;
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
	if (!deleted) {
		return next(CustomError.internalServerError("(fn) getDeletedList Error"));
	}

	const { all, folders } = deleted;
	const folderIdList = folders.map((item) => item.id);
	const trashList = [];
	all.forEach((item) => {
		if (!folderIdList.includes(item.parent_id)) trashList.push(item);
	});
	// console.log("trashList: ", trashList);

	for (let i = 0; i < trashList.length; i++) {
		trashList[i].parentPath = await findParentPathByFilesId(trashList[i].id);
	}

	return res.json({ data: trashList });
};

export { showList, showHistory, showTrash };
