import { getCurrentSizeByFileId } from "../../model/db_ff_r.js";
import { findFileIdByPath } from "../../service/path/iter.js";
// ======================================================================
const checkUsed = async (req, res, next) => {
  console.log("checkUsed: ", req.body);

  const { fileWholePath } = req.body;
  const fileSize = parseInt(req.body.fileSize);
  const userId = req.session.user.id;
  try {
    const fileId = await findFileIdByPath(userId, fileWholePath);
    console.log("fileId: ", fileId);

    const allocated = parseInt(req.session.user.allocated);
    const used = parseInt(req.session.user.used);

    if (!fileId) {
      if (fileSize + used > allocated) {
        return res.status(400).json({ error: "Not enough space" });
      }
      return next();
    }

    const currentSize = await getCurrentSizeByFileId(fileId);
    if ( used - currentSize + fileSize > allocated ) {
      return res.status(400).json({ error: "Not enough space" });
    }
    
    next();

  } catch (e) {
    console.error(`checkUsed: ${e}`);
    return res.status(500).json({ error: "Something broken" });
  }
};

export { checkUsed };