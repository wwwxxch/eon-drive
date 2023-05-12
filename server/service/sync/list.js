import { getFileListByPath, findParentPathByFilesId } from "../path/iter.js";
import {
	getDeletedList,
	getVersionsByFileId,
	getDeleteRecordsByFileId,
} from "../../model/db_files_read.js";
import { getLinksSharedNotice, getLinksYouShared } from "../../model/db_share.js";
// =============================================================================
const emitNewList = async (io, userId, parentPath) => {
	console.log("emitNewList");
	const refresh = await getFileListByPath(userId, parentPath);

	io.to(`user_${userId}`).emit("listUpdate", {
		parentPath: parentPath,
		list: refresh,
	});
};

const emitHistoryList = async (io, userId, fileId) => {
	console.log("emitHistoryList");
	const versions = await getVersionsByFileId(userId, fileId);
	// console.log("versions", versions);
	if (versions.length === 0) {
		return;
	}
	const deleteRecords = await getDeleteRecordsByFileId(userId, fileId);
	// console.log("deleteRecords: ", deleteRecords);

	io.to(`user_${userId}`).emit("historyUpdate", {
		fileId,
		versions,
		deleteRecords,
	});
};

const emitTrashList = async (io, userId) => {
	console.log("emitTrashList");
	const deleted = await getDeletedList(userId);
	if (!deleted) {
		return;
	}

	const { all, folders } = deleted;
	const folderIdList = folders.map((item) => item.id);
	const trashList = [];
	all.forEach((item) => {
		if (!folderIdList.includes(item.parent_id)) trashList.push(item);
	});
	// console.log("trashList: ", trashList);

	for (let i = 0; i < trashList.length; i++) {
		// const parentPath = await findParentPathByFilesId(trashList[i].id);
		trashList[i].parentPath = await findParentPathByFilesId(trashList[i].id);
	}

	io.to(`user_${userId}`).emit("trashUpdate", {
		list: trashList,
	});
};

const emitUsage = async (io, userId, userInSession) => {
	console.log("emitUsage");

	const allocated = userInSession.allocated;
	const used = userInSession.used;
	io.to(`user_${userId}`).emit("usageUpdate", {
		allocated,
		used,
	});
};

const emitShareNotice = async (io, userId) => {
	console.log("emitShareNotice");
	const unreadNotice = await getLinksSharedNotice(userId, 0);
	// console.log(unreadNotice);
	// console.log(5 - unreadNotice.length);

	const readNotice =
		unreadNotice.length < 5 ? await getLinksSharedNotice(userId, 1, 5 - unreadNotice.length) : [];

	const notiToFE = [...unreadNotice, ...readNotice];

	io.to(`user_${userId}`).emit("shareNotice", {
		data: notiToFE,
		unreadNum: unreadNotice.length,
	});
};

const emitLinksYouShared = async (io, userId) => {
	console.log("emitLinksYouShared");
	const raw = await getLinksYouShared(userId);

	const list = raw.reduce((acc, cur) => {
		const existed = acc.find((item) => item.files_id === cur.files_id);
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

	io.to(`user_${userId}`).emit("linksYouSharedUpdate", {
		data: list,
	});
};

export {
	emitNewList,
	emitHistoryList,
	emitTrashList,
	emitUsage,
	emitShareNotice,
	emitLinksYouShared,
};
