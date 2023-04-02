import { 
  S3Client, 
  PutObjectCommand,
  CreateMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  UploadPartCommand 
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import dotenv from "dotenv";
dotenv.config();
const {
	// S3_BUCKET_NAME,
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
};

const client = new S3Client(config);

// Single File
async function getSingleSignedUrl(bucket, fileName, expiresIn) {
	const command = new PutObjectCommand({
		Bucket: bucket,
		Key: fileName,
	});

	return await getSignedUrl(client, command, { expiresIn });
}

// Multi Files

// get the pre-signed URL for completing a multipart upload
async function getCompleteUrl(bucket, fileName, uploadId, expiresIn) {
  const command = new CompleteMultipartUploadCommand({
    Bucket: bucket,
    Key: fileName,
    UploadId: uploadId
  });
  return await getSignedUrl(client, command, { expiresIn });
}

// get the pre-signed URL for a single part upload
async function getPartUrl(bucket, fileName, uploadId, partNumber, expiresIn) {
  const command = new UploadPartCommand({
    Bucket: bucket,
    Key: fileName,
    UploadId: uploadId,
    PartNumber: partNumber
  });
  return await getSignedUrl(client, command, { expiresIn });
}

export { 
  getSingleSignedUrl,
  getCompleteUrl,
  getPartUrl
};
