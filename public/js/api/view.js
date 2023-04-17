const getShareFoList = async(shareToken, subFolder = null) => {
  
  try {
		const getList = await axios.post("/view-fo-list", { shareToken, subFolder });
		
		return getList.data;
	} catch (e) {
		console.error("getShareFoList: ", e);
		return false;
	}
};

const downloadShareFo = async(shareToken, desired) => {
  try {
		const downloadRes = await axios.post("/view-fo-dl", { shareToken, desired });
		console.log("downloadRes: ", downloadRes);
    return { status: 200, downloadUrl: downloadRes.data.downloadUrl } ;
	} catch (e) {
		console.error("downloadShare: ", e);
		return false;
	}
};

const downloadShareFi = async(shareToken) => {
  try {
		const downloadRes = await axios.post("/view-fi-dl", { shareToken });
		console.log("downloadRes: ", downloadRes);
    return { status: 200, downloadUrl: downloadRes.data.downloadUrl } ;
	} catch (e) {
		console.error("downloadShare: ", e);
		return false;
	}
};

export { getShareFoList, downloadShareFo, downloadShareFi };
