import { getFileListByPath } from "../path/iter.js";

const emitNewList = async (io, userId, parentPath) => {
  // const io = req.app.get("socketio");
	const refresh = await getFileListByPath(userId, parentPath);
	// console.log("refresh: ", refresh);
	io.to(`user_${userId}`).emit("listupd", {
		parentPath: parentPath,
		list: refresh,
	});
};

export { emitNewList };
