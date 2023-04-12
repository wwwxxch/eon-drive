import express from "express";
const router = express.Router();

import { authentication } from "../../controller/user/user_auth_controller.js";
import { deleteDB } from "../../controller/ff/file_delete_controller.js";
// ------------------------------------------------------------------------------------
router.post("/v2/delete", authentication, deleteDB);

export { router as file_delete_route_v2 };
