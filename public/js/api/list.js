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
    return false;
  }
};

export { getFileList };
