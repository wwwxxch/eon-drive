import { getFolderId, getOneLevelChildByParentId } from "../../model/db_ff_r.js";
import { getFileListByPath } from "../../service/path/iter.js";

import { findFileIdByPath } from "../../service/path/iter.js";
import { getVersionsByFileId, getDeleteRecordsByFileId } from "../../model/db_ff_r.js";

import { getDeletedList } from "../../model/db_ff_r.js";
import { findParentPathByFFId } from "../../service/path/iter.js";
// ==============================================================================
const showList = async(req, res) => {
  console.log("showList: ", req.body);
  
  // note: no slash after the folder
  // req.body = { "path": "test2/test2inside/folder_20230405" }
  // req.body = { "path": "" }
  const { path } = req.body;
  const userId = req.session.user.id;
  
  const getFileListRes = await getFileListByPath(userId, path);
  return res.json({ data: getFileListRes.data });
  // let parentId = 0; 

  // // get the correct parentId
  // if (path !== "") {
  //   const folders = path.split("/");
  //   console.log("folders: ", folders);
    
  //   for (let i = 0; i < folders.length; i++) {
  //     const chkDir = await getFolderId(userId, parentId, folders[i]);
  //     // console.log(folders[i]);
  //     // console.log(chkDir);
  //     if (chkDir.length === 0) {
  //       return res.status(400).json({ msg: "error" });
  //     }
  //     parentId = chkDir[0].id;
  //   }
  // }

  // // get file list by userId & parentId
  // const list = await getOneLevelChildByParentId(parentId, 0);

  // return res.json({ data: list });
};

const showHistory = async(req, res) => {
  console.log("showHistory: ", req.body);
  const { fileWholePath } = req.body;
  const userId = req.session.user.id;
  
  const fileId = await findFileIdByPath(userId, fileWholePath);
  console.log("fileId: ", fileId);
  
  const versions = await getVersionsByFileId(fileId);
  console.log("versions", versions);

  const deleteRecords = await getDeleteRecordsByFileId(fileId);
  console.log("deleteRecords: ", deleteRecords); 
  
  return res.json({ versions, deleteRecords });
};

const showTrash = async(req, res) => {
  console.log("/show-deleted");
  const userId = req.session.user.id;
  const deleted = await getDeletedList(userId);
  // console.log("deleted: ", deleted);

  const { all, folders } = deleted;
  const folderIdList = folders.map(item => item.id);
  const trashList = [];
  all.forEach(item => {
    if (!folderIdList.includes(item.parent_id)) trashList.push(item);
  });
  console.log("trashList: ", trashList);

  for (let i = 0; i < trashList.length; i++) {
    const parentPath = await findParentPathByFFId(trashList[i].id);
    trashList[i].parentPath = parentPath;
  }

  return res.json({ data: trashList });
};

export { showList, showHistory, showTrash };
