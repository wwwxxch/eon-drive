import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";
import { authentication } from "../../controller/user/user_auth_controller.js";
import {
	createFolderValid,
	ValidCB,
} from "../../middleware/input_validator.js";
import { createFolderS3AndDB } from "../../controller/ff/folder_create_controller.js";
// ------------------------------------------------------------------------------------
router.post(
	"/create-folder",
	authentication,
	createFolderValid,
	ValidCB,
	createFolderS3AndDB
);

export { router as folder_create_route };
