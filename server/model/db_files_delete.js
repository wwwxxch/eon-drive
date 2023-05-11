import { pool } from "./connection.js";
// ================================================================================
const markDeleteById = async (time, id, user_id) => {
	const conn = await pool.getConnection();
	try {
		console.log("START TRANSACTION - markDeleteById");
		await conn.query("START TRANSACTION");

		const [files] = await conn.query(
			`
      UPDATE files 
      SET is_delete = 1, share_token = null, is_public = 0, updated_at = ? 
      WHERE id = ? AND user_id = ?
    `,
			[time, id, user_id]
		);
		if (files.affectedRows !== 1) {
			throw new Error("files.affectedRows !== 1");
		}

		const [share_link_perm] = await conn.query(
			`
      DELETE FROM share_link_perm WHERE files_id = ?
    `,
			id
		);

		const [delete_rec] = await conn.query(
			`
      INSERT INTO ff_delete (files_id, deleted_at) VALUES (?, ?)
    `,
			[id, time]
		);

		await conn.commit();
		console.log("COMMIT");
		return true;
	} catch (e) {
		await conn.query("ROLLBACK");
		console.error("ROLLBACK - error: ", e);
		return false;
	} finally {
		await conn.release();
		console.log("RELEASE CONNECTION");
	}
};

const permDeleteByFileId = async (file_id, user_id) => {
	const conn = await pool.getConnection();
	try {
		console.log("START TRANSACTION - permDeleteByFileId");
		await conn.query("START TRANSACTION");

		// confirm the delete request is from the owner
		const [checkOwner] = await conn.query(
			`
      SELECT id FROM files WHERE id = ? AND user_id = ? AND type = "file"
    `,
			[file_id, user_id]
		);

		if (checkOwner.length !== 1) {
			throw new Error("checkOwner.length !== 1");
		}

		const [delete_files] = await conn.query(
			`
      DELETE FROM files WHERE id = ?
    `,
			file_id
		);

		await conn.commit();
		console.log("COMMIT");
		return true;
	} catch (e) {
		await conn.query("ROLLBACK");
		console.error("ROLLBACK - error: ", e);
		return false;
	} finally {
		await conn.release();
		console.log("RELEASE CONNECTION");
	}
};

const permDeleteByFolderId = async (folder_id, user_id) => {
	const conn = await pool.getConnection();
	try {
		console.log("START TRANSACTION - permDeleteByFolderId");
		await conn.query("START TRANSACTION");

		// confirm the delete request is from the owner
		const [checkOwner] = await conn.query(
			`
      SELECT id FROM files WHERE id = ? AND user_id = ? AND type = "folder"
    `,
			[folder_id, user_id]
		);

		if (checkOwner.length !== 1) {
			throw new Error("checkOwner.length !== 1");
		}

		const [delete_files] = await conn.query(
			`
      DELETE FROM files WHERE id = ?
    `,
			folder_id
		);

		await conn.commit();
		console.log("COMMIT");
		return true;
	} catch (e) {
		await conn.query("ROLLBACK");
		console.error("ROLLBACK - error: ", e);
		return false;
	} finally {
		await conn.release();
		console.log("RELEASE CONNECTION");
	}
};

const deleteExpiredVersions = async (file_ver_id_arr) => {
	try {
		const [row] = await pool.query(
			`
      DELETE FROM file_ver WHERE id IN (?)
    `,
			[file_ver_id_arr]
		);
		return true;
	} catch (e) {
		console.log("deleteExpiredVersions - error: ", e);
		return false;
	}
};

const deleteExpiredDeletedRec = async (files_delete_id_arr) => {
	try {
		const [row] = await pool.query(
			`
      DELETE FROM files_delete WHERE id IN (?)
    `,
			[files_delete_id_arr]
		);
		return true;
	} catch (e) {
		console.log("deleteExpiredDeletedRec - error: ", e);
		return false;
	}
};

export {
	markDeleteById,
	permDeleteByFileId,
	permDeleteByFolderId,
	deleteExpiredVersions,
	deleteExpiredDeletedRec,
};
