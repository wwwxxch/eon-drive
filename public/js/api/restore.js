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

export { restoreFile };
