import {
	S3Client,
	PutObjectCommand,
	CreateMultipartUploadCommand,
	CompleteMultipartUploadCommand,
	UploadPartCommand,
	AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import fs from "fs";

import dotenv from "dotenv";
dotenv.config();
const {
	S3_BUCKET_REGION,
	S3_ACCESS_KEY_ID,
	S3_SECRET_ACCESS_KEY,
} = process.env;

const config = {
	credentials: {
		accessKeyId: S3_ACCESS_KEY_ID,
		secretAccessKey: S3_SECRET_ACCESS_KEY,
	},
	region: S3_BUCKET_REGION,
  logger: {
    log: (args) => console.log(args)
  }
};

const client = new S3Client(config);

// ==================================================================

// get the presigned URL for an entire file upload
async function getSingleSignedUrl(bucket, fileName, expiresIn) {
	const command = new PutObjectCommand({
		Bucket: bucket,
		Key: fileName,
	});

	return await getSignedUrl(client, command, { expiresIn });
}

// get the pre-signed URL for completing a multipart upload
async function getCompleteUrl(bucket, fileName, uploadId, expiresIn) {
	const command = new CompleteMultipartUploadCommand({
		Bucket: bucket,
		Key: fileName,
		UploadId: uploadId,
	});
	return await getSignedUrl(client, command, { expiresIn });
}

// get the pre-signed URL for a single part upload
async function getPartUrl(bucket, fileName, uploadId, partNumber, expiresIn) {
	const command = new UploadPartCommand({
		Bucket: bucket,
		Key: fileName,
		UploadId: uploadId,
		PartNumber: partNumber,
	});
	return await getSignedUrl(client, command, { expiresIn });
}

// upload large file
const largeUpload_notused = async (bucket, fileName, localPath, fileSize) => {
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

    // Complete Multipart
		const uploadResults = await Promise.all(uploadPromises);
		const cmdCompleteMultipart = new CompleteMultipartUploadCommand({
			Bucket: bucket,
			Key: fileName,
			UploadId: uploadId,
			MultipartUpload: {
				Parts: uploadResults.map(({ ETag }, i) => ({
					ETag: ETag,
					PartNumber: i + 1,
				})),
			},
		});
		return await client.send(cmdCompleteMultipart);
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

		// Complete Multipart
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

export { getSingleSignedUrl, getCompleteUrl, getPartUrl, largeUpload };
