const renameFF = async (path, ff_id, newName) => {
	// request body
	let parentPath = "";
	if (path !== "Home") {
		parentPath = path.split("/").slice(1).join("/");
	}

	try {
		const renameFFRes = await axios.post("/rename", {
			parentPath,
			ff_id,
			newName,
		});
		console.log("renameFFRes: ", renameFFRes);
		return { status: renameFFRes.status };
	} catch (e) {
		console.error("renameFF: ", e);
		return { status: e.response.status, data: e.response.data };
	}
};

export { renameFF };
