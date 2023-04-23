import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";

import { authentication } from "../../controller/user/user_auth_controller.js";
import { changeNotiRead, getLinksSharedNoti } from "../../model/db_share.js";



// --------------------------------------------------------------------------------
router.get("/noti", authentication, async(req, res) => {
  const userId = req.session.user.id;
  const noti = await getLinksSharedNoti(userId);
  console.log(noti);
  return res.json({ data: noti });
});

router.get("/read", authentication, async(req, res) => {
  const userId = req.session.user.id;
  const read = await changeNotiRead(userId);
  return res.send("ok");
});

export { router as notification_route };
