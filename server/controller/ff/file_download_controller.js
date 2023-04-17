import dotenv from "dotenv";
dotenv.config();
const { S3_MAIN_BUCKET_NAME, S3_DOWNLOAD_BUCKET_NAME } = process.env;

import {
	s3clientGeneral,
	s3clientDownload,
} from "../../service/s3/s3_client.js";

import { getDownloadUrl } from "../../service/s3/s3_download.js";
import { copyS3Obj } from "../../service/s3/s3_copy.js";
import { getObjSave, zipFiles, zipToS3 } from "../../service/s3/s3_download.js";

import { callLambdaZip } from "../../service/lambda/lambda_invoke.js";

import { getCurrentVersionByFileId } from "../../model/db_ff_r.js";
import { findFileIdByPath } from "../../service/path/iter.js";
import { getAllChildren } from "../../service/path/recur.js";

import { deleteLocal } from "../../util/util.js";
// ====================================================================
const dlValidation = async (req, res, next) => {
	console.log("dlValidation: ", req.body);
	const { downloadList, parentPath } = req.body;
	// req.body format -
	//  {
	//    "downloadList": [ "/test2/a.txt", "/test2/b.txt", "/test2/b/" ],
	//    "parentPath": "/test2"
	//  }

	// const userId = req.session.user.id;

	if (!downloadList || downloadList.length === 0 || !parentPath) {
		return res.status(400).json({ err: "error" });
	}

	// TODO: download API - input validation - downloadList 不能是 "/"

	next();
};

const dlSingleFile = async (req, res, next) => {
	console.log("dlSingleFile: ", req.body);
	const { downloadList } = req.body;

	if (downloadList.length === 1 && !downloadList[0].endsWith("/")) {
		const userId = req.session.user.id;
		const key = downloadList[0].replace(/^\//, "").trim();

		// 1. get current version -> giving path to obtain file id
		const fileId = await findFileIdByPath(userId, key);
		const version = await getCurrentVersionByFileId(fileId);
		console.log("version: ", version);
		// 2. copy ${key}.v<version> to ${key}
		const copyS3ObjRes = await copyS3Obj(
			s3clientGeneral,
			S3_MAIN_BUCKET_NAME,
			`user_${userId}/${key}.v${version}`,
			`user_${userId}/${key}`
		);
		// 3. get presigned URL for that file
		const downloadUrl = await getDownloadUrl(
			s3clientGeneral,
			S3_MAIN_BUCKET_NAME,
			`user_${userId}/${key}`
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
	const m_downloadList = downloadList.map((item) => {
		return item.replace(/^\//, "").trim();
	});
	console.log("m_downloadList: ", m_downloadList);

	// *** decide zip file name by path ***
	// 如果想要下載的檔案在第一層目錄底下，req.body.parentPath 會是 "/", 壓縮檔名會是EONDrive
	// 如果想要下載單一個資料夾，壓縮檔名會是該資料夾的名稱
	// 如果想要下載的檔案在第二層或更深層的目錄底下，並且不只一個檔案或資料夾要下載，壓縮檔名會是該層目錄名稱
	let parentName = "EONDrive";
	if (m_downloadList.length === 1 && m_downloadList[0].endsWith("/")) {
		// parentName = m_downloadList[0].split("/").slice(-2,-1).pop();
		parentName =
			m_downloadList[0].split("/")[m_downloadList[0].split("/").length - 2];
	} else if (parentPath != "/") {
		parentName = parentPath.split("/").pop();
	}
	console.log("parentName: ", parentName);

	// *** iterate all childs under folder to get final list with whole path ***
	const files = m_downloadList.filter((item) => !item.endsWith("/"));
	const folders = m_downloadList.filter((item) => item.endsWith("/"));

	console.log("files: ", files);
	console.log("folders: ", folders);

	let finalListNoVer = [];
	let finalListWithVer = [];
	for (let i = 0; i < folders.length; i++) {
    console.log("input for getAllChildren: " ,folders[i].slice(0, folders[i].length - 1));
		const allChildren = await getAllChildren(
			userId,
			folders[i].slice(0, folders[i].length - 1)
		);
		finalListNoVer = [...finalListNoVer, ...allChildren.childsNoVer];
		finalListWithVer = [...finalListWithVer, ...allChildren.childsWithVer];
	}
	for (let i = 0; i < files.length; i++) {
		const fileId = await findFileIdByPath(userId, files[i]);
		const version = await getCurrentVersionByFileId(fileId);
		console.log("version: ", version);
		finalListNoVer.push(files[i]);
		finalListWithVer.push(`${files[i]}.v${version}`);
	}

	console.log("finalListNover: ", finalListNoVer);
	console.log("finalListWithVer: ", finalListWithVer);

	req.body.finalListNoVer = finalListNoVer;
	req.body.finalListWithVer = finalListWithVer;
	req.body.parentName = parentName;
	next();
};

const dlCallLambda = async (req, res) => {
	const { finalListNoVer, finalListWithVer, parentPath, parentName } = req.body;
	const userId = req.session.user.id;

	const toLambda = await callLambdaZip(
		userId,
		finalListNoVer,
		finalListWithVer,
		parentPath,
		parentName
	);
	console.log("toLambda: ", toLambda);
	if (!toLambda.downloadUrl) {
		return res.status(500).json({ err: "something wrong" });
	}
	return res.json({ downloadUrl: toLambda.downloadUrl });
};

const dlLocalArchive = async (req, res) => {
	console.log("dlLocalArchive: ", req.body);
	const { finalListNoVer, finalListWithVer, parentPath, parentName } = req.body;

	const userId = req.session.user.id;

	const s3finalList = finalListWithVer.map((item) => `user_${userId}/${item}`);
	
  // save objects
	const saveToLocal = await getObjSave(
		s3clientGeneral,
		S3_MAIN_BUCKET_NAME,
		s3finalList,
		finalListNoVer
	);
	console.log("saveToLocal: ", saveToLocal);
  
  // create zip
	const createZip = await zipFiles(finalListNoVer, parentPath, parentName);
	console.log("createZip: ", createZip);
	
  // upload zip to S3 and get the presigned URL
  const getZipUrl = await zipToS3(
		userId,
		s3clientDownload,
		S3_DOWNLOAD_BUCKET_NAME,
		parentName
	);
	console.log("getZipUrl: ", getZipUrl);

	// delete files
	deleteLocal(`./${parentName}.zip`);
	finalListNoVer.forEach((item) => {
		deleteLocal(`./${item.split("/").join("_")}`);
	});

	return res.json({ downloadUrl: getZipUrl });
};

export {
	dlValidation,
	dlSingleFile,
	dlMultiFileProcess,
	dlCallLambda,
	dlLocalArchive,
};
