const {
	GetObjectCommand,
	PutObjectCommand,
	PutObjectTaggingCommand,
	CreateMultipartUploadCommand,
	CompleteMultipartUploadCommand,
	UploadPartCommand,
	AbortMultipartUploadCommand,
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const archiver = require("archiver");
const fs = require("fs");

const DEFAULT_S3_EXPIRES = parseInt(process.env.DEFAULT_S3_EXPIRES);
const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE * 1024 * 1024);
const ZIP_SIZE = parseInt(process.env.ZIP_SIZE * 1024 * 1024 * 1024);

const tmpDir = "/tmp";
// ==================================================================================

// get the pre-signed URL for completing a multipart upload
const getCompleteUrl = async (client, bucket, key, uploadId, expiresIn = DEFAULT_S3_EXPIRES) => {
	const command = new CompleteMultipartUploadCommand({
		Bucket: bucket,
		Key: key,
		UploadId: uploadId,
	});
	return await getSignedUrl(client, command, { expiresIn });
};

// upload large file (zip)
const largeUpload = async (client, bucket, key, localPath, fileSize) => {
	console.log("check: largeUpload: ", bucket, key, localPath, fileSize);
	try {
		// Create Multipart Upload & Get uploadId
		const cmdCreateMultipartUpload = new CreateMultipartUploadCommand({
			Bucket: bucket,
			Key: key,
		});

		const multipartUpload = await client.send(cmdCreateMultipartUpload);
		console.log("largeUpload: multipartUpload: ", multipartUpload);

		// Upload Parts
		const uploadId = multipartUpload.UploadId;
		const uploadPromises = [];
		const partCount = Math.ceil(fileSize / parseInt(CHUNK_SIZE));

		for (let i = 0; i < partCount; i++) {
			const start = i * parseInt(CHUNK_SIZE);
			const end = Math.min(start + parseInt(CHUNK_SIZE), fileSize);
			const cmdUploadPart = new UploadPartCommand({
				Bucket: bucket,
				Key: key,
				UploadId: uploadId,
				Body: fs.createReadStream(localPath, { start, end }),
				ContentLength: end - start,
				PartNumber: i + 1,
			});
			uploadPromises.push(
				client.send(cmdUploadPart).then((data) => {
					console.log("Part", i + 1, "uploaded");
					return data;
				})
			);
		}

		// Complete Multipart Upload - Using presigned URL send the request manually
		const completeUrl = await getCompleteUrl(client, bucket, key, uploadId, 3600);
		const uploadResults = await Promise.all(uploadPromises);
		const xmlBody = `
      <CompleteMultipartUpload>
        ${uploadResults
					.map((item, i) => {
						return `
            <Part>
              <PartNumber>${i + 1}</PartNumber>
              <ETag>${item.ETag.replace(/"/g, "")}</ETag>
            </Part>
          `;
					})
					.join("")}
      </CompleteMultipartUpload>
    `;
		const completeMultipart = await fetch(completeUrl, {
			method: "POST",
			headers: { "Content-Type": "application/xml" },
			body: xmlBody,
		});
		console.log("completeMultipart: ", completeMultipart);
		return completeMultipart.status;
	} catch (e) {
		console.error("largeUpload: ", e);

		// Abort Multipart
		// if (uploadId) {
		// 	const abortCommand = new AbortMultipartUploadCommand({
		// 		Bucket: bucket,
		// 		Key: key,
		// 		UploadId: uploadId,
		// 	});
		// 	const abort = await client.send(abortCommand);
		// 	console.log("abort: ", abort);
		// }
		return e["$metadata"].httpStatusCode;
	}
};

// step 1. getObjSave - download files to local
const getObjSave = async (client, bucket, s3fileArray, fileArray) => {
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

			S3Objects[i] = fs.createWriteStream(`${tmpDir}/${tmpLocalName}`);
			writePromises.push(
				new Promise((resolve, reject) => {
					getS3Object.Body.pipe(S3Objects[i])
						.on("finish", () => {
							console.log(`get S3 object to local ${tmpDir}/${tmpLocalName} finished`);
							resolve();
						})
						.on("error", (err) => {
							reject(`get S3 object to local ${tmpDir}/${tmpLocalName} error: ${err}`);
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
const zipFiles = async (fileArray, parentPath, parentName) => {
	try {
		// 1. create zip file & write stream
		const archive = archiver("zip", { zlib: { level: 9 } });
		const output = fs.createWriteStream(`${tmpDir}/${parentName}.zip`);
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
			// const promise = new Promise((resolve, reject) => {
			appendPromises.push(
				new Promise((resolve, reject) => {
					const stream = fs.createReadStream(`${tmpDir}/${fileArray[i].split("/").join("_")}`);

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
			// appendPromises.push(promise);
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
	const localZip = `${tmpDir}/${parentName}.zip`;
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
			const putcommand = new PutObjectCommand({
				Body: fs.createReadStream(localZip),
				Bucket: bucket,
				Key: key,
			});
			const putZip = await client.send(putcommand);
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
		// const puttaggingcommand = new PutObjectTaggingCommand({
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
		// const putZipTag = await client.send(puttaggingcommand);
		// console.log("putZipTag: ", putZipTag);

		// get URL to download
		const getcommand = new GetObjectCommand({
			Bucket: bucket,
			Key: key,
		});
		const url = await getSignedUrl(client, getcommand, 300);
		return { status: 200, url };
	} catch (e) {
		console.error("zipToS3: ", e);
		return { status: 500, error: e };
	}
};

module.exports = { getObjSave, zipFiles, zipToS3 };
