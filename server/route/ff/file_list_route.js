import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";
import { authentication } from "../../controller/user/user_auth_controller.js";
import { showList } from "../../controller/ff/file_list_controller.js";

import { findFileIdByPath } from "../../service/path/iter.js";
import { getVersionsByFileId, getDeleteRecordsByFileId } from "../../model/db_ff_r.js";
// ------------------------------------------------------------------------------------
router.post("/show-list", authentication, showList);

router.post("/show-history", authentication, async (req, res) => {
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

// router.post("/show-deleted")



export { router as file_list_route };
