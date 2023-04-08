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
    return response;
  } catch (err) {
    console.error("deleteOneObject: ", err);
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
      await deleteObject(client, bucket, contents[i].Key);
    }
    // if the item is a folder, call the same function recursively to delete its contents
    else if (contents[i].Key.endsWith("/")) {
      await deleteFolderAndContents(client, bucket, contents[i].Key);
    }
  }

  // delete the folder itself
  await deleteObject(client, bucket, key);
};

// const listObjectsUnderFolder = async (client, bucket, folderName) => {
//   const command = new ListObjectsV2Command({
//     Bucket: bucket,
//     Prefix: folderName,
//     StartAfter: folderName
//   });
//   try {
//     const response = await client.send(command);
//     return response;
//   } catch (err) {
//     console.error("listObjectsUnderFolder: ", err);
//     return false;
//   }
// };

export { 
  deleteObject,
  deleteFolderAndContents
};
