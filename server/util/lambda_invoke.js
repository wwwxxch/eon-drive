import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import dotenv from "dotenv";
dotenv.config();
const { S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, LAMBDA_REGION } = process.env;

const config = {
	credentials: {
		accessKeyId: S3_ACCESS_KEY_ID,
		secretAccessKey: S3_SECRET_ACCESS_KEY,
	},
	region: LAMBDA_REGION,
};

const lambdaClient = new LambdaClient(config);

const callLambdaZip = async (finalList, parentName) => {
  const command = new InvokeCommand({
    FunctionName: "zipfiles", // lambda function name - zip files
    Payload: JSON.stringify({ finalList: finalList, parentName: parentName })
  });
  const result = await lambdaClient.send(command);
  const decoder = new TextDecoder("utf-8");
  const payloadString = decoder.decode(result.Payload);
  return JSON.parse(payloadString);
};

export { callLambdaZip };

// const invokeCommand = new InvokeCommand({
// 	FunctionName: "helloworld",
// 	Payload: JSON.stringify({ test: "1602" }),
// });

// const result = await lambdaClient.send(invokeCommand);
// console.log(result);

// const decoder = new TextDecoder("utf-8");
// const payloadString = decoder.decode(result.Payload);
// console.log(payloadString);
