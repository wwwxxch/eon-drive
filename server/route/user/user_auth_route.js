import express from "express";
const router = express.Router();

import { signupValid, signinValid, ValidCB } from "../../middleware/input_validator.js";

import { signUp, signIn, logOut, showProfile } from "../../controller/user/user_auth_controller.js";
import { authentication } from "../../middleware/auth_check.js";

// ======================================

router.post("/signup", signupValid, ValidCB, signUp);

router.post("/signin", signinValid, ValidCB, signIn);

router.get("/logout", /*authentication,*/ logOut);

router.get("/show-profile", authentication, showProfile);

export { router as user_auth_route };
