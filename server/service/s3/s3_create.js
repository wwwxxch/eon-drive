import { PutObjectCommand } from "@aws-sdk/client-s3";

const createS3Folder = async(client, bucket, key) => {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: `${key}/`,
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
  createS3Folder
};
