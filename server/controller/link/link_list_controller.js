import { customError } from "../../error/custom_error.js";
import {
	getLinksSharedWithYou,
	getLinksYouShared,
	getFilesShareStatus,
} from "../../model/db_share.js";
// ====================================================================================
const showLinksSharedWith = async (req, res) => {
	const userId = req.session.user.id;
	const list = await getLinksSharedWithYou(userId);

	return res.json({ data: list });
};

const showLinksYouShared = async (req, res) => {
	const userId = req.session.user.id;
	const raw = await getLinksYouShared(userId);

	const list = raw.reduce((acc, cur) => {
		// acc - accumulated array, start from []
		// check if there's element.ff_id equals to acc element.ff_id
		// return: The first element in the array that satisfies the provided testing function
		const existed = acc.find((item) => item.ff_id === cur.ff_id);
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
				ff_id: cur.ff_id,
				ff_name: cur.ff_name,
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
	const { fileId } = req.query;
	const userId = req.session.user.id;

	const raw = await getFilesShareStatus(userId, fileId);
	console.log(raw);

	if (raw.length < 1) {
		// return res.status(400).json({ msg: "error" });
		return next(customError.badRequest("This file/folder may not exist."));
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

export { showLinksSharedWith, showLinksYouShared, showCurrentACL };
