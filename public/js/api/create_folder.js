import { API_VERSION } from "../constants/constants.js";

const createFolder = async (path, folderName) => {
	// request body
	let parentPath = "";
	if (path !== "Home") {
		parentPath = path.split("/").slice(1).join("/");
	}

	try {
		const createFolderRes = await axios.post(`/api/${API_VERSION}/files/folder`, {
			parentPath,
			folderName,
		});
		return { status: createFolderRes.status };
	} catch (e) {
		console.error("createFolder: ", e);
		return { status: e.response.status, data: e.response.data };
	}
};

export { createFolder };
