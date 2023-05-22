import { DateTime, Duration } from "luxon";
import {
	getFileIdWithVersionsExpired,
	getExpiredVersionsById,
	getExpiredDeletedRec,
} from "../server/models/db_expiration.js";
import {
	deleteExpiredVersions,
	deleteExpiredDeletedRec,
} from "../server/models/db_files_delete.js";
import { findParentPathByFilesId } from "../server/services/path/iter.js";

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const { EXPIRATION_DAY, EXPIRATION_MIN, S3_MAIN_BUCKET_NAME } = process.env;
// const DUR = parseInt(EXPIRATION_MIN) * 60; // min to sec
const DUR = parseInt(EXPIRATION_DAY) * 24 * 60 * 60; // day to sec

import { s3clientGeneral } from "../server/services/s3/s3_client.js";
import { deleteObject } from "../server/services/s3/s3_delete.js";
// =======================================================================
const clearVersions = async () => {
	try {
		const now = DateTime.utc();
		const duration = Duration.fromObject({ seconds: DUR });
		const expiredDT = now.minus(duration).toFormat("yyyy-MM-dd HH:mm:ss");
		console.log("currentDT: ", now.toFormat("yyyy-MM-dd HH:mm:ss"));
		console.log("expiredDT: ", expiredDT);
		// 1.
		// find file with versions expired
		const fileWithVersionsExpired = await getFileIdWithVersionsExpired(expiredDT);
		// distinct files_id, name, user_id
		console.log("fileWithVersionsExpired: ", fileWithVersionsExpired);

		for (const element of fileWithVersionsExpired) {
			console.log("element: ", element);
			// get expired versions by files_id
			const expiredVersions = await getExpiredVersionsById(element.files_id, expiredDT);
			// file_ver_id, ver
			// console.log("expiredVersions: ", expiredVersions);

			const fileVerIdList = expiredVersions.map((item) => item.file_ver_id);
			const fileVersionList = expiredVersions.map((item) => item.ver);

			// delete expired versions by file_ver_id
			const deleteFileVerInDB = await deleteExpiredVersions(fileVerIdList);
			console.log("deleteFileVerInDB: ", deleteFileVerInDB);

			// delete these versions in S3
			// get the whole path by files_id
			const parentPath = await findParentPathByFilesId(element.files_id);
			const fullPath = parentPath.replace(/^Home\//, "") + element.name;
			// console.log("fullPath: ", fullPath);

			for (const ver of fileVersionList) {
				const deleteVerInS3 = await deleteObject(
					s3clientGeneral,
					S3_MAIN_BUCKET_NAME,
					`user_${element.user_id}/${fullPath}.v${ver}`
				);
				console.log("deleteVerInS3: ", deleteVerInS3);
			}
		}
		if (fileWithVersionsExpired.length === 0) {
			console.log("no versions < expiration DT");
		} else {
			console.log("clear versions < expiration DT");
		}

		// 2.
		// expired deleted records in DB
		const expiredDeletedRec = await getExpiredDeletedRec(expiredDT);
		console.log("expiredDeletedRec: ", expiredDeletedRec);

		if (expiredDeletedRec.length === 0) {
			console.log("no deleted records < expiration DT");
			return;
		}

		const deleteExpiredDeletedRecInDB = await deleteExpiredDeletedRec(expiredDeletedRec);
		console.log("deleteExpiredDeletedRecInDB: ", deleteExpiredDeletedRecInDB);

		console.log("clear deleted records < expiration DT");
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
