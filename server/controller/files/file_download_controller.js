import dotenv from "dotenv";
dotenv.config();
const { S3_MAIN_BUCKET_NAME, S3_DOWNLOAD_BUCKET_NAME } = process.env;

import { s3clientGeneral } from "../../service/s3/s3_client.js";

import { getDownloadUrl } from "../../service/s3/s3_download.js";
import { copyS3Obj } from "../../service/s3/s3_copy.js";

import { callLambdaZip } from "../../service/lambda/lambda_invoke.js";

import { getCurrentVersionByFileId } from "../../model/db_files_read.js";
import { findFileIdByPath } from "../../service/path/iter.js";
import { getAllChildren } from "../../service/path/recur.js";

import { CustomError } from "../../error/custom_error.js";

// local download
import { s3clientDownload } from "../../service/s3/s3_client.js";
import { getObjSave, zipFiles, zipToS3 } from "../../service/s3/s3_download.js";
import { deleteLocal } from "../../util/util.js";
// ====================================================================
const dlSingleFile = async (req, res, next) => {
	console.log("dlSingleFile: ", req.body);
	const { downloadList } = req.body;
	if (downloadList.length > 1 || downloadList[0].endsWith("/")) {
		return next();
	}

	const userId = req.session.user.id;
	const key = decodeURIComponent(downloadList[0].replace(/^\//, "").trim());

	// 1. get current version -> giving path to obtain file id
	const fileId = await findFileIdByPath(userId, key);
	if (fileId === -1) {
		return next(CustomError.badRequest("This file/folder may not exist."));
	}

	const version = await getCurrentVersionByFileId(fileId);
	console.log("version: ", version);
	if (version === -1) {
		return next(CustomError.internalServerError("(fn) getCurrentVersionByFileId Error"));
	}

	// 2. copy ${key}.v<version> to ${key}
	const copyS3ObjRes = await copyS3Obj(
		s3clientGeneral,
		S3_MAIN_BUCKET_NAME,
		`user_${userId}/${encodeURIComponent(key)}.v${version}`,
		`user_${userId}/${key}`
	);
	if (!copyS3ObjRes) {
		return next(CustomError.internalServerError("(fn) copyS3Obj Error"));
	}

	// 3. get presigned URL for that file
	const downloadUrl = await getDownloadUrl(
		s3clientGeneral,
		S3_MAIN_BUCKET_NAME,
		`user_${userId}/${key}`
	);
	if (!downloadUrl) {
		return next(CustomError.internalServerError("(fn) getDownloadUrl Error"));
	}

	return res.json({ downloadUrl: downloadUrl });
};

const dlMultiFileProcess = async (req, res, next) => {
	console.log("dlMultiFileProcess: ", req.body);
	const { downloadList, parentPath } = req.body;
	const userId = req.session.user.id;

	// *** remove fist slash ***
	const m_downloadList = downloadList.map((item) => {
		return item.replace(/^\//, "").trim();
	});
	console.log("downloadList: ", downloadList);
	console.log("m_downloadList: ", m_downloadList);

	// *** decide zip file name by path ***
	// 如果想要下載的檔案在第一層目錄底下，req.body.parentPath 會是 "/", 壓縮檔名會是EONDrive
	// 如果想要下載單一個資料夾，壓縮檔名會是該資料夾的名稱
	// 如果想要下載的檔案在第二層或更深層的目錄底下，並且不只一個檔案或資料夾要下載，壓縮檔名會是該層目錄名稱
	let parentName = "EONDrive";
	if (m_downloadList.length === 1 && m_downloadList[0].endsWith("/")) {
		parentName = m_downloadList[0].split("/")[m_downloadList[0].split("/").length - 2];
	} else if (parentPath !== "/") {
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
		console.log("input for getAllChildren: ", folders[i].slice(0, folders[i].length - 1));
		const allChildren = await getAllChildren(userId, folders[i].slice(0, folders[i].length - 1));
		// if (allChildren.childsNoVer.length === 0 ||
		//     allChildren.childsWithVer.length === 0) {
		//       return next(CustomError.badRequest("No such key"));
		//     }
		finalListNoVer = [...finalListNoVer, ...allChildren.childsNoVer];
		finalListWithVer = [...finalListWithVer, ...allChildren.childsWithVer];
	}
	for (let i = 0; i < files.length; i++) {
		const fileId = await findFileIdByPath(userId, files[i]);
		if (fileId === -1) {
			return next(CustomError.badRequest("This file/folder may not exist."));
		}
		const version = await getCurrentVersionByFileId(fileId);
		console.log("version: ", version);
		if (version === -1) {
			return next(CustomError.internalServerError("(fn) getCurrentVersionByFileId Error"));
		}
		finalListNoVer.push(files[i]);
		finalListWithVer.push(`${files[i]}.v${version}`);
	}

	console.log("finalListNoVer: ", finalListNoVer);
	console.log("finalListWithVer: ", finalListWithVer);

	req.body.finalListNoVer = finalListNoVer;
	req.body.finalListWithVer = finalListWithVer;
	req.body.parentName = parentName;
	next();
};

const dlCallLambda = async (req, res, next) => {
	const { finalListNoVer, finalListWithVer, parentPath, parentName } = req.body;
	const userId = req.session.user.id;

	const toLambda = await callLambdaZip(
		userId,
		finalListNoVer,
		finalListWithVer,
		parentPath,
		parentName
	);

	if (!toLambda) {
		return next(CustomError.internalServerError());
	} else if (toLambda.status === 500 && toLambda.error === "file size exceeds 4 GB") {
		return next(CustomError.badRequest("file size exceeds 4 GB"));
	} else if (toLambda.status === 500) {
		return next(CustomError.internalServerError("(fn) callLambdaZip Error"));
	} else if (toLambda.downloadUrl) {
		console.log("toLambda: downloadUrl is not blank");
	} else if (!toLambda.downloadUrl) {
		console.log("toLambda: downloadUrl is null");
	}

	return res.json({ downloadUrl: toLambda.downloadUrl });
};

// TODO: handling errors in my server ...
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
	const getZipUrl = await zipToS3(userId, s3clientDownload, S3_DOWNLOAD_BUCKET_NAME, parentName);
	console.log("getZipUrl: ", getZipUrl);

	// delete files
	deleteLocal(`./${parentName}.zip`);
	finalListNoVer.forEach((item) => {
		deleteLocal(`./${item.split("/").join("_")}`);
	});

	return res.json({ downloadUrl: getZipUrl });
};

export { dlSingleFile, dlMultiFileProcess, dlCallLambda, dlLocalArchive };
