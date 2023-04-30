const createLink = async (targetId, accessType, userList = []) => {
	// request body
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
			access,
			targetId,
		});
		console.log("createLinkRes.data: ", createLinkRes.data);
		return {
			status: createLinkRes.status,
			share_link: createLinkRes.data.share_link,
		};
	} catch (e) {
		console.error("createLink: ", e);
		return { status: e.response.status, data: e.response.data };
	}
};

const revokeLink = async (ff_id) => {
	try {
		const revokeLinkRes = await axios.post("/revoke-link", { ff_id });
		console.log("revokeLinkRes: ", revokeLinkRes);
		return { status: revokeLinkRes.status };
	} catch (e) {
		console.error("revokeLinkRes: ", e);
		return { status: e.response.status, data: e.response.data };
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
		return checkShareStatusRes;
	} catch (e) {
		console.error("checkShareStatusRes: ", e);
		return { status: e.response.status, data: e.response.data };
	}
};

const showCandidatesByInput = async (input) => {
	try {
		const showCandidatesRes = await axios.get(`/select-user?q=${input}`);
		console.log("showCandidatesRes: ", showCandidatesRes);
		return showCandidatesRes;
	} catch (e) {
		console.error("showCandidatesByInput: ", e);
		return { status: e.response.status, data: e.response.data };
	}
};

export {
	createLink,
	revokeLink,
	askSharedWithList,
	askYouSharedList,
	checkShareStatus,
	showCandidatesByInput,
};
