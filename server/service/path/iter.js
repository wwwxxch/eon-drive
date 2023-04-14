import {
	getDirId,
	getFileIdNoDel,
	getOneLevelListByParentId,
	getParentIdAndNameByFFId,
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
	console.log("findFileIdByPath: childResult: ", childResult);
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

const findParentPathByFFId = async (ffId) => {
	let arr = [];
	let obj = await getParentIdAndNameByFFId(ffId);
	// console.log("obj.parent_id: ", obj.parent_id);
	// console.log("obj.parent_name: ", obj.parent_name);
	arr.push(obj.parent_name);
	while (obj.parent_id !== 0) {
		obj = await getParentIdAndNameByFFId(obj.parent_id);
		// console.log("obj.parent_id: ", obj.parent_id);
		// console.log("obj.parent_name: ", obj.parent_name);
		if (obj.parent_id !== 0) {
			arr.push(obj.parent_name);
		}
	}

	const parentPath = "Home/" + arr.reverse().join("/");
	// console.log(parentPath);
	return parentPath;
};

export {
	iterForParentId,
	findFileIdByPath,
	getFileListByPath,
	findParentPathByFFId,
};