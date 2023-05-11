import express from "express";
const router = express.Router();

import { downloadValid, ValidCB } from "../../middleware/input_validator.js";
import {
	dlSingleFile,
	dlMultiFileProcess,
	dlLocalArchive,
	dlCallLambda,
} from "../../controller/files/file_download_controller.js";
import {authentication} from "../../middleware/auth_check.js";
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

export { router as file_download_route };
