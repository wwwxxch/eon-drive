import { 
  S3Client, 
  PutObjectCommand
} from "@aws-sdk/client-s3";

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

const createFolder = async(bucket, folderName) => {
  const folderKey = `${folderName}/`;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: folderKey,
    Body: ""
  });
  try {
    const response = await client.send(command);
    return response;
  } catch (err) {
    console.error("createFolder: ", err);
    return false;
  }
};

export { 
  createFolder
};
