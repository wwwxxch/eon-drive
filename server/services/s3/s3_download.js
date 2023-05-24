import {
	GetObjectCommand,
	PutObjectCommand,
	PutObjectTaggingCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import archiver from "archiver";
import fs from "fs";

import dotenv from "dotenv";
dotenv.config();

const DEFAULT_S3_EXPIRES = parseInt(process.env.DEFAULT_S3_EXPIRES);
const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE * 1024 * 1024);
const ZIP_SIZE = parseInt(process.env.ZIP_SIZE * 1024 * 1024 * 1024);

import { largeUpload } from "./s3_upload.js";

import { mkdir, access } from "node:fs/promises";
import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.join(__dirname, "../../../");

// const tmpDir = ".";
const tmpDir = process.env.TMP_DIR;
// ==================================================================
// get download url for one object
const getDownloadUrl = async (
	client,
	bucket,
	fileName,
	expiresIn = DEFAULT_S3_EXPIRES
) => {
	const command = new GetObjectCommand({
		Bucket: bucket,
		Key: fileName,
	});
	try {
		const url = await getSignedUrl(client, command, { expiresIn });
		// console.log("url: ", url);
		return url;
	} catch (e) {
		console.error("getDownloadUrl: ", e);
		return null;
	}
};

// step 0 create folders per user
const createLocalFolder = async (user_id) => {
	let userFolderPath;
	if (process.env.NODE_ENV === "dev") {
		userFolderPath = `${rootPath}/user_${user_id}`;
	} else {
		userFolderPath = `${tmpDir}/user_${user_id}`;
	}
	try {
		// check if folder already exists
		await access(userFolderPath, fs.constants.F_OK);
		console.log(`Folder ${userFolderPath} already exists`);
		return true;
	} catch (e) {
		if (e.code === "ENOENT") {
			try {
				const createDir = await mkdir(userFolderPath, { recursive: true });
				console.log(`created user folder ${createDir}`);
				return true;
			} catch (e) {
				console.error("createLocalFolder: ", e);
				return false;
			}
		} else {
			console.error("createLocalFolder: ", e);
			return false;
		}
	}
};

// step 1. getObjSave - download files to local
const getObjSave = async (client, bucket, s3fileArray, fileArray, userId) => {
	try {
		let tmpLocalName;
		let S3Objects = [];
		let writePromises = [];
		for (let i = 0; i < s3fileArray.length; i++) {
			// download object from S3
			const command = new GetObjectCommand({
				Bucket: bucket,
				Key: s3fileArray[i],
			});
			const getS3Object = await client.send(command);

			// save object to local
			tmpLocalName = fileArray[i].split("/").join("_");
			console.log("tmpLocalName: ", tmpLocalName);

			S3Objects[i] = fs.createWriteStream(`${tmpDir}/user_${userId}/${tmpLocalName}`);
			writePromises.push(
				new Promise((resolve, reject) => {
					getS3Object.Body.pipe(S3Objects[i])
						.on("finish", () => {
							console.log(
								`get S3 object to local ${tmpDir}/user_${userId}/${tmpLocalName} finished`
							);
							resolve();
						})
						.on("error", (err) => {
							reject(
								`get S3 object to local ${tmpDir}/user_${userId}/${tmpLocalName} error: ${err}`
							);
						});
				})
			);
		}
		await Promise.all(writePromises);
		console.log("getObjSave: done");
		return true;
	} catch (e) {
		console.error("getObjSave: ", e);
		return false;
	}
};

// step 2. zipFiles - archive local files
const zipFiles = async (fileArray, parentPath, parentName, userId) => {
	try {
		// 1. create zip file & write stream
		const archive = archiver("zip", { zlib: { level: 9 } });
		const output = fs.createWriteStream(`${tmpDir}/user_${userId}/${parentName}.zip`);
		archive.on("error", (err) => {
			throw new Error(`archive error: ${err}`);
		});
		archive.pipe(output);
		const parentPathModified = parentPath.replace(/\/$/, "").replace(/^\//, "");
		const appendPromises = [];
		// 2. read stream & append files
		for (let i = 0; i < fileArray.length; i++) {
			let pathInZip;
			if (parentPathModified === "") {
				pathInZip = fileArray[i];
			} else {
				pathInZip = fileArray[i].slice(parentPathModified.length + 1);
			}
			appendPromises.push(
				new Promise((resolve, reject) => {
					const stream = fs.createReadStream(
						`${tmpDir}/user_${userId}/${fileArray[i].split("/").join("_")}`
					);

					stream.on("close", () => {
						console.log(`File ${pathInZip} appended to archive`);
						resolve();
					});

					stream.on("error", (err) => {
						reject(`Error reading file ${fileArray[i]}: ${err}`);
					});

					archive.append(stream, { name: pathInZip });
				})
			);
		}
		// 3. finish zip
		const zipPromise = new Promise((resolve, reject) => {
			output.on("finish", () => {
				console.log("Archive finished");
				resolve();
			});

			output.on("error", (err) => {
				reject(`Creating zip file error: ${err}`);
			});
		});
		// TODO: await archive.finalize(); ??
		archive.finalize();
		await Promise.all([...appendPromises, zipPromise]);
		console.log("zipFiles: done");
		return true;
	} catch (e) {
		console.error("zipFiles: ", e);
		return false;
	}
};

// step 3. zipToS3 - send zip file to S3
const zipToS3 = async (userId, client, bucket, parentName) => {
	const localZip = `${tmpDir}/user_${userId}/${parentName}.zip`;
	const key = `user_${userId}/${parentName}.zip`;

	const fileSize = fs.statSync(localZip).size;
	console.log("fileSize: ", fileSize, " bytes");
	if (fileSize > ZIP_SIZE) {
		throw new Error("file size exceeds 4 GB");
	}

	try {
		// upload zip to S3
		if (fileSize < CHUNK_SIZE) {
			console.log("zipToS3 - single upload");
			const putCommand = new PutObjectCommand({
				Body: fs.createReadStream(localZip),
				Bucket: bucket,
				Key: key,
			});
			const putZip = await client.send(putCommand);
			console.log("putZip: ", putZip);
		} else {
			console.log("zipToS3 - multipart upload");
			const largeUploadRes = await largeUpload(client, bucket, key, localZip, fileSize);
			console.log("largeUploadRes: ", largeUploadRes);
			if (largeUploadRes !== 200) {
				throw new Error("largeUpload failed");
			}
		}

		// add Tag
		// const putTaggingCommand = new PutObjectTaggingCommand({
		// 	Bucket: bucket,
		// 	Key: key,
		// 	Tagging: {
		// 		TagSet: [
		// 			{
		// 				Key: "zip",
		// 				Value: "download",
		// 			},
		// 		],
		// 	},
		// });
		// const putZipTag = await client.send(putTaggingCommand);
		// console.log("putZipTag: ", putZipTag);

		// get URL to download
		const getCommand = new GetObjectCommand({
			Bucket: bucket,
			Key: key,
		});
		const url = await getSignedUrl(client, getCommand, 300);
		return { status: 200, url };
	} catch (e) {
		console.error("zipToS3: ", e);
		return { status: 500, error: e };
	}
};

export { getDownloadUrl, createLocalFolder, getObjSave, zipFiles, zipToS3 };
