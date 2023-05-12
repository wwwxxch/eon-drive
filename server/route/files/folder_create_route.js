import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";
import { createFolderValid, ValidCB } from "../../middleware/input_validator.js";
import { createFolderS3AndDB } from "../../controller/files/folder_create_controller.js";
import { authentication } from "../../middleware/auth_check.js";
// ------------------------------------------------------------------------------------
router.post("/files/folder", authentication, createFolderValid, ValidCB, createFolderS3AndDB);

export { router as folder_create_route };
