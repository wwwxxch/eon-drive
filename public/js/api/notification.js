const askNoti = async () => {
	try {
		const notiRes = await axios.get("/notification");
		// console.log("notiRes: ", notiRes);
		return notiRes.data;
	} catch (e) {
		console.error("askNoti: ", e);
		return false;
	}
};

const changeUnreadStatus = async(shareId) => {
  try {
		const change = await axios.patch(`/notification/${shareId}`);
		// console.log("change: ", change);
		return change.data;
	} catch (e) {
		console.error("changeUnreadStatus: ", e);
		return false;
	}
};

export { askNoti, changeUnreadStatus };
