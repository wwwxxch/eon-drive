import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";

import { authentication } from "../../controller/user/user_auth_controller.js";

import {
	privateLink,
	publicLink,
} from "../../controller/share/share_link_controller.js";

import {
  shareTokenValid,
	checkShareTarget,
  checkSharePermission,
	returnFileInfo,
  returnFolderInfo
} from "../../controller/share/share_validation.js";
// --------------------------------------------------------------------------------
router.post("/share-with", authentication, publicLink, privateLink);

router.get(
	"/s/:shareToken([a-zA-Z0-9]+)*",
	shareTokenValid,
	checkShareTarget,
	checkSharePermission,
	returnFileInfo
);

router.get(
  "/sdir/:shareToken*", 
  shareTokenValid,
  checkShareTarget,
  checkSharePermission,
  returnFolderInfo
);

export { router as share_link_route };
