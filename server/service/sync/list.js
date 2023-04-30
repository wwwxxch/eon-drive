import { getFileListByPath, findParentPathByFFId } from "../path/iter.js";
import {
	getDeletedList,
	getVersionsByFileId,
	getDeleteRecordsByFileId,
} from "../../model/db_ff_r.js";
import { getLinksSharedNoti, getLinksYouShared } from "../../model/db_share.js";
// =============================================================================
const emitNewList = async (io, userId, parentPath) => {
	const refresh = await getFileListByPath(userId, parentPath);
	// console.log("refresh: ", refresh);
  if (refresh.length === 0) {
    return;
  }
  
	io.to(`user_${userId}`).emit("listupd", {
		parentPath: parentPath,
		list: refresh,
	});
};

const emitHistoryList = async (io, userId, fileId) => {
	const versions = await getVersionsByFileId(fileId);
	// console.log("versions", versions);
  if (versions.length === 0) {
    return;
  }
	const deleteRecords = await getDeleteRecordsByFileId(fileId);
	// console.log("deleteRecords: ", deleteRecords);

	io.to(`user_${userId}`).emit("historyupd", {
		fileId,
		versions,
		deleteRecords,
	});
};

const emitTrashList = async (io, userId) => {
	const deleted = await getDeletedList(userId);
  if (!deleted) {
    return;
  }
	// console.log("deleted: ", deleted);

	const { all, folders } = deleted;
	const folderIdList = folders.map((item) => item.id);
	const trashList = [];
	all.forEach((item) => {
		if (!folderIdList.includes(item.parent_id)) trashList.push(item);
	});
	// console.log("trashList: ", trashList);

	for (let i = 0; i < trashList.length; i++) {
		const parentPath = await findParentPathByFFId(trashList[i].id);
		trashList[i].parentPath = parentPath;
	}

	io.to(`user_${userId}`).emit("trashupd", {
		list: trashList,
	});
};

const emitUsage = async (io, userId, userInSession) => {
	io.to(`user_${userId}`).emit("usageupd", {
		allocated: userInSession.allocated,
		used: userInSession.used,
	});
};

const emitShareNoti = async (io, userId) => {
	const unreadNoti = await getLinksSharedNoti(userId, 0);
	// console.log(unreadNoti);
	// console.log(5 - unreadNoti.length);

	const readNoti =
		unreadNoti.length < 5
			? await getLinksSharedNoti(userId, 1, 5 - unreadNoti.length)
			: [];

	const notiToFE = [...unreadNoti, ...readNoti];

	io.to(`user_${userId}`).emit("sharenoti", {
		data: notiToFE,
		unreadNum: unreadNoti.length,
	});
};

const emitLinksYouShared = async (io, userId) => {
	const raw = await getLinksYouShared(userId);

	const list = raw.reduce((acc, cur) => {
		const existed = acc.find((item) => item.ff_id === cur.ff_id);
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

	io.to(`user_${userId}`).emit("linksYouSharedUpd", {
		data: list
	});
};

export {
	emitNewList,
	emitHistoryList,
	emitTrashList,
	emitUsage,
	emitShareNoti,
  emitLinksYouShared
};
