import express from "express";
const router = express.Router();

import { uuidv4Regex } from "../../util/constant.js";

import { signupValid, signinValid, ValidCB } from "../../middleware/input_validator.js";

import {
	signUp,
	signIn,
	logOut,
	showProfile,
	checkRegisterConfirmTokenJson,
	reSendConfirmationMailFromLink,
	reSendConfirmationMailFromLoginPage,
} from "../../controller/user/user_auth_controller.js";

import { authentication } from "../../middleware/auth_check.js";
import { rateLimiter } from "../../util/rate_limiter.js";
// ======================================================================================

router.post("/signup", rateLimiter(1), signupValid, ValidCB, signUp);

router.get(
	`/resend-verify-mail/:confirmToken(${uuidv4Regex})`,
	rateLimiter(1),
	checkRegisterConfirmTokenJson,
	reSendConfirmationMailFromLink
);

router.post("/signin", signinValid, ValidCB, signIn);

router.post(
	"/resend-verify-mail/by-mail",
	rateLimiter(1),
	signinValid,
	ValidCB,
	reSendConfirmationMailFromLoginPage
);

router.get("/logout", logOut);

router.get("/profile", authentication, showProfile);

export { router as user_auth_route };
