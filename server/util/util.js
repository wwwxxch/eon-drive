import { 
  getDirId,
  getFileList 
} from "../model/db_file.js";

import fs from "fs";
//==============================================================================

// reference: https://thecodebarbarian.com/80-20-guide-to-express-error-handling
const wrapAsync = (fn) => {
  return function (req, res, next) {
    // Make sure to `.catch()` any errors and pass them along to the `next()`
    // middleware in the chain, in this case the error handler.
    fn(req, res, next).catch(next);
  };
};

const iterPath = async (path) => {
  const split = path.split("/");
  let parentId = 0;
  for (let i = 0; i < split.length; i++) {
    const chkDir = await getDirId(parentId, split[i]);
    if (chkDir.length > 0) {
      parentId = chkDir[0].id;
    }
  }
  // console.log(parentId);
  return parentId;
}

const recur = async (parentId, result, currentpath) => {
  const arr = await getFileList(parentId);
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].type === "file") {
      result.push(`${currentpath}${arr[i].name}`);
    } else {
      await recur(arr[i].id, result, currentpath + arr[i].name);
    }
  }
}

const getWholeChilds = async (path) => {
  const result = [];
  const parentId = await iterPath(path);
  let currentpath = path;

  await recur(parentId, result, currentpath);
  // console.log("result: ", result);
  return result;
}

const deleteLocal = async (path) => {
  try {
    await fs.promises.access(path, fs.constants.F_OK);
    await fs.promises.unlink(path);
    console.log(path + " has been deleted");
  } catch (err) {
    console.log(path + " is not exsited");
  }
}

export {
  wrapAsync,
  getWholeChilds,
  deleteLocal
};
