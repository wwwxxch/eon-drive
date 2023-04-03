import express from "express";
const router = express.Router();

import dotenv from "dotenv";
dotenv.config();
const {	S3_BUCKET_NAME } = process.env;

import {
  wrapAsync
} from "../util/util.js";

import {
  getDownloadUrl,
  getObjSave,
  zipFiles,
  zipToS3
} from "../util/s3_download.js";

import {
  callLambdaZip
} from "../util/lambda_invoke.js";

// ------------------------------------------------------------------------------------
router.post("/single-download", async(req, res) => {
  console.log(req.body);

	const downloadUrl = await getDownloadUrl(
		S3_BUCKET_NAME,
		req.body.downloadList[0],
		60 * 5
	);

	return res.status(200).json({ downloadUrl });
});

router.post("/download", async(req, res) => {
  console.log(req.body);
  
  if (req.body.downloadList.length > 1) {
    const toLambda = await callLambdaZip(req.body.downloadList);
    console.log(toLambda);
  }
  
  return res.json({ msg: "post /download" });
});

router.post("/download-test", async(req, res) => {
  console.log(req.body);
  let parentName = "EONDrive";
  if (req.body.parentPath != "/") {
    parentName = req.body.parentPath.split("/").pop();
  }

  const saveToLocal = await getObjSave(S3_BUCKET_NAME, req.body.downloadList);
  console.log("saveToLocal: ", saveToLocal);
  const createZip = await zipFiles(req.body.downloadList, parentName);
  console.log("createZip: ", createZip);
  const getZipUrl = await zipToS3(S3_BUCKET_NAME, parentName);
  console.log("getZipUrl: ", getZipUrl);

  return res.json({ downloadUrl: getZipUrl });
});

export { router as file_download };
