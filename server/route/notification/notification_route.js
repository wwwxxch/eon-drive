import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";

import { authentication } from "../../controller/user/user_auth_controller.js";
import { getLinksSharedWithYou } from "../../model/db_share.js";



// --------------------------------------------------------------------------------
router.get("/notifications", authentication, async(req, res) => {
  const userId = req.session.user.id;
  const noti = await getLinksSharedWithYou(userId);
  console.log(noti);
  return res.json({ });
});


export { router as notification_route };
