const askUnreadNoti = async () => {
	try {
		const unreadNoti = await axios.get("/noti");
		console.log("unreadNoti: ", unreadNoti);
		return unreadNoti.data;
	} catch (e) {
		console.error("askUnreadNoti: ", e);
		return false;
	}
};

const changeUnreadStatus = async() => {
  try {
		const change = await axios.get("/read");
		console.log("change: ", change);
		return change.data;
	} catch (e) {
		console.error("changeUnreadStatus: ", e);
		return false;
	}
};

export { askUnreadNoti, changeUnreadStatus };
