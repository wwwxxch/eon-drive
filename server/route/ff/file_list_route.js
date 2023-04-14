import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";
import { authentication } from "../../controller/user/user_auth_controller.js";
import { showList } from "../../controller/ff/file_list_controller.js";

import { findFileIdByPath } from "../../service/path/iter.js";
import { getVersionsByFileId, getDeleteRecordsByFileId, getTrashList } from "../../model/db_ff_r.js";
import { findParentPathByFFId } from "../../service/path/iter.js";
// ------------------------------------------------------------------------------------
router.post("/show-list", authentication, showList);

router.post("/show-history", authentication, async (req, res) => {
  console.log("/show-history: ", req.body);
  const { fileWholePath } = req.body;
  const userId = req.session.user.id;
  const fileId = await findFileIdByPath(userId, fileWholePath);
  console.log("fileId: ", fileId);
  const versions = await getVersionsByFileId(fileId);
  console.log("versions", versions);
  const deleteRecords = await getDeleteRecordsByFileId(fileId);
  console.log("deleteRecords: ", deleteRecords); 
  
  return res.json({ versions, deleteRecords });
});

router.get("/show-deleted", authentication, async(req, res) => {
  console.log("/show-deleted");
  const userId = req.session.user.id;
  const deleted = await getTrashList(userId);
  // console.log("deleted: ", deleted);

  for (let i = 0; i < deleted.length; i++) {
    const parentPath = await findParentPathByFFId(deleted[i].id);
    deleted[i].parentPath = parentPath;
  }

  return res.json({ data: deleted });
});

export { router as file_list_route };
