import express from "express";
const router = express.Router();

import dotenv from "dotenv";
dotenv.config();
const {
	S3_BUCKET_NAME
} = process.env;

import {
  deleteFolderAndContents,
  deleteObject,
} from "../util/s3_delete.js";

import {
  getDirId,
  deleteWholeFolder,
  getFileId,
  deleteById
} from "../model/db_file.js";

import {
  getFileListByPath
} from "../util/util.js";

import {
  authentication
} from "../controller/user_auth.js";
// ------------------------------------------------------------------------------------

router.post("/delete", authentication, async(req, res) => {
  console.log("/delete: ", req.body);
  const { delList } = req.body; // req.body = { "delList": ["folder/", "file.ext"] }
  const userId = req.session.user.id;

  for (let i = 0; i < delList.length; i++) {
    const key = delList[i];
    if (key.endsWith("/")) {
      await deleteFolderAndContents(S3_BUCKET_NAME, `user_${userId}/${key}`);
    } else {
      await deleteObject(S3_BUCKET_NAME, `user_${userId}/${key}`);
    }
  }

  return res.json({ msg: "deleted" });
});

router.post("/delete-metadata", authentication, async(req, res) => {
  console.log("/delete-metadata: ", req.body);
  const { delList, parentPath } = req.body; // req.body = { "delList": ["folder/", "file.ext"] }
  const userId = req.session.user.id;

  for (let i = 0; i < delList.length; i++) {
    const type = delList[i].endsWith("/") ? "folder" : "file";
    
    const parts = delList[i].split("/");
    const split = parts.filter(item => item !== "");
    console.log("split: ", split);

    const iterNum = type === "folder" ? split.length : split.length - 1;
    let parentId = 0;
    for (let j = 0; j < iterNum; j++) {
      const chkDir = await getDirId(userId ,parentId, split[j]);
      console.log("chkDir: ", chkDir);
      if (chkDir.length === 0) {
        parentId = null;
        break;
      }
      parentId = chkDir[0].id;
    }

    if (type === "folder") {
      console.log(parentId);
      if (parentId) {
        await deleteWholeFolder(userId, parentId);
      }
    } else {
      console.log(parentId, split[split.length-1]);
      const [fileId] = await getFileId(userId, parentId, split[split.length-1]);
      console.log(fileId);
      if (fileId) {
        await deleteById(userId, fileId.id);
      }
    }
  }
  // emit new file list
  const io = req.app.get("socketio");
  const refresh = await getFileListByPath(userId, parentPath);
  // console.log("refresh: ", refresh);
  io.emit("listupd", {
    parentPath: parentPath,
    list: refresh
  }); 
  return res.json({ msg: "metadata deleted" });
});

export { router as file_delete };
