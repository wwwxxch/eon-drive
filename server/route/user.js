import express from "express";
const router = express.Router();

import { 
  signUp,
  signIn,
  logOut,
  showProfile,
  loginStatus 
} from "../controller/user_auth.js";

// ======================================

// missing validation
router.post("/signup", signUp);

router.post("/signin", signIn);

router.get("/logout", logOut);

router.get("/profile", showProfile);

router.get("/login-status", loginStatus);

export { router as user };
