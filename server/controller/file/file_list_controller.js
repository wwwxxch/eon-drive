import {
  getDirId,
  getFileList
} from "../../model/db_file.js";
// ====================================================================
const showList = async (req, res) => {
  console.log("showList: ", req.body);
  
  // note: no slash after the folder
  // req.body = { "path": "test2/test2inside/folder_20230405" }
  // req.body = { "path": "" }
  const { path } = req.body;
  const userId = req.session.user.id;
  
  // parentId start from 0
  let parentId = 0; 

  // get the correct parentId
  if (path !== "") {
    const folders = path.split("/");
    console.log("folders: ", folders);
    
    
    for (let i = 0; i < folders.length; i++) {
      const chkDir = await getDirId(userId, parentId, folders[i]);
      // console.log(folders[i]);
      // console.log(chkDir);
      if (chkDir.length === 0) {
        return res.status(400).json({ msg: "error" });
      }
      parentId = chkDir[0].id;
    }
  }

  // get file list by userId & parentId
  const list = await getFileList(userId, parentId);

  return res.json({ data: list });
};

export { showList };
