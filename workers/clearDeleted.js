import { DateTime, Duration } from "luxon";
import { getExpiredDeleted } from "../server/models/db_expiration.js";
import { getDeletedFilesInfoById } from "../server/models/db_files_read.js";
import { findParentPathByFilesId } from "../server/services/path/iter.js";
import {
	permDeleteByFileId,
	permDeleteByFolderId,
} from "../server/models/db_files_delete.js";

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
import { deleteAllVersionsForOneObject } from "../server/services/s3/s3_delete.js";
import { deleteObject } from "../server/services/s3/s3_delete.js";

// ============================================================================
const clearDeleted = async () => {
	try {
		const now = DateTime.utc();
		const duration = Duration.fromObject({ seconds: DUR });
		const expiredDT = now.minus(duration).toFormat("yyyy-MM-dd HH:mm:ss");
		console.log("expiredDT: ", expiredDT);

		const expiredDeletedList = await getExpiredDeleted(expiredDT);
		if (expiredDeletedList.length === 0) {
			console.log("no expired deleted file/folder");
			return;
		}
		console.log("expiredDeletedList: ", expiredDeletedList);
		let expiredFiles = [];
		let expireFolders = [];
		for (const element of expiredDeletedList) {
			// get user_id & type & name & id by files_id
			// get file/folder full path by files_id
			// remove file first
			// remove folder (no need to recursively find children under folder)

			const info = await getDeletedFilesInfoById(element);
			// info.id info.name, info.type, info.user_id

			if (info.type === "folder") expireFolders.push(info);
			else if (info.type === "file") expiredFiles.push(info);
		}

		// file
		for (const element of expiredFiles) {
			// console.log("file: element: ", element);
			const parentPath = await findParentPathByFilesId(element.id);
			const fullPath = parentPath.replace(/^Home\//, "") + element.name;
			// remove file from DB
			const deleteDB = await permDeleteByFileId(element.id, element.user_id);
			console.log("deleteDB: ", deleteDB);
			// remove file from S3
			const deleteS3 = await deleteAllVersionsForOneObject(
				s3clientGeneral,
				S3_MAIN_BUCKET_NAME,
				`user_${element.user_id}/${fullPath}`
			);
			console.log("deleteS3: ", deleteS3);
		}

		// folder
		for (const element of expireFolders) {
			console.log("folder: element: ", element);
			const parentPath = await findParentPathByFilesId(element.id);
			const fullPath = parentPath.replace(/^Home\//, "") + element.name;
			// remove folder from DB
			const deleteDB = await permDeleteByFolderId(element.id, element.user_id);
			console.log("deleteDB: ", deleteDB);
			// remove folder from S3
			const deleteS3 = await deleteObject(
				s3clientGeneral,
				S3_MAIN_BUCKET_NAME,
				`user_${element.user_id}/${fullPath}`
			);
			console.log("deleteS3: ", deleteS3);
		}
		console.log("clear deleted files/folders < expiration DT");
		return true;
	} catch (e) {
		console.log("clearDeleted - error: ", e);
		return false;
	} finally {
		process.exit();
	}
};

export { clearDeleted };

clearDeleted();
