import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";

import { notiList, readNoti } from "../../controller/notification/notification_controller.js";
import { authentication } from "../../middleware/auth_check.js";
// --------------------------------------------------------------------------------
router.get("/notification", authentication, notiList);

router.patch("/notification/:shareId", authentication, readNoti);

export { router as notification_route };
