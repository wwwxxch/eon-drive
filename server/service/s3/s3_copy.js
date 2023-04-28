import { CopyObjectCommand } from "@aws-sdk/client-s3";

const copyS3Obj = async(client, bucket, fromKey, toKey) => {
  const command = new CopyObjectCommand({
    Bucket: bucket,
    CopySource: `${bucket}/${fromKey}`,
    Key: toKey
  });
  try {
    const response = await client.send(command);
    // console.log("copyS3Obj: response: ", response);
    return true;
  } catch (err) {
    console.error("copyS3Obj: ", err);
    return false;
  }
};

export { copyS3Obj };
