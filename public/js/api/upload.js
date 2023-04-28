import { CHUNK_SIZE } from "../constant/constant.js";
import { splitFileIntoChunks } from "../util/util.js";

const startUpload = async(fileName, fileWholePath, fileSize, fileSplit) => {
  try {
    const start = await axios({
      url: "/upload-start",
      method: "post",
      data: { fileName, fileWholePath, fileSize, fileSplit }
    });
    console.log("start.status: ", start.status);
    return start;
  } catch (e) {
    console.error("startUpload: ", e);
    return { status: e.response.status };
  }
};

const singleUpload = async(url, file) => {
  try {
    const putFile = await axios({
      url: url,
      method: "put",
      data: file,
    });
    console.log("putFile: ", putFile);
    return { status: putFile.status };
  } catch (e) {
    console.error("singleUpload: ", e);
    return { status: e.response.status };
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
    return { status: e.response.status };
  }
};

const commitUpload = async(token, parentPath) => {
  try {
    const commit = await axios({
      url: "/upload-commit",
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
    return { status: e.response.status };
  }
};

// ==============================================================================
const uploadFile = async (currentDir, file, modal, status) => {
  
  modal.modal("show");
  status.text("Uploading...");
  $("#waiting-spinner").addClass("spinner-border");
  $(".waiting-complete").hide();

  let fileUsed = {};
  if (file.modified) {
    fileUsed.name = file.file.name;
    fileUsed.size = file.file.size;
    fileUsed.webkitRelativePath = file.webkitRelativePath;
  } else {
    fileUsed = file;
  }

  // 0. request payload
  let parentPath = "";
  if (currentDir !== "Home") {
    parentPath = currentDir.split("/").slice(1).join("/");
  }
  console.log("parentPath: ", parentPath);

  let wholePath = "";
  if (fileUsed.webkitRelativePath) {
    wholePath = ((parentPath === "" ? "" : parentPath + "/") + fileUsed.webkitRelativePath).trim();
  } else {
    wholePath = ((parentPath === "" ? "" : parentPath + "/") + fileUsed.name).trim();
  }
  console.log("wholePath: ", wholePath);

  let splitCount = 1;
  if (fileUsed.size > CHUNK_SIZE) {
    splitCount = Math.ceil(fileUsed.size / CHUNK_SIZE);
  }
  
  try {
    // 1. fetch /upload-start
    const getUrl = await startUpload(fileUsed.name, wholePath, fileUsed.size, splitCount);
    console.log("getUrl.status: ", getUrl.status);

    if (getUrl.status === 400) {  
      $("#waiting-spinner").removeClass("spinner-border");
      status.text("No enough space");
      setTimeout(() => modal.modal("hide"), 1500);
      return false;
    } else if (getUrl.status !== 200) {
      $("#waiting-spinner").removeClass("spinner-border");
      status.text("Opps! Something went wrong");
      setTimeout(() => modal.modal("hide"), 1500);
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
      console.error("toS3Res: ", toS3Res);
      $("#waiting-spinner").removeClass("spinner-border");
      status.text("Opps! Something went wrong");
      setTimeout(() => modal.modal("hide"), 1500);
      return false;
    }

    // 3. fetch /upload-commit
    const commitUploadRes = await commitUpload(token, parentPath);
    if (commitUploadRes.status !== 200) {
      $("#waiting-spinner").removeClass("spinner-border");
      status.text("Opps! Something went wrong");
      setTimeout(() => modal.modal("hide"), 1500);
      return false;
    }

    $("#waiting-spinner").removeClass("spinner-border");
    $(".waiting-complete").show();
    setTimeout(() => status.text("Complete!"), 200);
    // modal.modal({backdrop: true});
    // TODO: try to setup data-bas-backdrop to true
    modal.data("bs-backdrop", true);
    setTimeout(() => modal.modal("hide"), 1500);

    return true;

  } catch (e) {
    console.error("uploadFile: ", e);
    return false;
  }
};

export { uploadFile };
