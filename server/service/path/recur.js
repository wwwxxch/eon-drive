import { 
  getOneLevelChildByParentId
} from "../../model/db_ff_r.js";

import {
  markDeleteById
} from "../../model/db_ff_d.js";
// ========================================================================================
const deleteRecur = async (parentId, userId, time) => {
  try {
    const list = await getOneLevelChildByParentId(parentId);
    if (list.length > 0) {
      for (let i = 0; i < list.length; i++) {
        if (list[i].type === "file") {
          const deleteFileRes = await markDeleteById(time, list[i].id, userId);
          console.log("deleteFileRes: ", deleteFileRes);
        } else {
          await deleteRecur(list[i].id);
        }
      }
    }
    // delete folder itself
    const deleteFolderRes = await markDeleteById(time, parentId, userId);
    console.log("deleteFolderRes: ", deleteFolderRes);
    return true;
  } catch (e) {
    console.error ("(fn) deleteRecur - error ", e);
    return false;
  }
};

export { deleteRecur };
