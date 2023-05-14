import { v4 as uuidv4 } from "uuid";

import { generateCurrentTime, preventXSS } from "../../utils/utils.js";

import { CustomError } from "../../utils/custom_error.js";

import {
	changeConfirmStatus,
	changeConfirmToken,
	checkMail,
	checkPair,
	createUser,
	getConfirmDetails,
	getProfile,
	getUser,
} from "../../models/db_user.js";

import dotenv from "dotenv";
dotenv.config();
const { S3_MAIN_BUCKET_NAME, S3_DOWNLOAD_BUCKET_NAME } = process.env;
const { CONFIRMATION_LINK_EXPIRED_HOUR } = process.env;

import { s3clientGeneral } from "../../services/s3/s3_client.js";
import { createS3Folder } from "../../services/s3/s3_create.js";

import { sendConfirmationMail } from "../../utils/mailersend.js";
// =====================================================================================
const signIn = async (req, res, next) => {
	const { email, password } = req.body;

	// check if the email matches the password
	const getPair = await checkPair(email, password);
	if (!getPair) {
		return next(CustomError.unauthorized("Your email and password do not match"));
	}

	// check if the account has been verified
	if (getPair.confirm_status === 0) {
		return res.json({ msg: "non-verified", lastConfirmedTime: getPair.confirmed_at });
	}

	// save user info to session
	const getUserRes = await getUser("email", email);

	req.session.user = {
		id: getUserRes.id,
		name: getUserRes.name,
		email: getUserRes.email,
		allocated: getUserRes.allocated,
		used: getUserRes.used,
	};

	return res.json({ msg: "ok" });
};

const signUp = async (req, res, next) => {
	const { name, email, password } = req.body;
	const modifiedName = preventXSS(name);

	// check if the email has been registered
	const getMail = await checkMail(email);
	if (getMail) {
		return next(CustomError.badRequest("Your email has been registered"));
	}

	// create user in DB
	const nowTime = generateCurrentTime();
	const confirmToken = uuidv4();
	const createUserRes = await createUser(
		email,
		password,
		modifiedName,
		nowTime,
		confirmToken
	);
	if (!createUserRes) {
		return next(CustomError.internalServerError());
	}

	// send the mail to user
	const sendMailRes = await sendConfirmationMail(email, modifiedName, confirmToken);
	if (sendMailRes.status === 500) {
		return next(CustomError.internalServerError());
	} else if (sendMailRes.status === 503) {
		return next(CustomError.serviceUnavailable());
	}

	return res.json({ msg: "ok" });
};

const checkRegisterConfirmTokenRender = async (req, res, next) => {
	const { confirmToken } = req.params;

	const confirmDetails = await getConfirmDetails(confirmToken);
	// confirmDetails key: id, email, name, confirmed_at
	console.log("confirmDetails: ", confirmDetails);

	if (!confirmDetails) {
		return res.status(404).render("error/error", {
			status: 404,
			message: "The pages you requested is not existed.",
		});
	}
	req.confirmDetails = confirmDetails;
	next();
};

const proceedRegistration = async (req, res, next) => {
	// const { confirmToken } = req.params;
	const { confirmDetails } = req;

	const confirmedDT = new Date(confirmDetails.confirmed_at);
	const currentDT = new Date(new Date().toUTCString());

	if (
		currentDT.getTime() - confirmedDT.getTime() >
		parseInt(CONFIRMATION_LINK_EXPIRED_HOUR) * 60 * 60 * 1000
	) {
		return res.render("visitor/expired");
	} else {
		// change confirm status
		const nowTime = generateCurrentTime();
		const changeAccountStatus = await changeConfirmStatus(nowTime, confirmDetails.id);
		if (!changeAccountStatus) {
			return res.status(500).render("error/error", {
				status: 500,
				message: "Something went wrong. Please contact the administrator.",
			});
		}

		// create blank folder in S3
		const createMain = await createS3Folder(
			s3clientGeneral,
			S3_MAIN_BUCKET_NAME,
			`user_${confirmDetails.id}`
		);
		const createDownload = await createS3Folder(
			s3clientGeneral,
			S3_DOWNLOAD_BUCKET_NAME,
			`user_${confirmDetails.id}`
		);
		console.log("createMain: ", createMain);
		console.log("createDownload: ", createDownload);

		if (!createMain || !createDownload) {
			return res.status(500).render("error/error", {
				status: 500,
				message: "Something went wrong. Please contact the administrator.",
			});
		}
	}

	return res.render("visitor/confirm");
};

