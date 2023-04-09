import { v4 as uuidv4 } from "uuid";

import dotenv from "dotenv";
dotenv.config();
const { S3_MAIN_BUCKET_NAME } = process.env;

import { s3clientGeneral } from "../../service/s3/s3_client.js";

import { getSingleSignedUrl, getMultiSignedUrl } from "../../service/s3/s3_upload.js";

import {
	getDirId,
	getFileId,
	saveMetadata,
	updMetadata,
	commitMetadata,
} from "../../model/db_file.js";

import { getUser } from "../../model/db_user.js";

import { updateUsed } from "../../model/db_plan.js";

import { emitNewList } from "../../service/sync_list.js";

// =============================================================================
const uploadChangeDB = async (req, res, next) => {
	console.log("uploadChange: req.body: ", req.body);
	const { fileName, fileRelPath, fileSize } = req.body;
	const userId = req.session.user.id;

	// Parse the filerelpath to get the parent directory name and the file name
	const parts = fileRelPath.split("/");
	parts.pop(); // only leave folders in parts array

	// get parentId
	let parentId = 0;
	const token = uuidv4();
	if (parts.length > 0) {
		for (let i = 0; i < parts.length; i++) {
			// console.log(parts[i]);
			const chkDir = await getDirId(userId, parentId, parts[i]);
			if (chkDir.length === 0) {
				const toDBFolder = await saveMetadata(
					userId,
					parentId,
					parts[i],
					"folder",
					null,
					token
				);
				parentId = toDBFolder.insertId;
			} else {
				parentId = chkDir[0].id;
			}
		}
	}

	// check if this file id is existed
	const chkFileId = await getFileId(userId, parentId, fileName);
	console.log("checkFileId: ", chkFileId);

	// add new record or update current record
	if (chkFileId.length === 0) {
		const toDBFile = await saveMetadata(
			userId,
			parentId,
			fileName,
			"file",
			fileSize,
			token
		);
		console.log("toDBFile.affectedRows: ", toDBFile.affectedRows);
		if (toDBFile.affectedRows !== 1) {
			return res.status(500).json({ msg: "Something Wrong" });
		}
	} else {
		const updDBFile = await updMetadata(
			userId,
			parentId,
			fileName,
			"file",
			fileSize,
			token
		);
		console.log("updDBFile.affectedRows: ", updDBFile.affectedRows);
		if (updDBFile.affectedRows !== 1) {
			return res.status(500).json({ msg: "Something Wrong" });
		}
	}

  // TODO: check again the flow
	// update user.used
	const updUsed = await updateUsed(userId);
  const userInfo = await getUser("id", userId);
  // console.log("userInfo:", userInfo);
  req.session.user.used = userInfo.used;
	req.token = token;
	next();
};

const getS3Url = async (req, res) => {
	const { fileName, fileRelPath } = req.body;
	const fileSplit = parseInt(req.body.fileSplit);
	const userId = req.session.user.id;
	const token = req.token;
	const key = `user_${userId}/${fileRelPath ? fileRelPath : fileName}`;

	if (fileSplit === 1) {
		const singleUrl = await getSingleSignedUrl(
			s3clientGeneral,
			S3_MAIN_BUCKET_NAME,
			key
		);

		return res.json({ token, singleUrl });

	} else if (fileSplit > 1) {
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

	// TODO: not handling fail situation
	const commit = await commitMetadata(userId, "done", token);
	console.log(commit);

	// emit new file list
  emitNewList(req, userId, parentPath);

	return res.json({ msg: "complete" });
};

export { uploadChangeDB, getS3Url, uploadCommitDB };
