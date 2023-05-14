import express from "express";
const router = express.Router();

import { uuidv4Regex } from "../../constants/constants.js";

import { signupValid, signinValid, ValidCB } from "../../middlewares/input_validator.js";

import {
	signUp,
	signIn,
	logOut,
	showProfile,
	checkRegisterConfirmTokenJson,
	reSendConfirmationMailFromLink,
	reSendConfirmationMailFromLoginPage,
} from "../../controllers/user/user_auth_controller.js";

import { authentication } from "../../middlewares/auth_check.js";
import { rateLimiter } from "../../utils/rate_limiter.js";
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
