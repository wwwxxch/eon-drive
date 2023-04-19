import {
  getFileIdWithVersionsExpired,
	getExpiredVersionsById,
	getExpiredDeletedRec,
} from "../server/model/db_expiration.js";
import {
  deleteExpiredVersions,
	deleteExpiredDeletedRec,
} from "../server/model/db_ff_d.js";
import { findParentPathByFFId } from "../server/service/path/iter.js";

import dotenv from "dotenv";
dotenv.config();
const { S3_MAIN_BUCKET_NAME } = process.env;
import { s3clientGeneral } from "../../service/s3/s3_client.js";
import { deleteObject } from "../server/service/s3/s3_delete.js";
// =======================================================================
const clearVersions = async () => {
	try {
		const nowDT = Date.now();
    // 1.
		// find file with versions expired
		const fileWithVersionsExpired = await getFileIdWithVersionsExpired(nowDT);
      // distinct ff_id, name, user_id

		for (const element of fileWithVersionsExpired) {
			// get expired versions by ff_id
			const expiredVersions = await getExpiredVersionsById(
				element.ff_id,
				nowDT
			);
        // file_ver_id, ver

			const fileVerIdList = expiredVersions.map((item) => item.file_ver_id);
			const fileVersionList = expiredVersions.map((item) => item.ver);

			// delete expired versions by file_ver_id
			const deleteFileVerInDB = await deleteExpiredVersions(fileVerIdList);
			console.log("deleteFileVerInDB: ", deleteFileVerInDB);

			// delete these versions in S3
			// get the whole path by ff_id
			const parentPath = await findParentPathByFFId(element.ff_id);
			const fullPath = parentPath.replace(/^Home\//, "") + element.name;
			for (const ver of fileVersionList) {
				const deleteVerInS3 = await deleteObject(
					s3clientGeneral,
					S3_MAIN_BUCKET_NAME,
					`user_${element.user_id}/${fullPath}.v${ver}`
				);
        console.log("deleteVerInS3: ", deleteVerInS3);
			}
		}
    console.log("clear versions > expiration DT");

    // 2.
		// expired deleted records
		const expiredDeletedRec = await getExpiredDeletedRec(nowDT);
		if (expiredDeletedRec.length > 0) {
			const deleteExpiredDeletedRecInDB = await deleteExpiredDeletedRec(
				expiredDeletedRec
			);
			console.log("deleteExpiredDeletedRecInDB: ", deleteExpiredDeletedRecInDB);
		}

    console.log("clear deleted records > expiration DT");
    return true;
	} catch (e) {
		console.log("clearVersions - error: ", e);
		return false;
	} finally {
		process.exit();
	}
};

export { clearVersions };

clearVersions();
