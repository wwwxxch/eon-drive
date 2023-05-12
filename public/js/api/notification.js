import { API_VERSION } from "../constant/constant.js";

const askNoti = async () => {
	try {
		const notiRes = await axios.get(`/api/${API_VERSION}/notifications`);
		// console.log("notiRes: ", notiRes);
		return notiRes.data;
	} catch (e) {
		console.error("askNoti: ", e);
		return false;
	}
};

const changeUnreadStatus = async (shareId) => {
	try {
		const change = await axios.patch(`/api/${API_VERSION}/notification/${shareId}`);
		// console.log("change: ", change);
		return change.data;
	} catch (e) {
		console.error("changeUnreadStatus: ", e);
		return false;
	}
};

export { askNoti, changeUnreadStatus };
