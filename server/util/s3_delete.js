import { 
  S3Client, 
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command
} from "@aws-sdk/client-s3";

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
};
const client = new S3Client(config);
// ===========================================================
const deleteObject = async (bucket, fileName) => {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: fileName
  });
  try {
    const response = await client.send(command);
    return response;
  } catch (err) {
    console.error("deleteOneObject: ", err);
    return false;
  }
};

const deleteFolderAndContents = async (bucket, folderName) => {
  const listCMD = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: folderName,
    StartAfter: folderName
  });
  const listRes = await client.send(listCMD);
  const contents = listRes.Contents;
  
  // check if the folder is empty
  if (!contents) {
    await deleteObject(bucket, folderName);
    return;
  }

  // iterate through each item in the folder
  for (let i = 0; i < contents.length; i++) {
    // if the item is a file, delete it
    if (contents[i].Key !== folderName && !contents[i].Key.endsWith("/")) {
      await deleteObject(bucket, contents[i].Key);
    }
    // if the item is a folder, call the same function recursively to delete its contents
    else if (contents[i].Key.endsWith("/")) {
      await deleteFolderAndContents(bucket, contents[i].Key);
    }
  }

  // delete the folder itself
  await deleteObject(bucket, folderName);
};

const listObjectsUnderFolder = async (bucket, folderName) => {
  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: folderName,
    StartAfter: folderName
  });
  try {
    const response = await client.send(command);
    return response;
  } catch (err) {
    console.error("listObjectsUnderFolder: ", err);
    return false;
  }
};

export { 
  deleteObject,
  deleteFolderAndContents,
  listObjectsUnderFolder
};
