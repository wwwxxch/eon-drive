import express from "express";
const router = express.Router();

import dotenv from "dotenv";
dotenv.config();
const {
	S3_BUCKET_NAME,
	S3_BUCKET_REGION,
	S3_ACCESS_KEY_ID,
	S3_SECRET_ACCESS_KEY,
} = process.env;

import {
  wrapAsync
} from "../util/util.js";

import { 
  getSingleSignedUrl,
  getCompleteUrl,
  getPartUrl
} from "../util/s3_upload.js";

import {
  saveMetadata,
  updMetadata,
  getDirId,
  getFileId
} from "../model/db_file.js";
// ========================================
// AWS SDK
import { 
  S3Client, 
  CreateMultipartUploadCommand,
} from "@aws-sdk/client-s3";

const config = {
	credentials: {
		accessKeyId: S3_ACCESS_KEY_ID,
		secretAccessKey: S3_SECRET_ACCESS_KEY,
	},
	region: S3_BUCKET_REGION,
};

const client = new S3Client(config);
// ------------------------------------------------------------------------------------
router.post("/upload-metadata", async(req, res) => {
  console.log(req.body);
  const { filename, filesize, filerelpath } = req.body;

  // Parse the filerelpath to get the parent directory name and the file name
  const parts = filerelpath.split("/");
  const filenameOnly = parts.pop();

  let parentId = 0;
  if (parts.length > 0) {
    for (let i = 0; i < parts.length; i++) {
      console.log(parts[i]);
      const chkDir = await getDirId(parentId, parts[i]);
      if (chkDir.length === 0) {
        const toDBFolder = await saveMetadata(parentId, parts[i], "folder", null);
        parentId = toDBFolder.insertId; 
      } else {
        parentId = chkDir[0].id;
      } 
    }
  }
  const chkFileId = await getFileId(parentId, filename);
  if (chkFileId.length === 0) {
    const toDBFile = await saveMetadata(parentId, filename, "file", filesize);
    console.log(toDBFile);
    if (toDBFile.affectedRows !== 1) {
      return res.status(500).json({ msg: "Something Wrong" });
    }
  } else {
    const updDBFile = await updMetadata(parentId, filename, "file", filesize);
    console.log(updDBFile);
    if (updDBFile.affectedRows !== 1) {
      return res.status(500).json({ msg: "Something Wrong" });
    }
  }
  
  return res.json({ msg: "metadata save to DB" });
});

router.post("/single-upload",async(req, res) => {
  console.log(req.body);
  // const { filename, filesize, filetype, filerelpath } = req.body;

  if (!req.body.filename) {
    return res.status(400).json({ msg: "No file" });
  }

  if (req.body.filerelpath) {
    req.body.filename = req.body.filerelpath;
  }

  const singleUrl = await getSingleSignedUrl(S3_BUCKET_NAME, req.body.filename, 3600);

  return res.status(200).json({ singleUrl });
});

router.post("/multi-upload", wrapAsync(async(req, res) => {
  console.log(req.body);
  const { count } = req.body;
  
  if (!req.body.filename) {
    return res.status(400).json({ msg: "No file" });
  }

  if (req.body.filerelpath) {
    req.body.filename = req.body.filerelpath;
  }

  const cmdCreate = new CreateMultipartUploadCommand({
    Bucket: S3_BUCKET_NAME,
    Key: req.body.filename
  });

  const createMultiUpload = await client.send(cmdCreate);

  const { Key, UploadId } = createMultiUpload;
  const completeUrl = await getCompleteUrl(S3_BUCKET_NAME, Key, UploadId, 3600);
  const partUrls = await Promise.all(
    Array.from({ length: count }, (v, k) => k + 1)
      .map(item => getPartUrl(S3_BUCKET_NAME, Key, UploadId, item, 3600))
  );
  
  return res.json({
    partUrls: partUrls,
    completeUrl: completeUrl,
  });
  
}));


export { router as file_upload };
