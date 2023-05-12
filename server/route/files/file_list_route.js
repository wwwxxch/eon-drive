import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";
import { showList, showHistory, showTrash } from "../../controller/files/file_list_controller.js";
import { authentication } from "../../middleware/auth_check.js";

// ------------------------------------------------------------------------------------
router.get("/files-list", authentication, showList);

router.get("/file-history", authentication, showHistory);

router.get("/trash-files", authentication, showTrash);

export { router as file_list_route };
