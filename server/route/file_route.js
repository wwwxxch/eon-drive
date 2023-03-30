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
} from "../util/s3.js";

import {
  saveFileInfo
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
router.post("/single-upload",async(req, res) => {
  console.log(req.body);
  // const { filename, filesize, filetype, filerelpath } = req.body;

  if (!req.body.filename) {
    return res.status(400).json({ msg: "No file" });
  }

  if (req.body.filerelpath) {
    req.body.filename = req.body.filerelpath;
  }

  const info = [
    (req.body.filerelpath.match(/\//g)||[]).length,
    req.body.filename,
    req.body.filesize,
    req.body.filetype
  ];

  const singleUrl = await getSingleSignedUrl(S3_BUCKET_NAME, req.body.filename, 3600);
  const saveFile = await saveFileInfo(info);

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

  const info = [
    (req.body.filerelpath.match(/\//g)||[]).length,
    req.body.filename,
    req.body.filesize,
    req.body.filetype
  ];

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

  const saveFile = await saveFileInfo(info);  

  return res.json({
    partUrls: partUrls,
    completeUrl: completeUrl,
  });
  
}));

router.get("/list", async(req, res) => {
  const level = req.query.level === undefined ? 0 : Number(req.query.level);
  if (!Number.isInteger(level) || level < 0) {
    return res.status(400).json({ msg: "Invalid Level" });
  }

  
  
});

// router.post("/upload", async(req, res) => {

// });

// router.get("/download", async(req, res) => {

// });

// router.delete("/delete", async(req, res) => {

// });

export { router as file_route };