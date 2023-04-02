const getFileList = async (path) => {
	const getList = await fetch("/v2/list", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ path: path }),
	});
	const getListData = await getList.json();
  return getListData;
};

const uploadOneFileToS3 = async (path, file) => {
	console.log("uploadOneFileToS3: ", file);
  console.log("path: ", path);
  
  let relPath = path !== "Home" ? 
    path.split("/").slice(1).join("/") 
    : "";
  relPath = file.webkitRelativePath ? 
    relPath + "/" + file.webkitRelativePath 
    : relPath = relPath + "/" + file.name;

  console.log(relPath);
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
			return false;
		}

		// put file to s3
		const { singleUrl } = await getURL.json();
		const putFile = await fetch(singleUrl, {
			method: "PUT",
			headers: { "Content-Type": "multipart/form-data" },
			body: file,
		});

		if (putFile.status !== 200) {
			return false;
		}

		return true;
	} catch (e) {
		console.error("uploadOneFileToS3: ", e);
		return false;
	}
};

const multipartToS3 = async (path, file, chunkArray) => {
  let relPath = path !== "Home" ? 
    path.split("/").slice(1).join("/") 
    : "";
  relPath = file.webkitRelativePath ? 
    relPath + "/" + file.webkitRelativePath 
    : relPath = relPath + "/" + file.name;

  console.log(relPath);

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
			return false;
		}

		// create multipart
		const multipartInfo = await createMultipart.json();
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
				});
			putRequests.push(uploadMultipart);
		}

		// complete multipart
		Promise.all(putRequests).then(async () => {
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

			fetch(completeUrl, {
				method: "POST",
				headers: { "Content-Type": "application/xml" },
				body: xmlBody,
			});
		});
	} catch (e) {
		console.error("multipartToS3: ", e);
		return false;
	}
};

const uploadMetadata = async(path, file) => {
  console.log("path: ", path);
  
  let relPath = path !== "Home" ? 
    path.split("/").slice(1).join("/") 
    : "";
  relPath = file.webkitRelativePath ? 
    relPath + "/" + file.webkitRelativePath 
    : relPath = relPath + "/" + file.name;

  console.log(relPath);
  try {
    const metadataToServer = await fetch("/upload-metadata", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				filename: file.name,
				filesize: file.size,
				filerelpath: relPath,
			}),
		});
    if (metadataToServer.status !== 200) {
      return false;
    }
    return true;
  } catch (e) {
    console.error("uploadMetadata: ", e);
    return false;
  }
};

export { 
  uploadOneFileToS3, 
  multipartToS3,
  uploadMetadata,
  getFileList
};
