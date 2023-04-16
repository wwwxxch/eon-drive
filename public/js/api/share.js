const createLink = async (path, targetName, accessType, userList = []) => {
	// request body
	let parentPath = "";
	if (path !== "Home") {
		parentPath = path.replace(/^Home\//, "");
	}
	console.log("parentPath: ", parentPath);
  const ffWholePath = path === "Home" ? targetName : parentPath+"/"+targetName;
	
  let access;
	if (accessType === "anyone") {
		access = {
			type: "public",
			user: [],
		};
	} else if (accessType === "user") {
		access = {
			type: "private",
			user: userList,
		};
	}
	try {
		const createLinkRes = await axios.post("/share-with", {
			access: access,
      path: ffWholePath
		});
		console.log("createLinkRes.data: ", createLinkRes.data);
		return createLinkRes.data;
	} catch (e) {
		console.error("creeateLink: ", e);
		return false;
	}
};

export { createLink };
