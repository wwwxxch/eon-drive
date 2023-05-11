const authentication = (req, res, next) => {
	if (!req.session.user) {
		return res.status(401).json({ error: "Unauthorized" });
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
