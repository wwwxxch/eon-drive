import express from "express";
const router = express.Router();

import { wrapAsync } from "../../utils/utils.js";

import {
	showLinksSharedWithYou,
	showLinksYouShared,
	showCurrentACL,
} from "../../controllers/link/link_list_controller.js";

import { authentication } from "../../middlewares/auth_check.js";
// --------------------------------------------------------------------------------
router.get("/links-shared-with-you", authentication, showLinksSharedWithYou);

router.get("/links-you-shared", authentication, showLinksYouShared);

router.get("/files-link-acl", authentication, showCurrentACL);

export { router as link_list_route };
