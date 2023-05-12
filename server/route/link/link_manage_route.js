import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";

import { createLinkValid, revokeLinkValid, ValidCB } from "../../middleware/input_validator.js";

import {
	createLinkCheck,
	privateLink,
	publicLink,
	revokeLink,
} from "../../controller/link/link_manage_controller.js";

import { authentication } from "../../middleware/auth_check.js";
// --------------------------------------------------------------------------------
// TODO: change to post /link & delete /link ???
router.post(
	"/create-link",
	authentication,
	createLinkValid,
	ValidCB,
	createLinkCheck,
	publicLink,
	privateLink
);

router.post("/revoke-link", authentication, revokeLinkValid, ValidCB, revokeLink);

export { router as link_manage_route };
