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
  listObjectsUnderFolder
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
// ------------------------------------------------------------------------------------

// For Testing
router.post("/list-in-folder", async(req, res) => {
  const { folder } = req.body; // req.body = { "folder": "example/" }

  const awsRes = await listObjectsUnderFolder(S3_BUCKET_NAME, folder);
  console.log(awsRes);

  return res.json({ msg: "/list-in-folder" });
});


router.post("/delete", async(req, res) => {
  console.log(req.body);
  const { delList } = req.body; // req.body = { "delList": ["folder/", "file.ext"] }

  for (let i = 0; i < delList.length; i++) {
    const key = delList[i];
    if (key.endsWith("/")) {
      await deleteFolderAndContents(S3_BUCKET_NAME, key);
    } else {
      await deleteObject(S3_BUCKET_NAME, key);
    }
  }

  return res.json({ msg: "/delete" });
});

router.post("/delete-metadata", async(req, res) => {
  console.log("/delete-metadata: ", req.body);
  const { delList, parentPath } = req.body; // req.body = { "delList": ["folder/", "file.ext"] }
  for (let i = 0; i < delList.length; i++) {
    const type = delList[i].endsWith("/") ? "folder" : "file";
    
    const parts = delList[i].split("/");
    const split = parts.filter(item => item !== "");
    console.log("split: ", split);

    const iterNum = type === "folder" ? split.length : split.length - 1;
    let parentId = 0;
    for (let j = 0; j < iterNum; j++) {
      const chkDir = await getDirId(parentId, split[j]);
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
        await deleteWholeFolder(parentId);
      }
    } else {
      console.log(parentId, split[split.length-1]);
      const [fileId] = await getFileId(parentId, split[split.length-1]);
      console.log(fileId);
      if (fileId) {
        await deleteById(fileId.id);
      }
    }
  }
  // emit new file list
  const io = req.app.get("socketio");
  const refresh = await getFileListByPath(parentPath);
  // console.log("refresh: ", refresh);
  io.emit("listupd", {
    parentPath: parentPath,
    list: refresh
  }); 
  return res.json({ msg: "/delete-metadata" });
});

export { router as file_delete };
