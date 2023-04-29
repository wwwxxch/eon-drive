import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";

import { authentication } from "../../controller/user/user_auth_controller.js";
import { notiList, readNoti } from "../../controller/notification/notification_controller.js";
// --------------------------------------------------------------------------------
router.get("/notification", authentication, notiList);

router.patch("/notification/:shareId", authentication, readNoti);

// router.get("/read", authentication, async (req, res) => {
//   const { shareId } = req.query;
// 	const userId = req.session.user.id;
// 	const read = await changeNotiRead(userId, shareId);
//   console.log("/read: ", read);
// 	return res.send("ok");
// });

export { router as notification_route };
