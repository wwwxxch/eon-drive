import express from "express";
const router = express.Router();

import { authentication } from "../../controller/user/user_auth_controller.js";
import { deleteDB, permDelete } from "../../controller/ff/file_delete_controller.js";
// ------------------------------------------------------------------------------------
router.post("/delete", authentication, deleteDB);

router.post("/perm-delete", authentication, permDelete);

export { router as file_delete_route };
