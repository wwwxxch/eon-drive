import express from "express";
const router = express.Router();

import {
  wrapAsync
} from "../util/util.js";

import {
  getDirId,
  getFileList
} from "../model/db_file.js";

// ------------------------------------------------------------------------------------
router.get("/v1/list", async(req, res) => {
  const dirId = req.query.dirId === undefined ? 0 : Number(req.query.dirId);
  if (!Number.isInteger(dirId) || dirId < 0) {
    return res.status(400).json({ msg: "Wrong query parameter" });
  }

  const list = await getFileList(dirId);
  console.log(list);
  
  return res.json({ data: list });
});

router.post("/v2/list", async(req, res) => {
  console.log(req.body); 
  // req.body = { "path": "/a/ooo/xxx" }
  // req.body = { "path": "/" }

  const folders = req.body.path.split("/");
  console.log("folders: ", folders);
  
  // get the correct parentId
  let parentId = 0; // start from 0
  for (let i = 0; i < folders.length; i++) {
    const chkDir = await getDirId(parentId, folders[i]);
    // console.log(folders[i]);
    // console.log(chkDir);
    parentId = chkDir.length === 0 ? 0 : chkDir[0].id;
  }

  const list = await getFileList(parentId);
  
  return res.json({ data: list });
});

export { router as file_list };
