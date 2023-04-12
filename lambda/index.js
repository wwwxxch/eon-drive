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
		const finalListNoVer = event.finalListNoVer;
    const finalListWithVer = event.finalListWithVer;
    const parentPath = event.parentPath;
		const parentName = event.parentName;
    const userId = event.userId;

		const s3finalList = finalListWithVer.map((item) => `user_${userId}/${item}`);
	
    // save objects
    const saveToLocal = await getObjSave(
      client,
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
      client,
      S3_DOWNLOAD_BUCKET_NAME,
      parentName
    );
    console.log("getZipUrl: ", getZipUrl);

		// delete files
    for (let i = 0; i < finalListNoVer.length; i ++) {
      const deletefile = await deleteLocal(`/tmp/${finalListNoVer[i].split("/").join("_")}`);
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