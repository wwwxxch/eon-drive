import { 
  S3Client, 
  GetObjectCommand 
} from "@aws-sdk/client-s3";

const client = new S3Client({ region: "ap-southeast-1" });

export async function handler(event) {
  const arr = event.downloadList;
  for (let i = 0; i < arr.length; i++) {
    console.log(arr[i]);
    try {
      const command = new GetObjectCommand({
        Bucket: "eondrive",
        Key: arr[i]
      });

      const response = await client.send(command);
      console.log(response.Body); 
    } catch(e) {
      console.error("lambda zipfiles: ", e);
    }
  }

  return { msg: "lambda zipfiles" };
};