const createLink = async (path, targetName, accessType, userList = []) => {
	// request body
	let parentPath = "";
	if (path !== "Home") {
		parentPath = path.replace(/^Home\//, "");
	}
	console.log("parentPath: ", parentPath);
	const ffWholePath =
		path === "Home" ? targetName : parentPath + "/" + targetName;

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
		const createLinkRes = await axios.post("/create-link", {
			access: access,
			path: ffWholePath,
		});
		console.log("createLinkRes.data: ", createLinkRes.data);
		return createLinkRes.data;
	} catch (e) {
		console.error("creeateLink: ", e);
		return false;
	}
};

const revokeLink = async (ff_id) => {
	try {
		const revokeLinkRes = await axios.post("/revoke-link", { ff_id });
		console.log("revokeLinkRes: ", revokeLinkRes);
		return revokeLinkRes.data;
	} catch (e) {
		console.error("revokeLinkRes: ", e);
		return false;
	}
};

const askSharedWithList = async () => {
	try {
		const askSharedWithListRes = await axios.get("/links-shared-with");
		console.log("askSharedWithListRes: ", askSharedWithListRes);
		return askSharedWithListRes.data;
	} catch (e) {
		console.error("askSharedWithListRes: ", e);
		return false;
	}
};

const askYouSharedList = async () => {
	try {
		const askYouSharedListRes = await axios.get("/links-you-shared");
		console.log("askYouSharedListRes: ", askYouSharedListRes);
		return askYouSharedListRes.data;
	} catch (e) {
		console.error("askYouSharedListRes: ", e);
		return false;
	}
};

const checkShareStatus = async (fileId) => {
	try {
		const checkShareStatusRes = await axios.get(
			`/ff-link-acl?fileId=${fileId}`
		);
		console.log("checkShareStatusRes: ", checkShareStatusRes);
		return checkShareStatusRes.data;
	} catch (e) {
		console.error("checkShareStatusRes: ", e);
		return false;
	}
};

export {
	createLink,
	revokeLink,
	askSharedWithList,
	askYouSharedList,
	checkShareStatus,
};
