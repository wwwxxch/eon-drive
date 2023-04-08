import { 
  getDirId,
  getFileList 
} from "../model/db_file.js";

const getFileListByPath = async (userId, path) => {
  let parentId = 0;
  if (path !== "") {
    const folders = path.split("/");
    for (let i = 0; i < folders.length; i++) {
      const chkDir = await getDirId(userId, parentId, folders[i]);
      if (chkDir.length === 0) {
        return { data: null };
      }
      parentId = chkDir[0].id;
    }
  }
  const list = await getFileList(userId, parentId);
  return { data: list };
};

const emitNewList = async (req, userId, parentPath) => {
  const io = req.app.get("socketio");
	const refresh = await getFileListByPath(userId, parentPath);
	// console.log("refresh: ", refresh);
	io.emit("listupd", {
		parentPath: parentPath,
		list: refresh,
	});
};

export { getFileListByPath, emitNewList };
