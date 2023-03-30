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
router.post("/single-upload", wrapAsync(async(req, res) => {
  console.log(req.body);

  if (!req.body.filename) {
    return res.status(400).json({ msg: "No file" });
  }

  const singleUrl = await getSingleSignedUrl(S3_BUCKET_NAME, req.body.filename, 3600);
  return res.status(200).json({ singleUrl });
}));

router.get("/multi-upload", wrapAsync(async(req, res) => {
  const { filename, count } = req.query;
  
  const cmdCreate = new CreateMultipartUploadCommand({
    Bucket: S3_BUCKET_NAME,
    Key: filename
  });

  const createMultiUpload = await client.send(cmdCreate);

  const { Key, UploadId } = createMultiUpload;
  const completeUrl = await getCompleteUrl(S3_BUCKET_NAME, Key, UploadId, 3600);
  const partUrls = await Promise.all(
    Array.from({ length: count }, (v, k) => k + 1)
      .map(item => getPartUrl(S3_BUCKET_NAME, Key, UploadId, item, 3600))
  );

  return res.json({
    partUrlsArr: partUrls,
    completeUrl: completeUrl,
  });
  
}));

// router.post("/upload", async(req, res) => {

// });

// router.get("/download", async(req, res) => {

// });

// router.delete("/delete", async(req, res) => {

// });

export { router as file_route };