const createLink = async (path, targetName) => {
  // request body
  let parentPath = "";
  if (path !== "Home") {
    parentPath = path.replace(/^Home\//, "");
  }
  console.log("parentPath: ", parentPath);

  try {
    const createLinkRes = await axios.post("/create-link", { parentPath, targetName });
    console.log("createLinkRes.data: ", createLinkRes.data);
    return createLinkRes.data;
  } catch (e) {
    console.error("creeateLink: ", e);
    return false;
  }
};

export { createLink };
