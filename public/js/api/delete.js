const deleteFile = async (path, fileArray) => {
  // request body
  let parentPath = "";
  if (path !== "Home") {
    parentPath = path.split("/").slice(1).join("/");
  }
  console.log("parentPath: ", parentPath);
  // parentPath possible value: "" or "level1folder/level2folder"

  // const delList = fileArray.toArray().map((item) => {
  //   if (path === "Home") {
  //     return item.value;
  //   } else {
  //     return `${path.replace(/^Home\//, "")}/${item.value}`;
  //   }
  // });
  const delList = fileArray.map((item) => {
    if (path === "Home") {
      return item;
    } else {
      return `${path.replace(/^Home\//, "")}/${item}`;
    }
  });
  console.log("delList: ", delList);
  // delLIst possible value: whole path, e.g. "level1.ext" or "level1folder/level2.ext"

  try {
    const deleteRes = await axios.post("/delete", { parentPath, delList });
    // console.log("deleteRes.status: ", deleteRes.status);
    return { status: deleteRes.status };
  } catch (e) {
    console.error("deleteFile: ", e);
    return { status: e.response.status, data: e.response.data };
  }
};

const permDeleteFile = async (permDeleteList) => {
  try {
		const permDeleteRes = await axios.post("/perm-delete",{ permDeleteList });
		return { status: permDeleteRes.status };
	} catch (e) {
		console.error("permDeleteFile: ", e);
		return { status: e.response.status, data: e.response.data };
	}
};

export { deleteFile, permDeleteFile };
