import express from "express";
const router = express.Router();

import { 
  signUp,
  signIn,
  logOut,
  showProfile,
  authentication
} from "../../controller/user/user_auth_controller.js";

// ======================================

// TODO: missing validation

router.post("/signup", signUp);

router.post("/signin", signIn);

router.get("/logout", /*authentication,*/ logOut);

router.get("/show-profile", authentication, showProfile);

// router.get("/login-status", loginStatus);

export { router as user_auth_route };
