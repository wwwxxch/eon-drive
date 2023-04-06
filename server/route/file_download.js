import express from "express";
const router = express.Router();

import dotenv from "dotenv";
dotenv.config();
const { S3_BUCKET_NAME } = process.env;

import { authentication } from "../controller/user_auth.js";

import { wrapAsync, deleteLocal } from "../util/util.js";

import {
	getObjSave,
	zipFiles,
	zipToS3,
} from "../util/s3_download.js";

import {
	dlValidation,
	dlSingleFile,
	dlMultiFileProcess,
	dlCallLambda,
} from "../controller/dl_process.js";

// ------------------------------------------------------------------------------------
router.post("/download",
	authentication,
	dlValidation,
	dlSingleFile,
	dlMultiFileProcess,
	dlCallLambda
);

// download at local server
router.post("/download-test",
	authentication,
	dlValidation,
	dlSingleFile,
	dlMultiFileProcess,
	async (req, res) => {
		
    const { finalList, parentName } = req.body;
    const userId = req.session.user.id;
    
    // TODO: 確認層級 - 現在會從最上層的user folder開始打包
		const s3finalList = finalList.map((item) => `user_${userId}/${item}`);
		// create zip file in local server
		const saveToLocal = await getObjSave(S3_BUCKET_NAME, s3finalList);
		console.log("saveToLocal: ", saveToLocal);
		const createZip = await zipFiles(s3finalList, parentName);
		console.log("createZip: ", createZip);
		const getZipUrl = await zipToS3(S3_BUCKET_NAME, parentName);
		console.log("getZipUrl: ", getZipUrl);

		// delete files
		deleteLocal(`./${parentName}.zip`);
		s3finalList.forEach((item) => {
			deleteLocal(`./${item.split("/").join("_")}`);
		});

		return res.json({ downloadUrl: getZipUrl });
	}
);

export { router as file_download };
