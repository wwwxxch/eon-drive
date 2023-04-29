const api_destination = "/create-folder";

const createFolder = async (path, folderName) => {
	// request body
  let parentPath = "";
  if (path !== "Home") {
    parentPath = path.split("/").slice(1).join("/");
  }
	
  try {
    const createFolderRes = await axios.post(api_destination, { parentPath, folderName });
    // console.log("createFolderRes: ", createFolderRes);
    return { status: createFolderRes.status };
  } catch (e) {
    console.error("createFolder: ", e);
    return { status: e.response.status, data: e.response.data };
  }
};

export { createFolder };
