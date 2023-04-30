const getFileList = async (path) => {
  let parentPath = "";
  if (path !== "Home") {
    parentPath = path.split("/").slice(1).join("/");
  }
  try {
    const getList = await axios.post("/show-list", { path: parentPath} );
    // console.log("getList: ", getList);
    // console.log("getList.data: ", getList.data);
    return getList.data;
  } catch (e) {
    console.error("getFileList: ", e);
    return null;
  }
};

const getFileHistory = async (fileWholePath) => {
  try {
    const getHistory = await axios.post("/show-history", { fileWholePath });
    return getHistory.data;
  } catch (e) {
    console.error("getFileHistory: ", e);
    return null;
  }
};

const getTrash = async () => {
  try {
    const trashList = await axios.get("/show-trash");
    return trashList.data.data;
  } catch (e) {
    console.error("getTrash: ", e);
    return null;
  }
};

const askProfile = async () => {
  try {
    const profile = await axios.get("/show-profile");
    return profile.data;
  } catch (e) {
    console.error("askProfile: ", e);
    return null;
  }
};



export { getFileList, getFileHistory, getTrash, askProfile };
