import { v4 as uuidv4 } from "uuid";

import { generateCurrentTime, preventXSS } from "../../util/util.js";

import { CustomError } from "../../error/custom_error.js";

import {
	changeConfirmStatus,
	changeConfirmToken,
	chkmail,
	chkpair,
	createUser,
	getConfirmDetails,
	getProfile,
	getUser,
} from "../../model/db_user.js";

import dotenv from "dotenv";
dotenv.config();
const { S3_MAIN_BUCKET_NAME, S3_DOWNLOAD_BUCKET_NAME } = process.env;
const { CONFIRMATION_LINK_EXPIRED_HOUR } = process.env;

import { s3clientGeneral } from "../../service/s3/s3_client.js";
import { createS3Folder } from "../../service/s3/s3_create.js";

import { sendConfirmationMail } from "../../util/mailersend.js";
// =====================================================================================
const signIn = async (req, res, next) => {
	const { email, password } = req.body;

	// check if the email matches the password
	const getpair = await chkpair(email, password);
	if (!getpair) {
		return next(CustomError.unauthorized("Your email and password do not match"));
	}

	// check if the account has been verified
	if (getpair.confirm_status === 0) {
		return res.json({ msg: "non-verified", lastConfirmedTime: getpair.confirmed_at });
	}

	// save user info to session
	const getUserRes = await getUser("email", email);

	const user = {
		id: getUserRes.id,
		name: getUserRes.name,
		email: getUserRes.email,
		allocated: getUserRes.allocated,
		used: getUserRes.used,
	};
	req.session.user = user;

	return res.json({ msg: "ok" });
};

const signUp = async (req, res, next) => {
	const { name, email, password } = req.body;
	const modifiedName = preventXSS(name);

	// check if the email has been registered
	const getmail = await chkmail(email);
	if (getmail) {
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
	if (!sendMailRes) {
		return next(CustomError.internalServerError());
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
			message: "The page you requested is not existed.",
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
		return next(CustomError.notFound("The page you requested is not existed."));
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
	if (!sendMailRes) {
		return next(CustomError.internalServerError());
	}

	return res.json({ msg: "ok" });
};

const reSendConfirmationMailFromLoginPage = async (req, res, next) => {
	const { email, password } = req.body;

	// check if the email matches the password
	// getpair: id, email, name, confirm_status, confirmed_at,
	const getpair = await chkpair(email, password);
	if (!getpair) {
		return next(CustomError.unauthorized("Your email and password do not match"));
	}

	// check confirmed_at
	const confirmedDT = new Date(getpair.confirmed_at);
	const currentDT = new Date(new Date().toUTCString());
	if (
		currentDT.getTime() - confirmedDT.getTime() <=
		parseInt(CONFIRMATION_LINK_EXPIRED_HOUR) * 60 * 60 * 1000
	) {
		return res.json({
			msg: "not expired",
			lastConfirmedTime: getpair.confirmed_at,
		});
	}

	// change token in DB
	const nowTime = generateCurrentTime();
	const newConfirmToken = uuidv4();

	const changeTokenInDB = await changeConfirmToken(getpair.id, nowTime, newConfirmToken);
	// const changeTokenInDB = false;
	if (!changeTokenInDB) {
		return next(CustomError.internalServerError());
	}

	// send the mail
	const sendMailRes = await sendConfirmationMail(
		getpair.email,
		getpair.name,
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

const showProfile = async (req, res) => {
	const profile = await getProfile(req.session.user.id);
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
