import express from "express";
const router = express.Router();

import { wrapAsync } from "../../utils/utils.js";

import {
	noticeList,
	makeNoticeRead,
} from "../../controllers/notification/notification_controller.js";
import { authentication } from "../../middlewares/auth_check.js";
// --------------------------------------------------------------------------------
router.get("/notifications", authentication, noticeList);

router.patch("/notification/:shareId", authentication, makeNoticeRead);

export { router as notification_route };
