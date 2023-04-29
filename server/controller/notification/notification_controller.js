import { customError } from "../../error/custom_error.js";
import { getLinksSharedNoti, changeNotiRead  } from "../../model/db_share.js";
// =================================================================================
const notiList = async (req, res, next) => {
  const userId = req.session.user.id;
	const unreadNoti = await getLinksSharedNoti(userId, 0);
	// console.log(unreadNoti);
  // console.log(5 - unreadNoti.length);
	
  const readNoti =
		unreadNoti.length < 5
			? await getLinksSharedNoti(userId, 1, (5 - unreadNoti.length))
			: [];

	const notiToFE = [...unreadNoti, ...readNoti];
  // console.log(notiToFE);
	return res.json({ data: notiToFE, unreadNum: unreadNoti.length });
};

const readNoti = async (req, res, next) => {
  const shareId = req.params.shareId === undefined ? 0 : Number(req.params.shareId);
  if (!Number.isInteger(shareId) || shareId < 0) {
    return next(customError.badRequest("Wrong Request"));
  }

  const userId = req.session.user.id;
  const read = await changeNotiRead(userId, shareId);
  if (!read) {
    return next(customError.internalServerError());
  }

	return res.json({ msg: "ok" });
};

export { notiList, readNoti };