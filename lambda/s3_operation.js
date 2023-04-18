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

const DEFAULT_S3_EXPIRES = process.env.DEFAULT_S3_EXPIRES;
const CHUNK_SIZE = process.env.CHUNK_SIZE;

const tmpDir = "/tmp";
// ==================================================================================

// get the pre-signed URL for completing a multipart upload
const getCompleteUrl = async (
	client,
	bucket,
	key,
	uploadId,
	expiresIn = DEFAULT_S3_EXPIRES
) => {
	const command = new CompleteMultipartUploadCommand({
		Bucket: bucket,
		Key: key,
		UploadId: uploadId,
	});
	return await getSignedUrl(client, command, { expiresIn });
};

// upload large file (zip)
const largeUpload = async (client, bucket, key, localPath, fileSize) => {
	// Create Multipart Upload & Get uploadId
	const cmdCreateMultipartUpload = new CreateMultipartUploadCommand({
		Bucket: bucket,
		Key: key,
	});
	const multipartUpload = await client.send(cmdCreateMultipartUpload);
	console.log("largeUpload: multipartUpload: ", multipartUpload);
	// Upload Parts
	const uploadId = multipartUpload.UploadId;
	try {
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
		const completeUrl = await getCompleteUrl(
			client,
			bucket,
			key,
			uploadId,
			3600
		);
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
		// console.log(completeMulripart);
		return completeMultipart.status;
	} catch (e) {
		console.error("largeUpload: ", e);

		// Abort Multipart
		if (uploadId) {
			const abortCommand = new AbortMultipartUploadCommand({
				Bucket: bucket,
				Key: key,
				UploadId: uploadId,
			});
			const abort = await client.send(abortCommand);
			console.log("abort: ", abort);
		}
	}
};

// download files to local
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
							console.log(
								`get S3 object to local ${tmpDir}/${tmpLocalName} finished`
							);
							resolve();
						})
						.on("error", (err) => {
							console.error(
								`get S3 object to local ${tmpDir}/${tmpLocalName} error occurred`
							);
							reject(err);
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

// archive local files
const zipFiles = async (fileArray, parentPath, parentName) => {
	try {
		const archive = archiver("zip", { zlib: { level: 9 } });
		const output = fs.createWriteStream(`${tmpDir}/${parentName}.zip`);
		archive.on("error", (err) => {
			throw err;
		});
		archive.pipe(output);
		const parentPathModified = parentPath.replace(/\/$/, "").replace(/^\//, "");
		const appendPromises = [];
		// append files
		for (let i = 0; i < fileArray.length; i++) {
			let pathInZip;
			if (parentPathModified === "") {
				pathInZip = fileArray[i];
			} else {
				pathInZip = fileArray[i].slice(parentPathModified.length + 1);
			}
			const promise = new Promise((resolve) => {
				const stream = fs.createReadStream(
					`${tmpDir}/${fileArray[i].split("/").join("_")}`
				);
				stream.on("close", () => {
					console.log(`File ${pathInZip} appended to archive`);
					resolve();
				});
				archive.append(stream, { name: pathInZip });
			});
			appendPromises.push(promise);
		}
		// finish zip
		const zipPromise = new Promise((resolve) => {
			output.on("finish", () => {
				console.log("Archive finished");
				resolve();
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

// send zip file to S3
const zipToS3 = async (userId, client, bucket, parentName) => {
	const localZip = `${tmpDir}/${parentName}.zip`;
	const key = `user_${userId}/${parentName}.zip`;

	const fileSize = fs.statSync(localZip).size;
	console.log("fileSize: ", fileSize);

	// upload zip to S3
	if (fileSize < CHUNK_SIZE) {
		console.log("zipToS3 - one zip general upload");
		const putcommand = new PutObjectCommand({
			Body: fs.createReadStream(localZip),
			Bucket: bucket,
			Key: key,
		});
		const putZip = await client.send(putcommand);
		console.log("putZip: ", putZip);
	} else {
		console.log("zipToS3 - one zip multipart upload");
		const largeUploadRes = await largeUpload(
			client,
			bucket,
			key,
			localZip,
			fileSize
		);
		console.log("largeUploadRes: ", largeUploadRes);
	}

	// add Tag
	const puttaggingcommand = new PutObjectTaggingCommand({
		Bucket: bucket,
		Key: key,
		Tagging: {
			TagSet: [
				{
					Key: "zip",
					Value: "download",
				},
			],
		},
	});
	const putZipTag = await client.send(puttaggingcommand);
	console.log("putZipTag: ", putZipTag);

	// get URL to download
	const getcommand = new GetObjectCommand({
		Bucket: bucket,
		Key: key,
	});
	return await getSignedUrl(client, getcommand, 300);
};

module.exports = { getObjSave, zipFiles, zipToS3 };
