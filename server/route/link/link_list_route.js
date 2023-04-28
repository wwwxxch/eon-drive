import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";

import { authentication } from "../../controller/user/user_auth_controller.js";

import {
	showLinksSharedWith,
	showLinksYouShared,
  showCurrentACL,
} from "../../controller/link/link_list_controller.js";

// --------------------------------------------------------------------------------
router.get("/links-shared-with", authentication, showLinksSharedWith);

router.get("/links-you-shared", authentication, showLinksYouShared);

router.get("/ff-link-acl", authentication, showCurrentACL);

export { router as link_list_route };
