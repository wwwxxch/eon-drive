import { API_VERSION } from "../constant/constant.js";

const deleteFile = async (path, fileArray) => {
	// 1. parentPath possible value: "" or "level1folder/level2folder"
	let parentPath = "";
	if (path !== "Home") {
		parentPath = path.split("/").slice(1).join("/");
	}
	console.log("parentPath: ", parentPath);

	// 2. delLIst possible value: whole path, e.g. "level1.ext" or "level1folder/level2.ext"
	const delList = fileArray.map((item) => {
		if (path === "Home") {
			return item;
		} else {
			return `${path.replace(/^Home\//, "")}/${item}`;
		}
	});
	console.log("delList: ", delList);

	try {
		const deleteRes = await axios.delete(`/api/${API_VERSION}/files`, {
			data: { parentPath, delList },
		});
		// console.log("deleteRes.status: ", deleteRes.status);
		return { status: deleteRes.status };
	} catch (e) {
		console.error("deleteFile: ", e);
		return { status: e.response.status, data: e.response.data };
	}
};

const permDeleteFile = async (permDeleteList) => {
	try {
		const permDeleteRes = await axios.delete(`/api/${API_VERSION}/trash-files`, {
			data: { permDeleteList },
		});
		return { status: permDeleteRes.status };
	} catch (e) {
		console.error("permDeleteFile: ", e);
		return { status: e.response.status, data: e.response.data };
	}
};

export { deleteFile, permDeleteFile };
