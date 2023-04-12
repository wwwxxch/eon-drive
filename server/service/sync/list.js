import { getFileListByPath } from "../path/iter.js";

const emitNewList = async (req, userId, parentPath) => {
  const io = req.app.get("socketio");
	const refresh = await getFileListByPath(userId, parentPath);
	// console.log("refresh: ", refresh);
	io.emit("listupd", {
		parentPath: parentPath,
		list: refresh,
	});
};

export { emitNewList };
