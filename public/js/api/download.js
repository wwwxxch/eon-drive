import { API_VERSION } from "../constants/constants.js";

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
		const downloadRes = await axios.post(`/api/${API_VERSION}/download`, {
			parentPath,
			downloadList,
		});
		console.log("downloadRes: ", downloadRes);
		return { status: downloadRes.status, downloadUrl: downloadRes.data.downloadUrl };
	} catch (e) {
		console.error("downloadFile: ", e);
		return { status: e.response.status, data: e.response.data };
	}
};

const singleDownloadFile = async (parentPath, downloadList) => {
	// request body
	console.log("parentPath: ", parentPath);
	console.log("downloadList: ", downloadList);

	try {
		const downloadRes = await axios.post(`/api/${API_VERSION}/download`, {
			parentPath,
			downloadList,
		});
		console.log("downloadRes: ", downloadRes);
		return { status: downloadRes.status, downloadUrl: downloadRes.data.downloadUrl };
	} catch (e) {
		console.error("downloadFile: ", e);
		return { status: e.response.status, data: e.response.data };
	}
};

export { downloadFile, singleDownloadFile };
