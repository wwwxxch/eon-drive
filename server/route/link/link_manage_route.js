import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";

import { authentication } from "../../controller/user/user_auth_controller.js";

import {
	privateLink,
	publicLink,
} from "../../controller/link/link_create_controller.js";

// --------------------------------------------------------------------------------
router.post("/share-with", authentication, publicLink, privateLink);

// TODO: /revoke-link
// router.post("/revoke-link")

export { router as link_manage_route };
