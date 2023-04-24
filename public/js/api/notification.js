const askNoti = async () => {
	try {
		const notiRes = await axios.get("/noti");
		// console.log("notiRes: ", notiRes);
		return notiRes.data;
	} catch (e) {
		console.error("askNoti: ", e);
		return false;
	}
};

const changeUnreadStatus = async() => {
  try {
		const change = await axios.get("/read");
		// console.log("change: ", change);
		return change.data;
	} catch (e) {
		console.error("changeUnreadStatus: ", e);
		return false;
	}
};

export { askNoti, changeUnreadStatus };