const checkRegisterConfirmTokenJson = async (req, res, next) => {
	const { confirmToken } = req.params;

	const confirmDetails = await getConfirmDetails(confirmToken);
	// confirmDetails key: id, email, name, confirmed_at
	console.log("confirmDetails: ", confirmDetails);

	if (!confirmDetails) {
		return next(CustomError.notFound("The pages you requested is not existed."));
	}
	req.confirmDetails = confirmDetails;
	next();
};

const reSendConfirmationMailFromLink = async (req, res, next) => {
	// const { confirmToken } = req.params;
	const { confirmDetails } = req;

	// check confirmed_at
	const confirmedDT = new Date(confirmDetails.confirmed_at);
	const currentDT = new Date(new Date().toUTCString());

	if (
		currentDT.getTime() - confirmedDT.getTime() <=
		parseInt(CONFIRMATION_LINK_EXPIRED_HOUR) * 60 * 60 * 1000
	) {
		return res.json({
			msg: "not expired",
			lastConfirmedTime: confirmDetails.confirmed_at,
		});
	}

	// change token in DB
	const nowTime = generateCurrentTime();
	const newConfirmToken = uuidv4();

	const changeTokenInDB = await changeConfirmToken(
		confirmDetails.id,
		nowTime,
		newConfirmToken
	);
	// const changeTokenInDB = false;
	if (!changeTokenInDB) {
		return next(CustomError.internalServerError());
	}

	// send the mail
	const sendMailRes = await sendConfirmationMail(
		confirmDetails.email,
		confirmDetails.name,
		newConfirmToken
	);
	if (sendMailRes.status === 500) {
		return next(CustomError.internalServerError());
	} else if (sendMailRes.status === 503) {
		return next(CustomError.serviceUnavailable());
	}

	return res.json({ msg: "ok" });
};

const reSendConfirmationMailFromLoginPage = async (req, res, next) => {
	const { email, password } = req.body;

	// check if the email matches the password
	// getPair: id, email, name, confirm_status, confirmed_at,
	const getPair = await checkPair(email, password);
	if (!getPair) {
		return next(CustomError.unauthorized("Your email and password do not match"));
	}

	// check confirmed_at
	const confirmedDT = new Date(getPair.confirmed_at);
	const currentDT = new Date(new Date().toUTCString());
	if (
		currentDT.getTime() - confirmedDT.getTime() <=
		parseInt(CONFIRMATION_LINK_EXPIRED_HOUR) * 60 * 60 * 1000
	) {
		return res.json({
			msg: "not expired",
			lastConfirmedTime: getPair.confirmed_at,
		});
	}

	// change token in DB
	const nowTime = generateCurrentTime();
	const newConfirmToken = uuidv4();

	const changeTokenInDB = await changeConfirmToken(getPair.id, nowTime, newConfirmToken);
	// const changeTokenInDB = false;
	if (!changeTokenInDB) {
		return next(CustomError.internalServerError());
	}

	// send the mail
	const sendMailRes = await sendConfirmationMail(
		getPair.email,
		getPair.name,
		newConfirmToken
	);
	if (!sendMailRes) {
		return next(CustomError.internalServerError());
	}

	return res.json({ msg: "ok" });
};

const logOut = (req, res) => {
	req.session.destroy();
	return res.redirect("/");
};

const showProfile = async (req, res, next) => {
	const profile = await getProfile(req.session.user.id);
	// const profile = null;
	if (!profile) {
		return next(CustomError.internalServerError());
	}
	const { email, name, plan, allocated, used, created_at } = profile;

	return res.json({ email, name, plan, allocated, used, created_at });
};

export {
	signUp,
	signIn,
	checkRegisterConfirmTokenRender,
	proceedRegistration,
	checkRegisterConfirmTokenJson,
	reSendConfirmationMailFromLink,
	reSendConfirmationMailFromLoginPage,
	logOut,
	showProfile,
};
