import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";

import { authentication } from "../../controller/user/user_auth_controller.js";

import {
	privateLink,
	publicLink,
} from "../../controller/link/link_create_controller.js";
import { revokeLink } from "../../controller/link/link_revoke_controller.js";
// --------------------------------------------------------------------------------
router.post("/create-link", authentication, publicLink, privateLink);

router.post("/revoke-link", authentication, revokeLink);

export { router as link_manage_route };
