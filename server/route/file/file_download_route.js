import express from "express";
const router = express.Router();

import dotenv from "dotenv";
dotenv.config();
const { S3_MAIN_BUCKET_NAME, S3_DOWNLOAD_BUCKET_NAME } = process.env;

import { s3clientGeneral, s3clientDownload } from "../../service/s3/s3_client.js";

import { authentication } from "../../controller/user/user_auth_controller.js";

import { wrapAsync, deleteLocal } from "../../util/util.js";

import {
	getObjSave,
	zipFiles,
	zipToS3,
} from "../../service/s3/s3_download.js";

import {
	dlValidation,
	dlSingleFile,
	dlMultiFileProcess,
	dlCallLambda,
} from "../../controller/file/file_download_controller.js";

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
		
    const { finalList, parentPath, parentName } = req.body;
    const userId = req.session.user.id;
    
		const s3finalList = finalList.map((item) => `user_${userId}/${item}`);
		// create zip file in local server
		const saveToLocal = await getObjSave(s3clientGeneral, S3_MAIN_BUCKET_NAME, s3finalList, finalList);
		console.log("saveToLocal: ", saveToLocal);
		const createZip = await zipFiles(finalList, parentPath, parentName);
		console.log("createZip: ", createZip);
		const getZipUrl = await zipToS3(userId, s3clientDownload, S3_DOWNLOAD_BUCKET_NAME, parentName);
		console.log("getZipUrl: ", getZipUrl);

		// delete files
		deleteLocal(`./${parentName}.zip`);
		finalList.forEach((item) => {
			deleteLocal(`./${item.split("/").join("_")}`);
		});

		return res.json({ downloadUrl: getZipUrl });
	}
);

export { router as file_download_route };
