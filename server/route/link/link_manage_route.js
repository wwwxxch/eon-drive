import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";

import { authentication } from "../../controller/user/user_auth_controller.js";

import {
	privateLink,
	publicLink,
} from "../../controller/link/link_create_controller.js";
import { revokeLink } from "../../controller/link/link_revoke_controller.js";
import { getPossibleUser } from "../../model/db_user.js";
// --------------------------------------------------------------------------------
router.post("/create-link", authentication, publicLink, privateLink);

router.post("/revoke-link", authentication, revokeLink);

router.get("/select-user", authentication, async(req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.json({ msg: "q is missing" });
  } 

  const possibleEmail = await getPossibleUser(q);
  
  return res.json({ list: possibleEmail });
});

export { router as link_manage_route };
