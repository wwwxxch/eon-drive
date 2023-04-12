import {
	getDirId,
	getFileIdNoDel,
	getOneLevelListByParentId,
} from "../../model/db_ff_r.js";
// ==========================================================================
// input: folders = folders array, e.g. ["folder1", "folder2"]
const iterForParentId = async (userId, folders) => {
	console.log("iterForParentId: folders: ", folders);
	let parentId = 0;
	for (let i = 0; i < folders.length; i++) {
		const chkDir = await getDirId(folders[i], userId, parentId);
		if (chkDir.length === 1) {
			console.log("chkDir: ", chkDir);
			parentId = chkDir[0].id;
		} else if (folders[i] === "") {
			continue;
		} else {
			console.error("(fn) iterForParentId - error");
			console.error("parentId: ", parentId, " folders[i]: ", folders[i]);
			return -1;
		}
	}
	return parentId;
};

// input: path = whole path of that file
const findFileIdByPath = async (userId, path) => {
	const parents = path.split("/");
	const child = parents.pop();
	const parentId = await iterForParentId(userId, parents);
	const [childResult] = await getFileIdNoDel(child, userId, parentId);
	console.log("childResult: ", childResult);
	return childResult.id;
};

const getFileListByPath = async (userId, path) => {
	let parentId = 0;
	if (path !== "") {
		const folders = path.split("/");
    console.log("folders: ", folders);

		for (let i = 0; i < folders.length; i++) {
			const chkDir = await getDirId(folders[i], userId, parentId);
			if (chkDir.length === 0) {
				return { data: null };
			}
			parentId = chkDir[0].id;
		}
	}
	const list = await getOneLevelListByParentId(parentId);
	return { data: list };
};

export { iterForParentId, findFileIdByPath, getFileListByPath };
