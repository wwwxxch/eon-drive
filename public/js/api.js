const getFileList = async (path) => {
  let parentPath = "";
  if (path !== "Home") {
    parentPath = path.split("/").slice(1).join("/");
  }

	const getList = await fetch("/show-list", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ path: parentPath }),
	});
	const getListData = await getList.json();
  return getListData;
};

const uploadOneFileToS3 = async (path, file) => {
  console.log("path: ", path);  
  let relPath = "";
  if (path !== "Home") {
    relPath = path.split("/").slice(1).join("/");
  }

  if (file.webkitRelativePath) {
    relPath = ((relPath === "" ? "" : relPath + "/") + file.webkitRelativePath).trim();
  } else {
    relPath = ((relPath === "" ? "" : relPath + "/") + file.name).trim();
  }

  console.log("relPath: ", relPath);
	try {
		// get signed url from server
		const getURL = await fetch("/single-upload", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				filename: file.name,
				filesize: file.size,
				filetype: file.type,
				filerelpath: relPath,
			}),
		});

		if (getURL.status !== 200) {
			return { status: getURL.status };
		}

		// put file to s3
		const { singleUrl } = await getURL.json();
		const putFile = await fetch(singleUrl, {
			method: "PUT",
			headers: { "Content-Type": "multipart/form-data" },
			body: file,
		});

		return { status: putFile.status };
	} catch (e) {
		console.error("uploadOneFileToS3: ", e);
		return { error: e };
	}
};

const multipartToS3 = async (path, file, chunkArray) => {
  console.log("path: ", path);
  let relPath = "";
  if (path !== "Home") {
    relPath = path.split("/").slice(1).join("/");
  }

  if (file.webkitRelativePath) {
    relPath = ((relPath === "" ? "" : relPath + "/") + file.webkitRelativePath).trim();
  } else {
    relPath = ((relPath === "" ? "" : relPath + "/") + file.name).trim();
  }

  console.log("relPath: ", relPath);

	try {
		const createMultipart = await fetch("/multi-upload", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				count: chunkArray.length,
				filename: file.name,
				filesize: file.size,
				filetype: file.type,
				filerelpath: relPath,
			}),
		});

		if (createMultipart.status !== 200) {
			return { status: createMultipart.status };
		}

		// create multipart
		const multipartInfo = await createMultipart.json();
    console.log(multipartInfo);
		const { completeUrl, partUrls } = multipartInfo;
		const etagArray = Array(chunkArray.length);
		const putRequests = [];

		// multipart upload
		for (let i = 0; i < partUrls.length; i++) {
			const uploadMultipart = fetch(partUrls[i], {
				method: "PUT",
				headers: {
					"Content-Type": "application/octet-stream",
				},
				body: chunkArray[i],
			})
				.then((res) => {
					etagArray[i] = res.headers.get("etag").replace(/"/g, "");
				})
				.catch((err) => {
					console.error(err);
          return { status: err };
				});
			putRequests.push(uploadMultipart);
		}

		// complete multipart
		return Promise.all(putRequests).then(async () => {
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

			const multipartUpload = await fetch(completeUrl, {
				method: "POST",
				headers: { "Content-Type": "application/xml" },
				body: xmlBody,
			});

      return { status: multipartUpload.status }
		});
	} catch (e) {
		console.error("multipartToS3: ", e);
		return { status: e };
	}
};

const uploadMetadata = async(path, file) => {
  
  let parentPath = "";
  let wholePath = "";

  if (path !== "Home") {
    parentPath = path.split("/").slice(1).join("/");
  }

  if (file.webkitRelativePath) {
    wholePath = ((parentPath === "" ? "" : parentPath + "/") + file.webkitRelativePath).trim();
  } else {
    wholePath = ((parentPath === "" ? "" : parentPath + "/") + file.name).trim();
  }
  
  console.log("parentPath: ", parentPath);
  console.log("wholePath: ", wholePath);

  try {
    const metadataToServer = await fetch("/upload-metadata", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				filename: file.name,
				filesize: file.size,
				filerelpath: wholePath,
        parentPath: parentPath
			}),
		});

    return { status: metadataToServer.status };

  } catch (e) {
    console.error("uploadMetadata: ", e);
    return { status: e };
  }
};

export { 
  uploadOneFileToS3, 
  multipartToS3,
  uploadMetadata,
  getFileList
};
