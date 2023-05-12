import { API_VERSION } from "../constant/constant.js";

const restoreFile = async (version, fileWholePath, parentPath) => {
	try {
		const restoreFileRes = await axios.post(`/api/${API_VERSION}/files/restore-history`, {
			version,
			fileWholePath,
			parentPath,
		});
		return { status: restoreFileRes.status };
	} catch (e) {
		console.error("restoreFile: ", e);
		return { status: e.response.status, data: e.response.data };
	}
};

const restoreDelete = async (restoreList) => {
	try {
		const restoreDeleteRes = await axios.post(`/api/${API_VERSION}/files/restore-deleted`, {
			restoreList,
		});
		return { status: restoreDeleteRes.status };
	} catch (e) {
		console.error("restoreDelete: ", e);
		return { status: e.response.status, data: e.response.data };
	}
};

export { restoreFile, restoreDelete };
