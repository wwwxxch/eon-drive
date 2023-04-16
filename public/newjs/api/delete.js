const api_destination = "/delete";

const deleteFile = async (path, fileArray) => {
  // request body
  let parentPath = "";
  if (path !== "Home") {
    parentPath = path.split("/").slice(1).join("/");
  }
  console.log("parentPath: ", parentPath);
  // parentPath possible value: "" or "level1folder/level2folder"

  const delList = fileArray.toArray().map((item) => {
    if (path === "Home") {
      return item.value;
    } else {
      return `${path.replace(/^Home\//, "")}/${item.value}`;
    }
  });
  console.log("delList: ", delList);
  // delLIst possible value: whole path, e.g. "level1.ext" or "level1folder/level2.ext"

  try {
    const deleteRes = await axios.post(api_destination, { parentPath, delList });
    console.log("deleteRes.status: ", deleteRes.status);
    return true;
  } catch (e) {
    console.error("deleteFile: ", e);
    return false;
  }
};

export { deleteFile };
