const api_destination = "/v2/download";

const downloadFile = async (path, fileArray) => {
	// request body
  let parentPath;
	const downloadList = fileArray.toArray().map((item) => {
		if (path === "Home") {
			parentPath = "/";
			return item.value;
		} else {
			parentPath = path.replace(/^Home/, "");
			return `${parentPath}/${item.value}`;
		}
	});
  console.log("parentPath: ", parentPath);
	console.log("fileToDownload: ", downloadList);
  
  try {
    const downloadRes = await axios.post(api_destination, { parentPath, downloadList });
    console.log("downloadRes: ", downloadRes);
    return { status: 200, downloadUrl: downloadRes.data.downloadUrl } ;
  } catch (e) {
    console.error("downloadFile: ", e);
    return false;
  }
};

export { downloadFile };
