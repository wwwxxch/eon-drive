import { v4 as uuidv4 } from "uuid";

import dotenv from "dotenv";
dotenv.config();
const { S3_MAIN_BUCKET_NAME } = process.env;

import { s3clientGeneral } from "../../service/s3/s3_client.js";
import { copyS3Obj } from "../../service/s3/s3_copy.js";

import {
	restoreFileToPrev,
	restoreDeletedFile,
	commitMetadata,
} from "../../model/db_ff_u.js";

import {
	iterForParentId,
	findFileIdByPath,
	findDeletedFileIdByPath,
} from "../../service/path/iter.js";
import { restoreRecur } from "../../service/path/recur.js";

import { emitNewList } from "../../service/sync/list.js";
// ===================================================================================
const restoreHistory = async (req, res) => {
	console.log("restoreHistory ", req.body);
	const { version, fileWholePath, parentPath } = req.body;
	const userId = req.session.user.id;

	// find the fileId by path
	const fileId = await findFileIdByPath(userId, fileWholePath);
	console.log("fileId: ", fileId);

	// change table
	const token = uuidv4();
	const nowTime = Date.now();
	const restore = await restoreFileToPrev(
		token,
		fileId,
		version,
		nowTime,
		userId
	);
	console.log("restore: ", restore); // new version

	// copy this version file as new version file (S3)
	const newRecordInS3 = await copyS3Obj(
		s3clientGeneral,
		S3_MAIN_BUCKET_NAME,
		`user_${userId}/${fileWholePath}.v${version}`,
		`user_${userId}/${fileWholePath}.v${restore.new_ver}`
	);
	console.log("newRecordInS3: ", newRecordInS3);

	// commit metadata
	const commit = await commitMetadata("done", token);
	console.log("commit: ", commit);

	// emit new list
	emitNewList(req, userId, parentPath);
	// TODO: emit new history

	return res.send("ok");
};

const restoreDeleted = async (req, res) => {
	console.log("restoreDeleted: ", req.body);
	const { restoreList } = req.body;
	const userId = req.session.user.id;

	// if it's folder -> find the children under deleted folder
	// if it's file -> find the deleted file by path
	const token = uuidv4();
	const nowTime = Date.now();
	for (let i = 0; i < restoreList.length; i++) {
		let key = restoreList[i];

		if (key.endsWith("/")) {
			// get parentId
			const folders = key.slice(0, key.length - 1).split("/");
			const parentId = await iterForParentId(userId, folders);
			console.log("parentId: ", parentId);

			// update DB & S3
			const restoreRecurRes = await restoreRecur(
				parentId,
				key.replace(/\/$/, ""),
				nowTime,
				token,
				userId
			);
			console.log("restoreRecurRes: ", restoreRecurRes);
		} else {
			// get fileId
			const fileId = await findDeletedFileIdByPath(userId, key);
			console.log("fileId: ", fileId);

			// update DB
			const restoreDeleted = await restoreDeletedFile(
				token,
				fileId,
				nowTime,
				userId
			);
			console.log("restoreDeleted: ", restoreDeleted); // cur version & new version

			// update S3
			const newRecordInS3 = await copyS3Obj(
				s3clientGeneral,
				S3_MAIN_BUCKET_NAME,
				`user_${userId}/${key}.v${restoreDeleted.cur_ver}`,
				`user_${userId}/${key}.v${restoreDeleted.new_ver}`
			);
			console.log("newRecordInS3: ", newRecordInS3);
		}
	}

	// commit metadata
	const commit = await commitMetadata("done", token);
	console.log("commit: ", commit);

	// TODO: emit new trash list

	return res.send("ok");
};

export { restoreHistory, restoreDeleted };
