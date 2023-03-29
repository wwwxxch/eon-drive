import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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

async function getSignedFileUrl(fileName, bucket, expiresIn) {
	const command = new PutObjectCommand({
		Bucket: bucket,
		Key: fileName,
	});

	return await getSignedUrl(client, command, { expiresIn });
}

export default getSignedFileUrl;
