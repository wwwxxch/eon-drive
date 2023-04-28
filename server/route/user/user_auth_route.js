import express from "express";
const router = express.Router();

import { signupValid, signinValid, ValidCB } from "../../middleware/input_validator.js";

import { 
  signUp,
  signIn,
  logOut,
  showProfile,
  authentication
} from "../../controller/user/user_auth_controller.js";

// ======================================

router.post("/signup", signupValid, ValidCB, signUp);

router.post("/signin", signinValid, ValidCB, signIn);

router.get("/logout", /*authentication,*/ logOut);

router.get("/show-profile", authentication, showProfile);

export { router as user_auth_route };
