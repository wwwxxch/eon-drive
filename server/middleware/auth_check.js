import { CustomError } from "../error/custom_error.js";
// ============================================================
const authentication = (req, res, next) => {
	if (!req.session.user) {
		return next(new CustomError.unauthorized());
	}
	next();
};

const loginRedirect = (req, res, next) => {
	if (req.session.user) {
		return res.redirect("/home");
	}
	next();
};

const pageAuth = (req, res, next) => {
	if (!req.session.user) {
		return res.redirect("/");
	}
	next();
};

export { authentication, loginRedirect, pageAuth };
