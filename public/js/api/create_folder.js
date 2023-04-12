const api_destination = "/v2/create-folder";

const createFolder = async (path, folderName) => {
	// request body
  let parentPath = "";
  if (path !== "Home") {
    parentPath = path.split("/").slice(1).join("/");
  }
	
  try {
    const createFolderRes = await axios.post(api_destination, { parentPath, folderName });
    // console.log("createFolderRes: ", createFolderRes);
    return true;
  } catch (e) {
    console.error("createFolder: ", e);
    return e.response;
  }
};

export { createFolder };
