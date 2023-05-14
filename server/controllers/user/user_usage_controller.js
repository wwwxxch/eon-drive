import { CustomError } from "../../utils/custom_error.js";
// import { generateCurrentTime } from "../../utils/utils.js";
// import { checkUsedByUser, updateUsedByUser } from "../../models/db_plan.js";

// ===================================================================================
const returnUsage = async (req, res, next) => {
	const allocated = req.session.user.allocated;
	const used = req.session.user.used;
	if (typeof used === "undefined" || used === null || !allocated) {
		return next(new CustomError.internalServerError());
	}
	return res.json({
		allocated,
		used,
	});
	// const userId = req.session.user.id;
	// const allocated = req.session.user.allocated;
	// const used = req.session.user.used;

	// const currentUsed = await checkUsedByUser(userId);
	// if (currentUsed === used) {
	// 	return res.json({
	// 		allocated,
	// 		used,
	// 	});
	// }

	// const nowTime = generateCurrentTime();
	// await updateUsedByUser(userId, currentUsed, nowTime);
	// req.session.user.used = currentUsed;
	// return res.json({
	// 	allocated,
	// 	used: currentUsed,
	// });
};

export { returnUsage };
