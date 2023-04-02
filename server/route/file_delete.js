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

export { router as file_delete };
