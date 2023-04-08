import { S3Client } from "@aws-sdk/client-s3";

import dotenv from "dotenv";
dotenv.config();
const { 
  S3_MAIN_BUCKET_REGION,
  S3_DOWNLOAD_BUCKET_REGION, 
  IAM_USER_ACCESS_KEY_ID, 
  IAM_USER_SECRET_ACCESS_KEY 
} = process.env;

// bucket for upload & delete
const configGeneral = {
	credentials: {
		accessKeyId: IAM_USER_ACCESS_KEY_ID,
		secretAccessKey: IAM_USER_SECRET_ACCESS_KEY,
	},
	region: S3_MAIN_BUCKET_REGION
};

const s3clientGeneral = new S3Client(configGeneral);

// bucket for download
const configDownload = {
  credentials: {
		accessKeyId: IAM_USER_ACCESS_KEY_ID,
		secretAccessKey: IAM_USER_SECRET_ACCESS_KEY,
	},
	region: S3_DOWNLOAD_BUCKET_REGION
};

const s3clientDownload = new S3Client(configDownload);

// -----------------------------------------------------------
export { s3clientGeneral, s3clientDownload };
