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
  const decodePath = decodeURI(path);
  console.log(decodePath);
  const getFileListRes = await getFileListByPath(userId, decodePath);
  return res.json({ data: getFileListRes.data });
};

const showHistory = async(req, res) => {
  console.log("showHistory: ", req.body);
  const { fileWholePath } = req.body;
  const userId = req.session.user.id;
  const decodeFileWholePath = decodeURI(fileWholePath);
  console.log(decodeFileWholePath);
  const fileId = await findFileIdByPath(userId, decodeFileWholePath);
  console.log("fileId: ", fileId);
  
  const versions = await getVersionsByFileId(fileId);
  // console.log("versions", versions);

  const deleteRecords = await getDeleteRecordsByFileId(fileId);
  // console.log("deleteRecords: ", deleteRecords); 
  
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
  // console.log("trashList: ", trashList);

  for (let i = 0; i < trashList.length; i++) {
    const parentPath = await findParentPathByFFId(trashList[i].id);
    trashList[i].parentPath = parentPath;
  }

  return res.json({ data: trashList });
};

export { showList, showHistory, showTrash };
