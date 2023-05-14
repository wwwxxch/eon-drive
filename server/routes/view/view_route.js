import express from "express";
const router = express.Router();

import { wrapAsync } from "../../utils/utils.js";

import {
	viewFolderListValid,
	viewDLValid,
	ValidCB,
} from "../../middlewares/input_validator.js";

import {
	viewFolderList,
	viewDLcheckTarget,
	viewDLcheckPermission,
	viewDLfile,
	viewDLfolder,
	viewDLcallLambda,
} from "../../controllers/view/view_controller.js";

// ===================================================================================
router.get("/view-fo-list", viewFolderListValid, ValidCB, viewFolderList);

router.post(
	"/view-fi-dl",
	viewDLValid,
	ValidCB,
	viewDLcheckTarget,
	viewDLcheckPermission,
	viewDLfile
);

router.post(
	"/view-fo-dl",
	viewDLValid,
	ValidCB,
	viewDLcheckTarget,
	viewDLcheckPermission,
	viewDLfile,
	viewDLfolder,
	viewDLcallLambda
);

export { router as view_route };
