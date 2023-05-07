import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";
import { authentication } from "../../controller/user/user_auth_controller.js";
import {
	renameValid,
	ValidCB,
} from "../../middleware/input_validator.js";
import { renameFFS3andDB } from "../../controller/ff/ff_rename_controller.js";
// ------------------------------------------------------------------------------------
router.post(
	"/rename",
	authentication,
	renameValid,
	ValidCB,
	renameFFS3andDB
);

export { router as ff_rename_route };
