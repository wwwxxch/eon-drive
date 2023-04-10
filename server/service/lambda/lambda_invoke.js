import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import dotenv from "dotenv";
dotenv.config();
const { IAM_USER_ACCESS_KEY_ID, IAM_USER_SECRET_ACCESS_KEY, LAMBDA_REGION } = process.env;

const config = {
	credentials: {
		accessKeyId: IAM_USER_ACCESS_KEY_ID,
		secretAccessKey: IAM_USER_SECRET_ACCESS_KEY,
	},
	region: LAMBDA_REGION,
};

const lambdaClient = new LambdaClient(config);

const callLambdaZip = async (userId, finalList, parentPath, parentName) => {
  console.log("callLambdaZip: parameters: ", userId, finalList, parentPath, parentName);
  const command = new InvokeCommand({
    FunctionName: "zipfiles", // lambda function name - zip files
    Payload: JSON.stringify({ 
      userId: userId,
      finalList: finalList, 
      parentPath: parentPath,
      parentName: parentName 
    })
  });
  const result = await lambdaClient.send(command);
  const decoder = new TextDecoder("utf-8");
  const payloadString = decoder.decode(result.Payload);
  return JSON.parse(payloadString);
};

export { callLambdaZip };
