import { API_VERSION } from "../constants/constants.js";

const getShareFoList = async (shareToken, subFolder = null) => {
	try {
		// const getList = await axios.post(`/api/${API_VERSION}/view-fo-list`, { shareToken, subFolder });
		const getList = await axios.get(
			`/api/${API_VERSION}/view-fo-list?shareToken=${shareToken}&subFolder=${subFolder}`
		);

		return getList.data;
	} catch (e) {
		console.error("getShareFoList: ", e);
		return null;
	}
};

const downloadShareFo = async (shareToken, desired) => {
	try {
		const downloadRes = await axios.post(`/api/${API_VERSION}/view-fo-dl`, {
			shareToken,
			desired,
		});
		console.log("downloadRes: ", downloadRes);
		return { status: downloadRes.status, downloadUrl: downloadRes.data.downloadUrl };
	} catch (e) {
		console.error("downloadShare: ", e);
		return { status: e.response.status, data: e.response.data };
	}
};

const downloadShareFi = async (shareToken) => {
	try {
		const downloadRes = await axios.post(`/api/${API_VERSION}/view-fi-dl`, {
			shareToken,
		});
		console.log("downloadRes: ", downloadRes);
		return { status: downloadRes.status, downloadUrl: downloadRes.data.downloadUrl };
	} catch (e) {
		console.error("downloadShare: ", e);
		return { status: e.response.status, data: e.response.data };
	}
};

export { getShareFoList, downloadShareFo, downloadShareFi };
