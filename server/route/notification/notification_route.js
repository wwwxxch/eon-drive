import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";

import {
	noticeList,
	makeNoticeRead,
} from "../../controller/notification/notification_controller.js";
import { authentication } from "../../middleware/auth_check.js";
// --------------------------------------------------------------------------------
router.get("/notifications", authentication, noticeList);

router.patch("/notification/:shareId", authentication, makeNoticeRead);

export { router as notification_route };
