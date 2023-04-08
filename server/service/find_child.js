import { 
  getDirId,
  getFileList 
} from "../model/db_file.js";

// ==========================================================================
const iterPath = async (userId, path) => {
  const split = path.split("/");
  let parentId = 0;
  for (let i = 0; i < split.length; i++) {
    const chkDir = await getDirId(userId, parentId, split[i]);
    if (chkDir.length > 0) {
      parentId = chkDir[0].id;
    }
  }
  // console.log(parentId);
  return parentId;
};

const recur = async (userId, parentId, result, currentpath) => {
  const arr = await getFileList(userId, parentId);
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].type === "file") {
      result.push(`${currentpath}${arr[i].name}`);
    } else {
      await recur(userId, arr[i].id, result, currentpath + arr[i].name);
    }
  }
};

const getWholeChilds = async (userId, path) => {
  console.log("getWholeChilds: path: ", path);
  const result = [];
  const parentId = await iterPath(userId, path);
  let currentpath = path;

  await recur(userId, parentId, result, currentpath);
  // console.log("result: ", result);
  return result;
};

export { getWholeChilds };
