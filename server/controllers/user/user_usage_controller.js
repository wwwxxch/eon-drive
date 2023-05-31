import { CustomError } from "../../utils/custom_error.js";
import { getProfile } from "../../models/db_user.js";
// ===================================================================================
const returnUsage = async (req, res, next) => {
	const profile = await getProfile(req.session.user.id);
	if (!profile) {
		return next(CustomError.internalServerError());
	}
	const { allocated, used } = profile;
	return res.json({
		allocated,
		used,
	});
};

export { returnUsage };
