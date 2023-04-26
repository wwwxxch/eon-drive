import { body, validationResult } from "express-validator";

// ============================================================

const signupValid = [
	body("name").trim().isLength({ min: 1 }).withMessage("Name is required."),

	body("email")
		.trim()
		.isEmail()
		.withMessage("Email is not valid.")
		.normalizeEmail(),

	body("password")
		.isLength({ min: 8, max: 16 })
		.withMessage("Password should be 8-16 characters long.")
		.custom((value) => {
			const pwdregex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,16}$/;
			if (!value.match(pwdregex)) {
				throw new Error(
					"Password should have at least one digit, one lowercase letter or one uppercase letter, one of these characters: !@#$%^&*()_+ ."
				);
			}
			return true;
		})
];

const signinValid = [
	body("email")
		.trim()
		.isEmail()
		.withMessage("Email is not valid.")
		.normalizeEmail(),
    
  // TODO: use this validation rule when production
	// body("password").custom((value) => {
	// 	const pwdregex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,16}$/;
	// 	if (!value.match(pwdregex)) {
	// 		throw new Error("Password is not valid");
	// 	}
	// 	return true;
	// })
];

const ValidCB = async (req, res, next) => {
	const err = validationResult(req).formatWith(({ msg }) => msg);
	if (!err.isEmpty()) {
		res.status(400).json({ error: err.array() });
	} else {
		next();
	}
};

export { signupValid, signinValid, ValidCB };