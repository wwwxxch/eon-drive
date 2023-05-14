import express from "express";
const router = express.Router();
// TODO: wrapAsync !!! use or not ?
import { wrapAsync } from "../../utils/utils.js";
import {
	deleteValid,
	permDeleteValid,
	ValidCB,
} from "../../middlewares/input_validator.js";
import { deleteDB, permDelete } from "../../controllers/files/files_delete_controller.js";
import { authentication } from "../../middlewares/auth_check.js";
// ------------------------------------------------------------------------------------
router.delete("/files", authentication, deleteValid, ValidCB, deleteDB);

router.delete("/trash-files", authentication, permDeleteValid, ValidCB, permDelete);

export { router as files_delete_route };
