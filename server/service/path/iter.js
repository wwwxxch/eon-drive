import {
	getFolderId,
  getNoDelFileId,
  getIsDelFileId,
  getOneLevelChildByParentId,
  getParentInfoByFFId
} from "../../model/db_ff_r.js";
// ==========================================================================
// input: folders = folders array, e.g. ["folder1", "folder2"]
const iterForParentId = async (userId, folders) => {
	console.log("iterForParentId: folders: ", folders);
	let parentId = 0;
  if (folders.length !== 1 || folders[0] !== "") {
    for (let i = 0; i < folders.length; i++) {
      const chkDir = await getFolderId( userId, parentId, folders[i]);
      console.log("chkDir: ", chkDir);
      if (chkDir.length === 1) {
        parentId = chkDir[0].id;
      } else if (folders[i] === "") {
        continue;
      } else {
        console.error("(fn) iterForParentId - error");
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
	const parentId = await iterForParentId(userId, parents);
	const [childResult] = await getNoDelFileId(userId, parentId, child);
	console.log("findFileIdByPath: childResult: ", childResult);
	return childResult.id;
};

const findDeletedFileIdByPath = async (userId, path) => {
  const parents = path.split("/");
	const child = parents.pop();
	const parentId = await iterForParentId(userId, parents);
	const [childResult] = await getIsDelFileId(userId, parentId, child);
	console.log("findDeletedFileIdByPath: childResult: ", childResult);
	return childResult.id;
};

const getFileListByPath = async (userId, path) => {
	let parentId = 0;
	if (path !== "") {
		const folders = path.split("/");
		console.log("folders: ", folders);

		for (let i = 0; i < folders.length; i++) {
			const chkDir = await getFolderId(userId, parentId, folders[i]);
			if (chkDir.length === 0) {
				return { data: null };
			}
			parentId = chkDir[0].id;
		}
	}
	const list = await getOneLevelChildByParentId(userId, parentId, 0);
	return { data: list };
};

const findParentPathByFFId = async (ffId) => {
	let arr = [];
	let obj = await getParentInfoByFFId(ffId);
	// console.log("obj.parent_id: ", obj.parent_id);
	// console.log("obj.parent_name: ", obj.parent_name);
	arr.push(obj.parent_name);
	while (obj.parent_id !== 0) {
		obj = await getParentInfoByFFId(obj.parent_id);
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
  findDeletedFileIdByPath,
	getFileListByPath,
	findParentPathByFFId,
};
