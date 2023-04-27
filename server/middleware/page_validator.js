import * as errGroup from "../../server/error/custom_error.js";

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
    return next(new errGroup.notFoundError());
	}

  req.fileName = fileName;
  req.fileId = fileId;
  next();
};

export { historyFileCheck };