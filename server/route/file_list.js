import express from "express";
const router = express.Router();

import {
  wrapAsync
} from "../util/util.js";

import {
  getDirId,
  getFileList
} from "../model/db_file.js";

import {
  authentication
} from "../controller/user_auth.js";

// ------------------------------------------------------------------------------------
router.post("/show-list", authentication, async(req, res) => {
  console.log(req.body);
  console.log("req.session: ", req.session); 
  // req.body = { "path": "test2/test2inside/folder_20230405" }
  // req.body = { "path": "" }
  const userId = req.session.user.id;

  let parentId = 0; // start from 0
  if (req.body.path !== "") {
    const folders = req.body.path.split("/");
    console.log("folders: ", folders);
    
    // get the correct parentId
    for (let i = 0; i < folders.length; i++) {
      const chkDir = await getDirId(userId, parentId, folders[i]);
      // console.log(folders[i]);
      // console.log(chkDir);
      if (chkDir.length === 0) {
        return res.status(400).json({ msg: "error" });
      }
      parentId = chkDir[0].id;
    }
  }
  const list = await getFileList(userId, parentId);
  return res.json({ data: list });
});

export { router as file_list };
