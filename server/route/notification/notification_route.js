import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";

import { authentication } from "../../controller/user/user_auth_controller.js";
import { changeNotiRead, getLinksSharedNoti } from "../../model/db_share.js";
// --------------------------------------------------------------------------------
router.get("/noti", authentication, async (req, res) => {
	const userId = req.session.user.id;
	const unreadNoti = await getLinksSharedNoti(userId, 0);
	// console.log(unreadNoti);
  // console.log(5 - unreadNoti.length);
	
  const readNoti =
		unreadNoti.length < 5
			? await getLinksSharedNoti(userId, 1, (5 - unreadNoti.length))
			: [];

	const notiToFE = [...unreadNoti, ...readNoti];
  console.log(notiToFE);
	return res.json({ data: notiToFE, unreadNum: unreadNoti.length });
});

router.get("/read", authentication, async (req, res) => {
  const { shareId } = req.query;
	const userId = req.session.user.id;
	const read = await changeNotiRead(userId, shareId);
  console.log("/read: ", read);
	return res.send("ok");
});

export { router as notification_route };
