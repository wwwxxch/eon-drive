import { 
  getDirId,
  getFileList 
} from "../model/db_file.js";

import fs from "fs";
//==============================================================================
const wrapAsync = (fn) => {
  // reference: https://thecodebarbarian.com/80-20-guide-to-express-error-handling
  // Make sure to `.catch()` any errors and pass them along to the `next()`
  // middleware in the chain, in this case the error handler.
  return function (req, res, next) {
    fn(req, res, next).catch(next);
  };
};

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

const getFileListByPath = async (userId, path) => {
  let parentId = 0;
  if (path !== "") {
    const folders = path.split("/");
    for (let i = 0; i < folders.length; i++) {
      const chkDir = await getDirId(userId, parentId, folders[i]);
      if (chkDir.length === 0) {
        return { data: null };
      }
      parentId = chkDir[0].id;
    }
  }
  const list = await getFileList(userId, parentId);
  return { data: list };
};

const deleteLocal = async (localPath) => {
  try {
    await fs.promises.access(localPath, fs.constants.F_OK);
    await fs.promises.unlink(localPath);
    console.log(localPath + " has been deleted");
  } catch (err) {
    console.log(localPath + " is not exsited");
  }
};

export {
  wrapAsync,
  getWholeChilds,
  deleteLocal,
  getFileListByPath
};
