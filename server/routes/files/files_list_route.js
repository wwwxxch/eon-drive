import express from "express";
const router = express.Router();

import { wrapAsync } from "../../utils/utils.js";
import { showList, showHistory, showTrash } from "../../controllers/files/files_list_controller.js";
import { authentication } from "../../middlewares/auth_check.js";

// ------------------------------------------------------------------------------------
router.get("/files-list", authentication, showList);

router.get("/file-history", authentication, showHistory);

router.get("/trash-files", authentication, showTrash);

export { router as files_list_route };
