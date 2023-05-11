import {
	getNoDelFileId,
	getIsDelFileId,
	getOneLevelChildByParentId,
	getParentInfoByFilesId,
	getFoldersInfoByPath,
} from "../../model/db_files_read.js";
// ==========================================================================
// input: path = whole path of that file
const findFileIdByPath = async (userId, path) => {
	const parents = path.split("/");
	const child = parents.pop();
	console.log("parents: ", parents);
	console.log("child: ", child);

	const parentId = await findTargetFolderId(userId, parents);
	if (parentId === -1) {
		return -1;
	}

	const [childResult] = await getNoDelFileId(userId, parentId, child);
	console.log("findFileIdByPath: childResult: ", childResult);
	if (!childResult) {
		return -1;
	}
	return childResult.id;
};

const findDeletedFileIdByPath = async (userId, path) => {
	const parents = path.split("/");
	const child = parents.pop();

	const parentId = await findTargetFolderId(userId, parents);
	if (parentId === -1) {
		return -1;
	}
	const [childResult] = await getIsDelFileId(userId, parentId, child);
	console.log("findDeletedFileIdByPath: childResult: ", childResult);
	if (!childResult) {
		return -1;
	}
	return childResult.id;
};

const getFileListByPath = async (userId, path) => {
	let parentId = 0;
	if (path !== "") {
		const folders = path.split("/");
		console.log("folders: ", folders);

		parentId = await findTargetFolderId(userId, folders);
		if (parentId === -1) {
			return { data: null };
		}
	}
	const list = await getOneLevelChildByParentId(userId, parentId, 0);
	return { data: list };
};

const findParentPathByFilesId = async (filesId) => {
	try {
		let arr = [];
		let obj = await getParentInfoByFilesId(filesId);
		if (!obj) {
			throw new Error("getParentInfoByFilesId error");
		}
		// console.log("obj.parent_id: ", obj.parent_id);
		// console.log("obj.parent_name: ", obj.parent_name);
		arr.push(obj.parent_name);
		while (obj.parent_id !== 0) {
			obj = await getParentInfoByFilesId(obj.parent_id);
			if (!obj) {
				throw new Error("getParentInfoByFilesId error");
			}
			// console.log("obj.parent_id: ", obj.parent_id);
			// console.log("obj.parent_name: ", obj.parent_name);
			if (obj.parent_id !== 0) {
				arr.push(obj.parent_name);
			}
		}
		let parentPath;
		if (arr.length === 1 && arr[0] === null) {
			parentPath = "Home/";
		} else {
			parentPath = "Home/" + arr.reverse().join("/") + "/";
		}
		// console.log("findParentPathByFilesId - return value:", parentPath);
		return parentPath;
	} catch (e) {
		console.error("findParentPathByFilesId: ", e);
		return null;
	}
};

const findTargetFolderId = async (userId, folders /*, delete_status*/) => {
	// sprint 5
	try {
		let parentId = 0;
		if (folders.length === 0 || (folders.length === 1 && folders[0] === "")) {
			return parentId;
		}

		const foldersPool = await getFoldersInfoByPath(folders, userId /*, delete_status*/);
		console.log("findTargetFolderId: foldersPool: ", foldersPool);
		if (foldersPool.length === 0) {
			return -1;
		} else if (!foldersPool) {
			throw new Error("getFoldersInfoByPath error");
		}
		console.log("folders: ", folders);
		for (let i = 0; i < folders.length; i++) {
			let found = false;
			for (let j = 0; j < foldersPool.length; j++) {
				if (folders[i] === foldersPool[j].name && parentId === foldersPool[j].parent_id) {
					parentId = foldersPool[j].id;
					found = true;
					break;
				}
			}
			if (!found) {
				return -1;
			}
		}
		return parentId;
	} catch (e) {
		console.error("findTargetFolderId: ", e);
		return -1;
	}
};

export {
	findFileIdByPath,
	findDeletedFileIdByPath,
	getFileListByPath,
	findParentPathByFilesId,
	findTargetFolderId,
};
