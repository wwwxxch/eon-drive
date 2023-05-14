import express from "express";
const router = express.Router();

import { downloadValid, ValidCB } from "../../middlewares/input_validator.js";
import {
	dlSingleFile,
	dlMultiFileProcess,
	dlLocalArchive,
	dlCallLambda,
} from "../../controllers/files/files_download_controller.js";
import {authentication} from "../../middlewares/auth_check.js";
// ------------------------------------------------------------------------------------
router.post(
	"/download-local",
	authentication,
  downloadValid,
  ValidCB,
	dlSingleFile,
	dlMultiFileProcess,
	dlLocalArchive
);

router.post(
	"/download",
	authentication,
  downloadValid,
  ValidCB,
	dlSingleFile,
	dlMultiFileProcess,
	dlCallLambda
);

export { router as files_download_route };
