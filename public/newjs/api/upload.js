import { CHUNK_SIZE } from "../constant/constant.js";
import { splitFileIntoChunks } from "../util/util.js";

const api_startUpload = "/upload-start";
const api_commitUpload = "/upload-commit";

const startUpload = async(fileName, fileWholePath, fileSize, fileSplit) => {
  try {
    const start = await axios({
      url: api_startUpload,
      method: "post",
      data: { fileName, fileWholePath, fileSize, fileSplit }
    });
    console.log("start.status: ", start.status);
    return start;
  } catch (e) {
    // TODO: find out what will be returned if there's error
    console.error("commitUpload: ", e);
    return e;
  }
};

const singleUpload = async(url, file) => {
  try {
    const putFile = await axios({
      url: url,
      method: "put",
      data: file,
      onUploadProgress: (progress) => {
        console.log( (progress.loaded/file.size)*100 );
      }
    });
    console.log("putFile: ", putFile);
    return { status: putFile.status };
  } catch (e) {
    console.error("singleUpload: ", e);
    // TODO: find out what will be returned if there's error
    return { status: e };
  }
};

const multiUpload = async(partUrls, completeUrl, chunkArray) => {
  const etagArray = Array(chunkArray.length);
  const putRequests = [];
  try {
    // upload parts
    for (let i = 0; i < partUrls.length; i++) {
      const putParts = fetch(partUrls[i], {
				method: "PUT",
				headers: {
					"Content-Type": "application/octet-stream",
				},
				body: chunkArray[i],
			})
				.then((res) => {
          console.log(`Part ${i+1} has been uploaded`);
					etagArray[i] = res.headers.get("etag").replace(/"/g, "");
				})
				.catch((err) => {
					console.error(err);
					return { status: err };
				});
      putRequests.push(putParts);
    }

    // complete multipart upload
    return Promise.all(putRequests).then(async() => {
			const xmlBody = `
          <CompleteMultipartUpload>
            ${etagArray
							.map((item, i) => {
								return `
                <Part>
                  <PartNumber>${i + 1}</PartNumber>
                  <ETag>${item}</ETag>
                </Part>
              `;
							})
							.join("")}
          </CompleteMultipartUpload>
        `;

			const completeMultipart = await fetch(completeUrl, {
				method: "POST",
				headers: { "Content-Type": "application/xml" },
				body: xmlBody,
			});
      console.log("completeMultipart.status: ", completeMultipart.status);
      return { status: completeMultipart.status };
		});
  } catch(e) {
    console.error("multiUpload: ", e);
    // TODO: find out what will be returned if there's error
    return { status: e };
  }
};

const commitUpload = async(token, parentPath) => {
  try {
    const commit = await axios({
      url: api_commitUpload,
      method: "post",
      data: {
        token: token,
        parentPath: parentPath
      }
    });
    console.log("commit.status: ", commit.status);
    return { status: commit.status };
  } catch (e) {
    console.error("commitUpload: ", e);
    // TODO: find out what will be returned if there's error
    return { status: e };
  }
};

// ==============================================================================
const uploadFile = async (currentDir, file) => {
  // 0. request payload
  let parentPath = "";
  if (currentDir !== "Home") {
    parentPath = currentDir.split("/").slice(1).join("/");
  }
  console.log("parentPath: ", parentPath);

  let wholePath = "";
  if (file.webkitRelativePath) {
    wholePath = ((parentPath === "" ? "" : parentPath + "/") + file.webkitRelativePath).trim();
  } else {
    wholePath = ((parentPath === "" ? "" : parentPath + "/") + file.name).trim();
  }
  console.log("wholePath: ", wholePath);

  let splitCount = 1;
  if (file.size > CHUNK_SIZE) {
    splitCount = Math.ceil(file.size / CHUNK_SIZE);
  }
  
  try {
    // 1. fetch /upload-start
    const getUrl = await startUpload(file.name, wholePath, file.size, splitCount);
    console.log("getUrl.status: ", getUrl.status);
    if (getUrl.status !== 200) {
      // TODO: if fetch /upload-start failed
      return false;
    }
    const { singleUrl, partUrls, completeUrl, token } = getUrl.data;
    
    // 2. fetch S3 presigned URL
    let toS3Res;
    if (singleUrl) {
      const singleUploadRes = await singleUpload(singleUrl, file);
      console.log("singleUploadRes: ", singleUploadRes);
      toS3Res = singleUploadRes.status;
    } else if (completeUrl) {
      const chunks = await splitFileIntoChunks(file, CHUNK_SIZE);
      const multiUploadRes = await multiUpload(partUrls, completeUrl, chunks);
      console.log("multiUploadRes: ", multiUploadRes);
      toS3Res = multiUploadRes.status; 
    } 

    if (toS3Res !== 200) {
      // TODO: if fetch s3 presigned URL failed
      return false;
    }

    // 3. fetch /upload-commit
    const commitUploadRes = await commitUpload(token, parentPath);
    console.log("commitUploadRes: ", commitUploadRes);
    if (commitUploadRes.status !== 200) {
      // TODO: if fetch /upload-commit failed
      return false;
    }
    
    return true;

  } catch (e) {
    console.error("uploadFile: ", e);
    return false;
  }
};

export { uploadFile };
