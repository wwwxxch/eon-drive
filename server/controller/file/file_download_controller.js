import dotenv from "dotenv";
dotenv.config();
const {	S3_MAIN_BUCKET_NAME } = process.env;

import { s3clientGeneral, s3clientDownload } from "../../service/s3/s3_client.js";

import {
  getDownloadUrl
} from "../../service/s3/s3_download.js";

import { getWholeChilds } from "../../service/find_child.js";

import { callLambdaZip } from "../../service/lambda/lambda_invoke.js";

// ====================================================================
const dlValidation = async (req, res, next) => {
  console.log("dlValidation", req.body);
  const { downloadList, parentPath } = req.body;
  // const userId = req.session.user.id;

  if (!downloadList || downloadList.length === 0 || !parentPath) {
    return res.status(400).json({ err: "error" });
  }

  // TODO: not yet
  // downloadList 不能是 "/"

  next();
};

const dlSingleFile = async (req, res, next) => {
  console.log("dlSingleFile: ", req.body);
  const { downloadList } = req.body;
  if (downloadList.length === 1 && !downloadList[0].endsWith("/")) {
    const userId = req.session.user.id;
    const downloadUrl = await getDownloadUrl(
      s3clientGeneral,
      S3_MAIN_BUCKET_NAME,
      `user_${userId}/${downloadList[0].replace(/^\//,"").trim()}`,
      60 * 5
    );
    return res.json({ downloadUrl: downloadUrl });
  }
  next();
};

const dlMultiFileProcess = async (req, res, next) => {
  console.log("dlMultiFileProcess: ", req.body);
  const { downloadList, parentPath } = req.body;
  const userId = req.session.user.id;

  // *** remove fist slash ***
  const m_downloadList = downloadList.map(item => {
    return item.replace(/^\//,"").trim();
  });
  console.log("m_downloadList: ", m_downloadList);

  // *** decide zip file name by path ***
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

  // *** iterate all childs under folder to get final list with whole path ***
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

  req.body.finalList = finalList;
  req.body.parentName = parentName;
  next();
};

const dlCallLambda = async (req, res) => {
  const { finalList, parentPath, parentName } = req.body;
  const userId = req.session.user.id;

  const toLambda = await callLambdaZip(userId, finalList, parentPath, parentName);
  console.log("toLambda: ", toLambda);
  if (!toLambda.downloadUrl) {
    return res.status(500).json({ err: "something wrong" });
  }
  return res.json({ downloadUrl: toLambda.downloadUrl });
};

export {
  dlValidation,
  dlSingleFile,
  dlMultiFileProcess,
  dlCallLambda
};