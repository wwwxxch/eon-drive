import {
	S3Client,
	GetObjectCommand,
	PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import archiver from "archiver";
import fs from "fs";

import dotenv from "dotenv";
dotenv.config();
const { S3_BUCKET_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } =
	process.env;

const config = {
	credentials: {
		accessKeyId: S3_ACCESS_KEY_ID,
		secretAccessKey: S3_SECRET_ACCESS_KEY,
	},
	region: S3_BUCKET_REGION,
};

const client = new S3Client(config);

import { largeUpload } from "./s3_upload.js";

// ==================================================================
async function getDownloadUrl(bucket, fileName, expiresIn) {
	const command = new GetObjectCommand({
		Bucket: bucket,
		Key: fileName,
	});

	return await getSignedUrl(client, command, { expiresIn });
}

// download files to local
async function getObjSave(bucket, fileArray) {
	try {
		let S3Objects = [];
		let tempName = [];
		let writePromises = [];
		for (let i = 0; i < fileArray.length; i++) {
			const command = new GetObjectCommand({
				Bucket: bucket,
				Key: fileArray[i],
			});

			const response = await client.send(command);

			tempName[i] = fileArray[i].split("/").join("_");
			console.log(tempName[i]);
			S3Objects[i] = fs.createWriteStream(`./${tempName[i]}`);
			writePromises.push(
				new Promise((resolve, reject) => {
					response.Body.pipe(S3Objects[i])
						.on("finish", () => {
							console.log("finished");
							resolve();
						})
						.on("error", (err) => {
							console.error("error occurred");
							reject(err);
						});
				})
			);
		}

		await Promise.all(writePromises);
		return "done";
	} catch (e) {
		console.error("getObjSave: ", e);
		return false;
	}
}

// archive local files
async function zipFiles(fileArray, parentName) {
	try {
		const archive = archiver("zip", { zlib: { level: 9 } });
		const output = fs.createWriteStream(`./${parentName}.zip`);
		archive.on("error", (err) => {
			throw err;
		});
		archive.pipe(output);
		const appendPromises = [];
		for (let i = 0; i < fileArray.length; i++) {
			const promise = new Promise((resolve) => {
				const stream = fs.createReadStream(
					`./${fileArray[i].split("/").join("_")}`
				);
				stream.on("close", () => {
					console.log(`File ${fileArray[i]} appended to archive`);
					resolve();
				});
				archive.append(stream, { name: fileArray[i] });
			});
			appendPromises.push(promise);
		}
		const zipPromise = new Promise((resolve) => {
			output.on("finish", () => {
				console.log("Archive finished");
				resolve();
			});
		});
		archive.finalize();
		await Promise.all([...appendPromises, zipPromise]);
		return "zip done";
	} catch (e) {
		console.error("zipFiles: ", e);
		return false;
	}
}

// send zip file to S3
const zipToS3 = async (bucket, parentName) => {
	const fileSize = fs.statSync(`./${parentName}.zip`).size;
	console.log("fileSize: ", fileSize);
  // zip size < 5 MB
	if (fileSize < 5 * 1024 * 1024) {
		const putcommand = new PutObjectCommand({
			Body: fs.createReadStream(`./${parentName}.zip`),
			Bucket: bucket,
			Key: `zipfile/${parentName}.zip`,
		});
		const putZip = await client.send(putcommand);
		console.log("putZip: ", putZip);
  // zip size >= 5 MB
	} else {
		const largeUploadRes = await largeUpload(
			bucket,
			`zipfile/${parentName}.zip`,
			`./${parentName}.zip`,
      fileSize
		);
		console.log("largeUploadRes: ", largeUploadRes);
	}

  // get URL to download
	const getcommand = new GetObjectCommand({
		Bucket: bucket,
		Key: `zipfile/${parentName}.zip`,
	});
	return await getSignedUrl(client, getcommand, 300);
};

export { getDownloadUrl, getObjSave, zipFiles, zipToS3 };
