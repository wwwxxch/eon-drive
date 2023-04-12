const api_destination = "/show-list";

const getFileList = async (path) => {
  let parentPath = "";
  if (path !== "Home") {
    parentPath = path.split("/").slice(1).join("/");
  }
  try {
    const getList = await axios.post(api_destination, { path: parentPath} );
    // console.log("getList: ", getList);
    // console.log("getList.data: ", getList.data);
    return getList.data;
  } catch (e) {
    console.error("getFileList: ", e);
    return false;
  }
};

export { getFileList };
