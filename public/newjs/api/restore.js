const restoreFile = async (version, fileWholePath, parentPath) => {
	try {
		const restoreFileRes = await axios.post("/restore-history", {
			version,
			fileWholePath,
			parentPath,
		});
		return restoreFileRes.data;
	} catch (e) {
		console.error("restoreFile: ", e);
		return false;
	}
};

const restoreDelete = async (restoreList) => {
  try {
		const restoreDeleteRes = await axios.post("/restore-deleted",{ restoreList });
		return restoreDeleteRes;
	} catch (e) {
		console.error("restoreDelete: ", e);
		return false;
	}
};

export { restoreFile, restoreDelete };
