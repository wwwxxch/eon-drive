import express from "express";
const router = express.Router();

import dotenv from "dotenv";
dotenv.config();
const {	S3_BUCKET_NAME } = process.env;

import {
  wrapAsync,
  getWholeChilds,
  deleteLocal
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
  
  const m_downloadList = req.body.downloadList.map(item => {
    return item.replace(/^\//,"").trim();
  });

  if (m_downloadList.length === 1) {
    const downloadUrl = await getDownloadUrl(
      S3_BUCKET_NAME,
      m_downloadList[0],
      60 * 5
    );
    return res.status(200).json({ downloadUrl: downloadUrl });
  }

  let parentName = "EONDrive";
  if (req.body.parentPath != "/") {
    parentName = req.body.parentPath.split("/").pop();
  } else if (req.body.downloadList.length === 1 && req.body.downloadList[0].endsWith("/")) {
    parentName = req.body.downloadList[0].split("/").pop();
  }
  console.log("parentName: ", parentName);

  const files = m_downloadList.filter(item => !item.endsWith("/"));
  const folders = m_downloadList.filter(item => item.endsWith("/"));

  console.log("files: ", files);
  console.log("folders: ", folders);

  let finalList = [];
  for (let i = 0; i < folders.length; i++) {
    const wholeChilds = await getWholeChilds(folders[i]);
    // console.log(wholeChilds);
    finalList = [...finalList, ...wholeChilds];
  }
  finalList = [...finalList, ...files];
  console.log("finalList: ", finalList);

  // connect to lambda
  const toLambda = await callLambdaZip(finalList, parentName);
  console.log("toLambda: ", toLambda.downloadUrl);

  return res.json({ downloadUrl: toLambda.downloadUrl });
});

// download testing
router.post("/download-test", async(req, res) => {
  console.log(req.body);
  
  const m_downloadList = req.body.downloadList.map(item => {
    return item.replace(/^\//,"").trim();
  });

  if (m_downloadList.length === 1) {
    const downloadUrl = await getDownloadUrl(
      S3_BUCKET_NAME,
      m_downloadList[0],
      60 * 5
    );
    return res.status(200).json({ downloadUrl: downloadUrl });
  }

  let parentName = "EONDrive";
  if (req.body.parentPath != "/") {
    parentName = req.body.parentPath.split("/").pop();
  } else if (req.body.downloadList.length === 1 && req.body.downloadList[0].endsWith("/")) {
    parentName = req.body.downloadList[0].split("/").pop();
  }
  console.log("parentName: ", parentName);

  const files = m_downloadList.filter(item => !item.endsWith("/"));
  const folders = m_downloadList.filter(item => item.endsWith("/"));

  console.log("files: ", files);
  console.log("folders: ", folders);

  let finalList = [];
  for (let i = 0; i < folders.length; i++) {
    const wholeChilds = await getWholeChilds(folders[i]);
    // console.log(wholeChilds);
    finalList = [...finalList, ...wholeChilds];
  }
  finalList = [...finalList, ...files];
  console.log("finalList: ", finalList);

  // for multiple files download
  const saveToLocal = await getObjSave(S3_BUCKET_NAME, finalList);
  console.log("saveToLocal: ", saveToLocal);
  const createZip = await zipFiles(finalList, parentName);
  console.log("createZip: ", createZip);
  const getZipUrl = await zipToS3(S3_BUCKET_NAME, parentName);
  console.log("getZipUrl: ", getZipUrl);
  
  // delete files
  deleteLocal(`./${parentName}.zip`);
  finalList.forEach( item => {
    deleteLocal(`./${item.split("/").join("_")}`);
  });

  return res.json({ downloadUrl: getZipUrl });
});

export { router as file_download };
