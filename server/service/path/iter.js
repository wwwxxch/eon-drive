import {
	getFolderId,
	getNoDelFileId,
	getIsDelFileId,
	getOneLevelChildByParentId,
	getParentInfoByFFId,
	getFoldersInfoByPath,
} from "../../model/db_ff_r.js";
// ==========================================================================
// input: folders = folders array, e.g. ["folder1", "folder2"]
const iterForParentId = async (userId, folders) => {
	console.log("iterForParentId: folders: ", folders);
	let parentId = 0;
	if (folders.length !== 1 || folders[0] !== "") {
		for (let i = 0; i < folders.length; i++) {
			const chkDir = await getFolderId(userId, parentId, folders[i]);
			console.log("chkDir: ", chkDir);
			if (chkDir.length === 1) {
				parentId = chkDir[0].id;
			} else if (folders[i] === "") {
				continue;
			} else {
				console.error("iterForParentId - error");
				console.error("parentId: ", parentId, " folders[i]: ", folders[i]);
				return -1;
			}
		}
	}
	return parentId;
};

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

const findParentPathByFFId = async (ffId) => {
	try {
		let arr = [];
		let obj = await getParentInfoByFFId(ffId);
		if (!obj) {
			throw new Error("getParentInfoByFFId error");
		}
		// console.log("obj.parent_id: ", obj.parent_id);
		// console.log("obj.parent_name: ", obj.parent_name);
		arr.push(obj.parent_name);
		while (obj.parent_id !== 0) {
			obj = await getParentInfoByFFId(obj.parent_id);
			if (!obj) {
				throw new Error("getParentInfoByFFId error");
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
		// console.log("findParentPathByFFId - return value:", parentPath);
		return parentPath;
	} catch (e) {
		console.error("findParentPathByFFId: ", e);
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

		const foldersPool = await getFoldersInfoByPath(
			folders,
			userId /*, delete_status*/
		);
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
				if (
					folders[i] === foldersPool[j].name &&
					parentId === foldersPool[j].parent_id
				) {
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
	iterForParentId,
	findFileIdByPath,
	findDeletedFileIdByPath,
	getFileListByPath,
	findParentPathByFFId,
	findTargetFolderId,
};
