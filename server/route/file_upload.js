import express from "express";
const router = express.Router();

import dotenv from "dotenv";
dotenv.config();
const { S3_BUCKET_NAME } = process.env;

import { wrapAsync, getFileListByPath } from "../util/util.js";

import { getSingleSignedUrl, getMultiSignedUrl } from "../util/s3_upload.js";

import {
	saveMetadata,
	updMetadata,
	getDirId,
	getFileId,
} from "../model/db_file.js";

import { authentication } from "../controller/user_auth.js";

// ------------------------------------------------------------------------------------
router.post("/upload-metadata", authentication, async (req, res) => {
	console.log("/upload-metadata: ", req.body);
	const { filename, filesize, filerelpath, parentPath } = req.body;
	const userId = req.session.user.id;

	// Parse the filerelpath to get the parent directory name and the file name
	const parts = filerelpath.split("/");
	const filenameOnly = parts.pop(); // only leave folders in parts array

	let parentId = 0;
	if (parts.length > 0) {
		for (let i = 0; i < parts.length; i++) {
			console.log(parts[i]);
			const chkDir = await getDirId(userId, parentId, parts[i]);
			if (chkDir.length === 0) {
				const toDBFolder = await saveMetadata(
					userId,
					parentId,
					parts[i],
					"folder",
					null
				);
				parentId = toDBFolder.insertId;
			} else {
				parentId = chkDir[0].id;
			}
		}
	}

	// check if this file id is existed
	const chkFileId = await getFileId(userId, parentId, filename);

	// Add new record or Update current record
	if (chkFileId.length === 0) {
		const toDBFile = await saveMetadata(
			userId,
			parentId,
			filename,
			"file",
			filesize
		);
		console.log(toDBFile);
		if (toDBFile.affectedRows !== 1) {
			return res.status(500).json({ msg: "Something Wrong" });
		}
	} else {
		const updDBFile = await updMetadata(
			userId,
			parentId,
			filename,
			"file",
			filesize
		);
		console.log(updDBFile);
		if (updDBFile.affectedRows !== 1) {
			return res.status(500).json({ msg: "Something Wrong" });
		}
	}

	// emit new file list
	const io = req.app.get("socketio");
	const refresh = await getFileListByPath(userId, parentPath);
	// console.log("refresh: ", refresh);
	io.emit("listupd", {
		parentPath: parentPath,
		list: refresh,
	});
	return res.json({ msg: "saved" });
});

// =====/single-upload
router.post("/single-upload", authentication, async (req, res) => {
	console.log("/single-upload: ", req.body);
	const userId = req.session.user.id;

	if (!req.body.filename) {
		return res.status(400).json({ msg: "error" });
	}

	const fileName = req.body.filerelpath
		? req.body.filerelpath
		: req.body.filename;

	const singleUrl = await getSingleSignedUrl(
		S3_BUCKET_NAME,
		`user_${userId}/${fileName}`,
		3600
	);

	return res.status(200).json({ singleUrl });
});

// =====/multi-upload
router.post("/multi-upload", authentication, async (req, res) => {
	console.log("multi-upload: ", req.body);
	const { count } = req.body;
	const userId = req.session.user.id;

	if (!req.body.filename) {
		return res.status(400).json({ msg: "error" });
	}

	const fileName = req.body.filerelpath
		? req.body.filerelpath
		: req.body.filename;

	const { partUrls, completeUrl } = await getMultiSignedUrl(
		S3_BUCKET_NAME,
		`user_${userId}/${fileName}`,
		count,
		3600
	);

	return res.json({
		partUrls: partUrls,
		completeUrl: completeUrl,
	});
});

export { router as file_upload };
