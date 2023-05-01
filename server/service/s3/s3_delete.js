import { 
  DeleteObjectCommand,
  ListObjectsV2Command
} from "@aws-sdk/client-s3";

// ===========================================================
const deleteObject = async (client, bucket, key) => {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key
  });
  try {
    const response = await client.send(command);
    // console.log("deleteObj: response: ", response);
    return true;
  } catch (e) {
    console.error("deleteOneObject: ", e);
    return false;
  }
};

const deleteAllVersionsForOneObject = async (client, bucket, key) => {
  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: key,
    });
    const listRes = await client.send(listCommand);
    const contents = listRes.Contents;
    // console.log("contents: ", contents);
    if (contents.length > 0) {
      for (let i = 0; i< contents.length; i++) {
        console.log("contents[i].Key: ", contents[i].Key);
        await deleteObject(client, bucket, contents[i].Key);
      }
    }
    return true;
  } catch(e) {
    console.error("deleteAllVersionsForOneObject: ", e);
    return false;
  }
};


const deleteFolderAndContents = async (client, bucket, key) => {
  const listCMD = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: key,
    StartAfter: key
  });
  const listRes = await client.send(listCMD);
  const contents = listRes.Contents;
  
  // if the folder is empty
  if (!contents) {
    // delete the folder itself
    await deleteObject(client, bucket, key);
    return;
  }

  // if the folder is not empty
  // iterate through each item in the folder
  for (let i = 0; i < contents.length; i++) {
    // if the item is a file, delete it
    if (contents[i].Key !== key && !contents[i].Key.endsWith("/")) {
      await deleteAllVersionsForOneObject(client, bucket, contents[i].Key);
    }
    // if the item is a folder, call the same function recursively to delete its contents
    else if (contents[i].Key.endsWith("/")) {
      await deleteFolderAndContents(client, bucket, contents[i].Key);
    }
  }

  // delete the folder itself
  await deleteObject(client, bucket, key);
};

export { 
  deleteObject,
  deleteFolderAndContents,
  deleteAllVersionsForOneObject
};
