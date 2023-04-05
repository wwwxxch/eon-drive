import {
  getObjSave,
  zipFiles,
  zipToS3
} from "./s3_operation.js";

import { deleteLocal } from "./fs_operation.js";

const S3_BUCKET_NAME = "eondrive";

export async function handler(event) {
  try {
    console.log("event: ", event);
		const finalList = event.finalList;
		const parentName = event.parentName;

		const saveToLocal = await getObjSave(S3_BUCKET_NAME, finalList);
		console.log("saveToLocal: ", saveToLocal);
		const createZip = await zipFiles(finalList, parentName);
		console.log("createZip: ", createZip);
		const getZipUrl = await zipToS3(S3_BUCKET_NAME, parentName);
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