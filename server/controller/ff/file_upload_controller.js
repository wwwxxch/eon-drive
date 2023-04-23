import { v4 as uuidv4 } from "uuid";
import { DateTime } from "luxon";

import { getFolderId, getFileId } from "../../model/db_ff_r.js";
import { createFolder, createFile } from "../../model/db_ff_c.js";
import {
	changeFolderDeleleStatus,
	updateDeletedFile,
	updateExistedFile,
	commitMetadata,
} from "../../model/db_ff_u.js";
import { updateSpaceUsedByUser } from "../../model/db_plan.js";

import dotenv from "dotenv";
dotenv.config();
const { S3_MAIN_BUCKET_NAME } = process.env;

import { s3clientGeneral } from "../../service/s3/s3_client.js";
import {
	getSingleSignedUrl,
	getMultiSignedUrl,
} from "../../service/s3/s3_upload.js";

import { emitNewList, emitUsage } from "../../service/sync/list.js";
// ======================================================================
const uploadChangeDB = async (req, res, next) => {
	console.log("uploadChangeDB: req.body: ", req.body);
	const { fileName, fileWholePath, fileSize } = req.body;
	const userId = req.session.user.id;

	const folders = fileWholePath.split("/");
	folders.pop();
  console.log("folders: ", folders);
	const now = DateTime.utc();
  const nowTime = now.toFormat("yyyy-MM-dd HH:mm:ss");
	// get parentId
	let parentId = 0;
	const token = uuidv4();
	if (folders.length > 0) {
		for (let i = 0; i < folders.length; i++) {
			const chkDir = await getFolderId(userId, parentId, folders[i]);
			if (chkDir.length === 0) {
				// if no such dir, create new dir
				const newDir = await createFolder(
					parentId,
					folders[i],
          userId,
					token,
					nowTime
				);
				parentId = newDir;
			} else if (chkDir[0].is_delete === 1) {
				// if dir has been deleted, change delete status
				const chgDirDelSts = await changeFolderDeleleStatus(0, chkDir[0].id, nowTime);
				parentId = chkDir[0].id;
			} else {
				parentId = chkDir[0].id;
			}
		}
	}

	const chkFile = await getFileId(userId, parentId, fileName);
	console.log("chkFile: ", chkFile);
	let version;
	if (chkFile.length === 0) {
		// create new file record
		const newFile = await createFile(
			parentId,
			fileName,
			fileSize,
      userId,
      token,
			nowTime
		);
		console.log("newFile: ", newFile);
		version = newFile.new_ver;
	} else if (chkFile[0].is_delete === 1) {
		// if file has been deleted, change delete status & update tables
		const updDelFile = await updateDeletedFile(
			0,
			token,
			chkFile[0].id,
			fileSize,
			nowTime
		);
		console.log("updDelFile: ", updDelFile);
		version = updDelFile.new_ver;
	} else {
		// add new version for update
		const updExsFile = await updateExistedFile(
			token,
			chkFile[0].id,
			fileSize,
			nowTime
		);
		console.log("updExsFile: ", updExsFile);
		version = updExsFile.new_ver;
	}

	// update usage of an user
	const currentUsed = await updateSpaceUsedByUser(userId, nowTime);
	req.session.user.used = currentUsed;
	req.token = token;
	req.version = version;
	next();
};

const getS3Url = async (req, res) => {
	const { fileWholePath, fileSplit } = req.body;
	const splitCount = parseInt(fileSplit);
	const userId = req.session.user.id;
	const token = req.token;
	const version = req.version;
	const key = `user_${userId}/${fileWholePath}.v${version}`;

	if (splitCount === 1) {
		const singleUrl = await getSingleSignedUrl(
			s3clientGeneral,
			S3_MAIN_BUCKET_NAME,
			key
		);

		return res.json({ token, singleUrl });
	} else if (splitCount > 1) {
		const { partUrls, completeUrl } = await getMultiSignedUrl(
			s3clientGeneral,
			S3_MAIN_BUCKET_NAME,
			key,
			fileSplit
		);

		return res.json({ token, partUrls, completeUrl });
	}
};

const uploadCommitDB = async (req, res) => {
	console.log("uploadCommitDB: ", req.body);
	const { token, parentPath } = req.body;
	const userId = req.session.user.id;

	const commit = await commitMetadata("done", token);
	console.log("commit: ", commit);
  
  const io = req.app.get("socketio");
	emitNewList(io, userId, parentPath);
  emitUsage(io, userId, req.session.user);
	return res.json({ msg: "commit complete" });
};

export { uploadChangeDB, getS3Url, uploadCommitDB };
