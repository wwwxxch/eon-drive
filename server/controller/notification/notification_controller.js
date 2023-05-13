import { CustomError } from "../../error/custom_error.js";
import { readNotificationNumber } from "../../constant/constant.js";
import { getLinksSharedNotice, changeNoticeReadStatus } from "../../model/db_share.js";
// =================================================================================
const noticeList = async (req, res, next) => {
	const userId = req.session.user.id;
	const unreadNotice = await getLinksSharedNotice(userId, 0);

	const readNotice =
		unreadNotice.length < readNotificationNumber
			? await getLinksSharedNotice(
					userId,
					1,
					readNotificationNumber - unreadNotice.length
			  )
			: [];

	const noticeToFE = [...unreadNotice, ...readNotice];
	return res.json({ data: noticeToFE, unreadNum: unreadNotice.length });
};

const makeNoticeRead = async (req, res, next) => {
	const shareId = req.params.shareId === undefined ? 0 : Number(req.params.shareId);
	if (!Number.isInteger(shareId) || shareId < 0) {
		return next(CustomError.badRequest("Request is not valid."));
	}

	const userId = req.session.user.id;
	const read = await changeNoticeReadStatus(userId, shareId);
	if (!read) {
		return next(CustomError.internalServerError("(fn) changeNoticeReadStatus Error"));
	}

	return res.json({ msg: "ok" });
};

export { noticeList, makeNoticeRead };
