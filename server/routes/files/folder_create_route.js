import express from "express";
const router = express.Router();

import { wrapAsync } from "../../utils/utils.js";
import { createFolderValid, ValidCB } from "../../middlewares/input_validator.js";
import { createFolderS3AndDB } from "../../controllers/files/folder_create_controller.js";
import { authentication } from "../../middlewares/auth_check.js";
// ------------------------------------------------------------------------------------
router.post("/files/folder", authentication, createFolderValid, ValidCB, createFolderS3AndDB);

export { router as folder_create_route };
