import { findFileIdByPath } from "../service/path/iter.js";
// ===========================================================================
const historyFileCheck = async (req, res, next) => {
	const fileWholePath = req.path.replace(/^\/history\//, "");
  console.log("/history", fileWholePath);

  const decodeFileWholePath = decodeURI(fileWholePath);
  console.log(decodeFileWholePath);

	const fileName = decodeFileWholePath.split("/").pop();
	const userId = req.session.user.id;

	const fileId = await findFileIdByPath(userId, decodeFileWholePath);
	console.log("fileId: ", fileId);

	if (!fileId) {
    console.log("historyFileCheck: ", req.path);
    return res.status(404).render("error/error", {
      status: 404,
      message: "The page you requested is not existed."
    });
	}

  req.fileName = fileName;
  req.fileId = fileId;
  next();
};

export { historyFileCheck };