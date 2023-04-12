const api_destination = "/delete";

const deleteFile = async (path, fileArray) => {
  // request body
  let parentPath = "";
  if (path !== "Home") {
    parentPath = path.split("/").slice(1).join("/");
  }
  console.log("parentPath: ", parentPath);

  const delList = fileArray.toArray().map((item) => {
    if (path === "Home") {
      return item.value;
    } else {
      return `${path.replace(/^Home\//, "")}/${item.value}`;
    }
  });
  console.log("delList: ", delList);

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
