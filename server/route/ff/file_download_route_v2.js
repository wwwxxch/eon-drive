import express from "express";
const router = express.Router();

import { authentication } from "../../controller/user/user_auth_controller.js";
import {
	dlValidation,
	dlSingleFile,
	dlMultiFileProcess,
	dlLocalArchive,
	dlCallLambda,
} from "../../controller/ff/file_download_controller.js";
// ------------------------------------------------------------------------------------
router.post(
	"/v2/download-local",
	authentication,
	dlValidation,
	dlSingleFile,
	dlMultiFileProcess,
	dlLocalArchive
);

router.post(
	"/v2/download",
	authentication,
	dlValidation,
	dlSingleFile,
	dlMultiFileProcess,
	dlCallLambda
);

export { router as file_download_route_v2 };
