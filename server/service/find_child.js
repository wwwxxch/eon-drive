import { 
  getDirId,
  getFileId,
  getFileList,
  getOneLevelChild,
  deleteById
} from "../model/db_file.js";

// ==========================================================================
/**
 * find the id of the last folder by a folder array (after split("/"))
 * @param {number} userId 
 * @param {Object} folders array of folders: ["folder1", "folder2"] 
 * @returns {Promise} Promise object represents -1 (error) or id of the last folder
 */
const iterForParentId = async(userId, folders) => {
  let parentId = 0;
  for (let i = 0; i < folders.length; i++) {
    const chkDir = await getDirId(userId, parentId, folders[i]);
    if (chkDir.length === 1) {
      parentId = chkDir[0].id;
    } else {
      console.error("(fn) iterForParentId - error");
      console.error("parentId: ", parentId, " folders[i]: ", folders[i]);
      return -1;
    }
  }
  return parentId;
};

/**
 * find the id of the file by complete path
 * @param {number} userId 
 * @param {string} path "test1/folderintest1/customerchat-0.0.1-swagger.yaml"
 * @returns {Promise} Promise object represents file id
 */
const findFileIdByPath = async(userId, path) => {
  const parent = path.split("/");
  const child = parent.pop();
  const parentId = await iterForParentId(userId, parent);
  const [childId] = await getFileId(userId, parentId, child);

  return childId.id;
};
/**
 * delete all files and folders under giving parentId
 * @param {number} userId 
 * @param {number} parentId 
 */
const deleteRecur = async (userId, parentId) => {
  try {
    const list = await getOneLevelChild(userId, parentId);
    for (let i = 0; i < list.length; i++) {
      if (list[i].type === "file") {
        const deleteRes = await deleteById(userId, list[i].id);
        console.log("deleteRes: ", deleteRes);
      } else {
        await deleteRecur(userId, list[i].id);
      }
    }
    // delete folder itself
    await deleteById(userId, parentId);
    return true;
  } catch (e) {
    console.error ("(fn) deleteRecur - error ", e);
    return false;
  }
};

const iterPath = async (userId, path) => {
  const split = path.split("/");
  let parentId = 0;
  for (let i = 0; i < split.length; i++) {
    const chkDir = await getDirId(userId, parentId, split[i]);
    if (chkDir.length > 0) {
      parentId = chkDir[0].id;
    } else {
      console.error("iterPath: something wrong");
      console.error("parentId: ", parentId, " split[i]: ", split[i]);
      return false;
    }
  }
  // console.log(parentId);
  return parentId;
};

const recur = async (userId, parentId, result, currentpath) => {
  const arr = await getFileList(userId, parentId);
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].type === "file") {
      result.push(`${currentpath}/${arr[i].name}`);
    } else {
      await recur(userId, arr[i].id, result, currentpath + "/" + arr[i].name);
    }
  }
};

// input path should be "test1/folderintest1/level2", not ending with "/"
const getWholeChilds = async (userId, path) => {
  console.log("getWholeChilds: path: ", path);
  const result = [];
  const parentId = await iterPath(userId, path);
  let currentpath = path;

  await recur(userId, parentId, result, currentpath);
  // console.log("result: ", result);
  return result;
};

export { iterForParentId, findFileIdByPath, getWholeChilds, iterPath, deleteRecur };
