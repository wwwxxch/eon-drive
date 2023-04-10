const {
  getObjSave,
  zipFiles,
  zipToS3
} = require("./s3_operation.js");

const { deleteLocal } = require("./fs_operation.js");

const {
  S3Client
} = require("@aws-sdk/client-s3");

const client = new S3Client({ region: "ap-southeast-1" });

const S3_MAIN_BUCKET_NAME = "eondrive";
const S3_DOWNLOAD_BUCKET_NAME = "eondrive-download";

exports.handler = async (event) => {
  try {
    console.log("event: ", event);
		const finalList = event.finalList;
    const parentPath = event.parentPath;
		const parentName = event.parentName;
    const userId = event.userId;

		const s3finalList = finalList.map((item) => `user_${userId}/${item}`);

		const saveToLocal = await getObjSave(client, S3_MAIN_BUCKET_NAME, s3finalList, finalList);
		console.log("saveToLocal: ", saveToLocal);
		const createZip = await zipFiles(finalList, parentPath, parentName);
		console.log("createZip: ", createZip);
		const getZipUrl = await zipToS3(userId, client, S3_DOWNLOAD_BUCKET_NAME, parentName);
		console.log("getZipUrl: ", getZipUrl);

		// delete files
    for (let i = 0; i < finalList.length; i ++) {
      const deletefile = await deleteLocal(`/tmp/${finalList[i].split("/").join("_")}`);
      console.log(deletefile);
    }
    const deleteZip = await deleteLocal(`/tmp/${parentName}.zip`);
    console.log(deleteZip);
		return { downloadUrl: getZipUrl };
  } catch (e) {
    console.error("lambda zipfiles: ", e);
    return { err: "something wrong" };
  }
};