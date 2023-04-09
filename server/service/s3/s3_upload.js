import {
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

const DEFAULT_S3_EXPIRES = parseInt(process.env.DEFAULT_S3_EXPIRES);
const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE * 1024 * 1024);

// ==================================================================

// get the presigned URL for an entire file upload
const getSingleSignedUrl = async (client, bucket, key, expiresIn = DEFAULT_S3_EXPIRES) => {
	const command = new PutObjectCommand({
		Bucket: bucket,
		Key: key,
	});
	return await getSignedUrl(client, command, { expiresIn });
};

// get the pre-signed URL for completing a multipart upload
const getCompleteUrl = async (client, bucket, key, uploadId, expiresIn = DEFAULT_S3_EXPIRES) => {
	const command = new CompleteMultipartUploadCommand({
		Bucket: bucket,
		Key: key,
		UploadId: uploadId,
	});
	return await getSignedUrl(client, command, { expiresIn });
};

// get the pre-signed URL for a single part upload
const getPartUrl = async (client, bucket, key, uploadId, partNumber, expiresIn = DEFAULT_S3_EXPIRES) => {
	const command = new UploadPartCommand({
		Bucket: bucket,
		Key: key,
		UploadId: uploadId,
		PartNumber: partNumber,
	});
	return await getSignedUrl(client, command, { expiresIn });
};

// get partUrls & completeUrl for multipart upload
const getMultiSignedUrl = async (client, bucket, key, count, expiresIn = 900 ) => {
	// Create Multipart Upload & Get uploadId
  const command = new CreateMultipartUploadCommand({
		Bucket: bucket,
		Key: key,
	});
	const createMultipartUpload = await client.send(command);
	const uploadId = createMultipartUpload.UploadId;
  
  // Get partUrls
	const partUrls = await Promise.all(
		Array.from({ length: count }, (v, k) => k + 1).map((item) =>
			getPartUrl(client, bucket, key, uploadId, item, expiresIn)
		)
	);

  // Get completeUrl
	const completeUrl = await getCompleteUrl(client, bucket, key, uploadId, expiresIn);

	return { partUrls: partUrls, completeUrl: completeUrl };
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

export { 
  getSingleSignedUrl, 
  getCompleteUrl, 
  getPartUrl, 
  getMultiSignedUrl, 
  largeUpload 
};
