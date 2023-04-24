import { deleteLinkByFFId } from "../../model/db_share.js";
import { emitLinksYouShared } from "../../service/sync/list.js";
// ===========================================================
const revokeLink = async (req, res) => {
  console.log("/revokeLink: ", req.body);
  const { ff_id } = req.body;
  const userId = req.session.user.id;

  const revokeLinkInDB = await deleteLinkByFFId(userId, ff_id);
  console.log("revokeLinkInDB: ", revokeLinkInDB);

  // emit new link list
  const io = req.app.get("socketio");
  emitLinksYouShared(io, userId);
  return res.send("/revoke-link");
};

export { revokeLink };
