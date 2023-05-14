import express from "express";
const router = express.Router();

import { wrapAsync } from "../../utils/utils.js";

import {
	createLinkValid,
	revokeLinkValid,
	ValidCB,
} from "../../middlewares/input_validator.js";

import {
	createLinkCheck,
	privateLink,
	publicLink,
	revokeLink,
} from "../../controllers/link/link_manage_controller.js";

import { authentication } from "../../middlewares/auth_check.js";
// --------------------------------------------------------------------------------
router.post(
	"/link",
	authentication,
	createLinkValid,
	ValidCB,
	createLinkCheck,
	publicLink,
	privateLink
);

router.delete("/link", authentication, revokeLinkValid, ValidCB, revokeLink);

export { router as link_manage_route };
