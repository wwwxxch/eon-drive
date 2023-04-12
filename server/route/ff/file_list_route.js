import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";
import { authentication } from "../../controller/user/user_auth_controller.js";
import { showList } from "../../controller/ff/file_list_controller.js";
// ------------------------------------------------------------------------------------
router.post("/show-list", authentication, showList);

// router.post("/show-deleted")

// router.post("/show-history")

export { router as file_list_route };
