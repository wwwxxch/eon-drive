import express from "express";
const router = express.Router();

import dotenv from "dotenv";
dotenv.config();
const {	S3_BUCKET_NAME } = process.env;

import {
  authentication
} from "../controller/user_auth.js";

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
router.post("/download", authentication, async(req, res) => {
  console.log("/download: ", req.body);
  const { downloadList, parentPath } = req.body;
  const userId = req.session.user.id;
  
  if (!downloadList || downloadList.length === 0) {
    return res.status(400).json({ err: "error" });
  }

  // remove fist slash
  const m_downloadList = downloadList.map(item => {
    return item.replace(/^\//,"").trim();
  });
  console.log("m_downloadList: ", m_downloadList);

  // Single file -> get presigned URL from S3 directly
  if (m_downloadList.length === 1 && !m_downloadList[0].endsWith("/") ) {
    const downloadUrl = await getDownloadUrl(
      S3_BUCKET_NAME,
      `user_${userId}/${m_downloadList[0]}`,
      60 * 5
    );
    return res.json({ downloadUrl: downloadUrl });
  }

  // Multiple files -> connect to lambda
  // 如果想要下載的檔案在第一層目錄底下，req.body.parentPath 會是 "/", 壓縮檔名會是EONDrive
  // 如果想要下載單一個資料夾，壓縮檔名會是該資料夾的名稱
  // 如果想要下載的檔案在第二層或更深層的目錄底下，並且不只一個檔案或資料夾要下載，壓縮檔名會是該層目錄名稱
  let parentName = "EONDrive";
  if (m_downloadList.length === 1 && m_downloadList[0].endsWith("/")) {
    // parentName = m_downloadList[0].split("/").slice(-2,-1).pop();
    parentName = m_downloadList[0].split("/")[m_downloadList[0].split("/").length-2];
  } else if (parentPath != "/") {
    parentName = parentPath.split("/").pop();
  } 
  console.log("parentName: ", parentName);

  const files = m_downloadList.filter(item => !item.endsWith("/"));
  const folders = m_downloadList.filter(item => item.endsWith("/"));

  console.log("files: ", files);
  console.log("folders: ", folders);

  let finalList = [];
  for (let i = 0; i < folders.length; i++) {
    const wholeChilds = await getWholeChilds(userId, folders[i]);
    finalList = [...finalList, ...wholeChilds];
  }
  finalList = [...finalList, ...files];
  console.log("finalList: ", finalList);

  const s3finalList = finalList.map(item => `user_${userId}/${item}`);
  const toLambda = await callLambdaZip(s3finalList, parentName);
  console.log("toLambda: ", toLambda.downloadUrl);

  return res.json({ downloadUrl: toLambda.downloadUrl });
});

// download testing
router.post("/download-test", authentication, async(req, res) => {
  console.log("/download: ", req.body);
  const { downloadList, parentPath } = req.body;
  const userId = req.session.user.id;
  
  if (!downloadList || downloadList.length === 0) {
    return res.status(400).json({ err: "error" });
  }

  // remove fist slash
  const m_downloadList = downloadList.map(item => {
    return item.replace(/^\//,"").trim();
  });
  console.log("m_downloadList: ", m_downloadList);

  // Single file -> get presigned URL from S3 directly
  if (m_downloadList.length === 1 && !m_downloadList[0].endsWith("/") ) {
    const downloadUrl = await getDownloadUrl(
      S3_BUCKET_NAME,
      `user_${userId}/${m_downloadList[0]}`,
      60 * 5
    );
    return res.json({ downloadUrl: downloadUrl });
  }

  // Multiple files
  // 如果想要下載的檔案在第一層目錄底下，req.body.parentPath 會是 "/", 壓縮檔名會是EONDrive
  // 如果想要下載單一個資料夾，壓縮檔名會是該資料夾的名稱
  // 如果想要下載的檔案在第二層或更深層的目錄底下，並且不只一個檔案或資料夾要下載，壓縮檔名會是該層目錄名稱
  let parentName = "EONDrive";
  if (downloadList.length === 1 && downloadList[0].endsWith("/")) {
    parentName = downloadList[0].split("/").slice(1).pop();
  } else if (parentPath != "/") {
    parentName = parentPath.split("/").pop();
  } 
  console.log("parentName: ", parentName);

  const files = m_downloadList.filter(item => !item.endsWith("/"));
  const folders = m_downloadList.filter(item => item.endsWith("/"));

  console.log("files: ", files);
  console.log("folders: ", folders);

  let finalList = [];
  for (let i = 0; i < folders.length; i++) {
    const wholeChilds = await getWholeChilds(userId, folders[i]);
    finalList = [...finalList, ...wholeChilds];
  }
  finalList = [...finalList, ...files];
  console.log("finalList: ", finalList);

  const s3finalList = finalList.map(item => `user_${userId}/${item}`);
  // create zip file in local server
  const saveToLocal = await getObjSave(S3_BUCKET_NAME, s3finalList);
  console.log("saveToLocal: ", saveToLocal);
  const createZip = await zipFiles(s3finalList, parentName);
  console.log("createZip: ", createZip);
  const getZipUrl = await zipToS3(S3_BUCKET_NAME, parentName);
  console.log("getZipUrl: ", getZipUrl);
  
  // delete files
  deleteLocal(`./${parentName}.zip`);
  s3finalList.forEach( item => {
    deleteLocal(`./${item.split("/").join("_")}`);
  });

  return res.json({ downloadUrl: getZipUrl });
});

export { router as file_download };
