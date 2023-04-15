import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";
import { authentication } from "../../controller/user/user_auth_controller.js";
import {
	showList,
	showHistory,
	showTrash,
} from "../../controller/ff/file_list_controller.js";

// ------------------------------------------------------------------------------------
router.post("/show-list", authentication, showList);

router.post("/show-history", authentication, showHistory);

router.get("/show-trash", authentication, showTrash);

export { router as file_list_route };
