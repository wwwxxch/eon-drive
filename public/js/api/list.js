import { API_VERSION } from "../constant/constant.js";

const getFileList = async (path) => {
	let parentPath = "";
	if (path !== "Home") {
		parentPath = path.split("/").slice(1).join("/");
	}
	try {
		// const getList = await axios.post(`/api/${API_VERSION}/files-list`, { path: parentPath });
		const getList = await axios.get(`/api/${API_VERSION}/files-list?path=${parentPath}`);
		// console.log("getList: ", getList);
		// console.log("getList.data: ", getList.data);
		return getList.data;
	} catch (e) {
		console.error("getFileList: ", e);
		return null;
	}
};

const getFileHistory = async (fileId) => {
	try {
		// const getHistory = await axios.post(`/api/${API_VERSION}/file-history`, { fileId });
		const getHistory = await axios.get(`/api/${API_VERSION}/file-history?fileId=${fileId}`);
		return getHistory.data;
	} catch (e) {
		console.error("getFileHistory: ", e);
		return null;
	}
};

const getTrash = async () => {
	try {
		const trashList = await axios.get(`/api/${API_VERSION}/trash-files`);
		return trashList.data.data;
	} catch (e) {
		console.error("getTrash: ", e);
		return null;
	}
};

const askProfile = async () => {
	try {
		const profile = await axios.get(`/api/${API_VERSION}/profile`);
		return profile.data;
	} catch (e) {
		console.error("askProfile: ", e);
		return null;
	}
};

export { getFileList, getFileHistory, getTrash, askProfile };
