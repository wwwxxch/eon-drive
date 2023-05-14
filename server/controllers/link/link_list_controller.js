import { CustomError } from "../../utils/custom_error.js";
import {
	getLinksSharedWithYou,
	getLinksYouShared,
	getFilesShareStatus,
} from "../../models/db_share.js";
// ====================================================================================
const showLinksSharedWithYou = async (req, res) => {
	const userId = req.session.user.id;
	const list = await getLinksSharedWithYou(userId);

	return res.json({ data: list });
};

const showLinksYouShared = async (req, res) => {
	const userId = req.session.user.id;
	const raw = await getLinksYouShared(userId);

	const list = raw.reduce((acc, cur) => {
		// acc - accumulated array, start from []
		// check if there's element.files_id equals to acc element.files_id
		// return: The first element in the array that satisfies the provided testing function
		const existed = acc.find((item) => item.files_id === cur.files_id);
		// console.log(existed); // undefined or that element (object)
		if (existed) {
			if (cur.user_name && cur.user_email) {
				existed.access.user.push({
					name: cur.user_name,
					email: cur.user_email,
				});
			}
		} else {
			const newObject = {
				files_id: cur.files_id,
				files_name: cur.files_name,
				link: cur.link,
				access: {
					is_public: cur.is_public,
					user: [],
				},
			};
			if (cur.user_name && cur.user_email) {
				newObject.access.user.push({
					name: cur.user_name,
					email: cur.user_email,
				});
			}
			acc.push(newObject);
		}
		return acc;
	}, []);

	return res.json({ data: list });
};

const showCurrentACL = async (req, res, next) => {
	const { filesId } = req.query;
	const userId = req.session.user.id;

	const raw = await getFilesShareStatus(userId, filesId);
	console.log(raw);

	if (raw.length < 1) {
		return next(CustomError.badRequest("This file/folder may not exist."));
	}

	const share_link = raw[0].share_token
		? raw[0].type === "folder"
			? `/view/fo/${raw[0].share_token}`
			: `/view/fi/${raw[0].share_token}`
		: null;
	const is_public = raw[0].is_public;
	const acl =
		raw[0].is_public === 1 || !raw[0].share_token
			? []
			: raw.map((item) => {
					return { name: item.name, email: item.email };
			  });

	return res.json({
		share_link,
		is_public,
		acl,
	});
};

export { showLinksSharedWithYou, showLinksYouShared, showCurrentACL };
