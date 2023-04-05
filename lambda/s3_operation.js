const {
	S3Client,
	GetObjectCommand,
	PutObjectCommand,
	CreateMultipartUploadCommand,
	CompleteMultipartUploadCommand,
	UploadPartCommand,
	AbortMultipartUploadCommand
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const archiver = require("archiver");
const fs = require("fs");

const client = new S3Client({ region: "ap-southeast-1" });

// ==================================================================================

// get the pre-signed URL for completing a multipart upload
async function getCompleteUrl(bucket, fileName, uploadId, expiresIn) {
	const command = new CompleteMultipartUploadCommand({
		Bucket: bucket,
		Key: fileName,
		UploadId: uploadId,
	});
	return await getSignedUrl(client, command, { expiresIn });
}


// upload large file
const largeUpload = async (bucket, fileName, localPath, fileSize) => {
	// Create Multipart Upload Command
	const cmdCreateMultipartUpload = new CreateMultipartUploadCommand({
		Bucket: bucket,
		Key: fileName,
	});
	const multipartUpload = await client.send(cmdCreateMultipartUpload);

	// Upload Part
	let uploadId = multipartUpload.UploadId;
	try {
		const uploadPromises = [];
		const partCount = Math.ceil(fileSize / (5 * 1024 * 1024));
		for (let i = 0; i < partCount; i++) {
			const start = i * (5 * 1024 * 1024);
			const end = Math.min(start + 5 * 1024 * 1024, fileSize);
			const cmdUploadPart = new UploadPartCommand({
				Bucket: bucket,
				Key: fileName,
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

		// Complete Multipart - Using presigned URL send the request manually
		const completeUrl = await getCompleteUrl(bucket, fileName, uploadId, 3600);
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
				Key: fileName,
				UploadId: uploadId,
			});
			const abort = await client.send(abortCommand);
			console.log("abort: ", abort);
		}
	}
};


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
			S3Objects[i] = fs.createWriteStream(`/tmp/${tempName[i]}`);
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
		const output = fs.createWriteStream(`/tmp/${parentName}.zip`);
		archive.on("error", (err) => {
			throw err;
		});
		archive.pipe(output);
		const appendPromises = [];
		for (let i = 0; i < fileArray.length; i++) {
			const promise = new Promise((resolve) => {
				const stream = fs.createReadStream(
					`/tmp/${fileArray[i].split("/").join("_")}`
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
	const fileSize = fs.statSync(`/tmp/${parentName}.zip`).size;
	console.log("fileSize: ", fileSize);
  // zip size < 5 MB
	if (fileSize < 5 * 1024 * 1024) {
		const putcommand = new PutObjectCommand({
			Body: fs.createReadStream(`/tmp/${parentName}.zip`),
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
			`/tmp/${parentName}.zip`,
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


module.exports = { getObjSave, zipFiles, zipToS3 };