import { PutObjectCommand } from "@aws-sdk/client-s3";

const createS3Folder = async(client, bucket, key) => {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: `${key}/`,
    Body: ""
  });
  try {
    const response = await client.send(command);
    // console.log("createS3Folder: response: ", response);
    return true;
  } catch (err) {
    console.error("createFolder: ", err);
    return false;
  }
};

export { 
  createS3Folder
};
