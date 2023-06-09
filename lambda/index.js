const { createLocalFolder, getObjSave, zipFiles, zipToS3 } = require("./s3_download.js");

const { deleteLocal } = require("./fs_operation.js");

const { S3Client } = require("@aws-sdk/client-s3");

const s3clientGeneral = new S3Client({
	region: process.env.S3_MAIN_BUCKET_REGION,
});
const s3clientDownload = new S3Client({
	region: process.env.S3_DOWNLOAD_BUCKET_REGION,
});

const S3_MAIN_BUCKET_NAME = process.env.S3_MAIN_BUCKET_NAME;
const S3_DOWNLOAD_BUCKET_NAME = process.env.S3_DOWNLOAD_BUCKET_NAME;
const tmpDir = process.env.TMP_DIR;
// =======================================================================================
exports.handler = async (event) => {
	try {
		console.log("event: ", event);
		const finalListNoVer = event.finalListNoVer;
		const finalListWithVer = event.finalListWithVer;
		const parentPath = event.parentPath;
		const parentName = event.parentName;
		const userId = event.userId;

		const s3finalList = finalListWithVer.map((item) => `user_${userId}/${item}`);

		// 0. create local folder
		const createLocalFolderResult = await createLocalFolder(userId);
		console.log("createLocalFolderResult: ", createLocalFolderResult);
		if (!createLocalFolderResult) {
			throw new Error("createLocalFolder Error");
		}

		// 1. save objects
		const saveToLocal = await getObjSave(
			s3clientGeneral,
			S3_MAIN_BUCKET_NAME,
			s3finalList,
			finalListNoVer,
			userId
		);
		console.log("saveToLocal: ", saveToLocal);
		if (saveToLocal.status === 500 && saveToLocal.error === "Exceeds Download Limit") {
			throw new Error(`${saveToLocal.error}`);
		} else if (saveToLocal.status === 500) {
			throw new Error("getObjSave error");
		}

		// 2. create zip
		const createZip = await zipFiles(finalListNoVer, parentPath, parentName, userId);
		console.log("createZip: ", createZip);
		if (!createZip) {
			throw new Error("zipFiles error");
		}

		// 3. upload zip to S3 and get the presigned URL
		const getZipUrl = await zipToS3(
			userId,
			s3clientDownload,
			S3_DOWNLOAD_BUCKET_NAME,
			parentName
		);
		console.log("getZipUrl: ", getZipUrl);
		if (getZipUrl.status !== 200) {
			throw new Error("zipToS3 error: ", getZipUrl.error);
		}

		// 4. delete files
		for (let i = 0; i < finalListNoVer.length; i++) {
			const deletefile = await deleteLocal(
				`${tmpDir}/user_${userId}/${finalListNoVer[i].split("/").join("_")}`
			);
			console.log(deletefile);
		}
		// const deleteZip = await deleteLocal(`/tmp/${parentName}.zip`);
		const deleteZip = await deleteLocal(`${tmpDir}/user_${userId}/${parentName}.zip`);
		console.log(deleteZip);

		return { status: 200, downloadUrl: getZipUrl.url };
	} catch (e) {
		console.error("lambda zipfiles: ", e);
		return { status: 500, error: e.message };
	}
};
