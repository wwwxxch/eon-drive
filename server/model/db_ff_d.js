import { pool } from "./connection.js";
// ==========================================
const markDeleteById = async (time, id) => {
	const conn = await pool.getConnection();
	try {
		console.log("START TRANSACTION - markDeleteById");
		await conn.query("START TRANSACTION");

		const ff = await conn.query(
			`
      UPDATE ff 
      SET is_delete = 1, share_token = null, is_public = 0, updated_at = ? 
      WHERE id = ?
    `,
			[time, id]
		);

		const [share_link_perm] = await conn.query(
			`
      DELETE FROM share_link_perm WHERE ff_id = ?
    `,
			id
		);

		const delete_rec = await conn.query(
			`
      INSERT INTO ff_delete (ff_id, deleted_at) VALUES (?, ?)
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

const permDeleteByFileId = async (file_id) => {
	const conn = await pool.getConnection();
	try {
		console.log("START TRANSACTION - permDeleteByFileId");
		await conn.query("START TRANSACTION");

		// share_link_perm, file_ver, ff_delete, ff
		const delete_link = await conn.query(
			`
      DELETE FROM share_link_perm WHERE ff_id = ?
    `,
			file_id
		);

		const delete_file_ver = await conn.query(
			`
      DELETE FROM file_ver WHERE ff_id = ?
    `,
			file_id
		);

		const delete_ff_delete = await conn.query(
			`
      DELETE FROM ff_delete WHERE ff_id = ?
    `,
			file_id
		);

		const delete_ff = await conn.query(
			`
      DELETE FROM ff WHERE id = ?
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

const permDeleteByFolderId = async (folder_id) => {
	const conn = await pool.getConnection();
	try {
		console.log("START TRANSACTION - permDeleteByFolderId");
		await conn.query("START TRANSACTION");

		// share_link_perm, ff_delete, ff
		const delete_link = await conn.query(
			`
      DELETE FROM share_link_perm WHERE ff_id = ?
    `,
			folder_id
		);

		const delete_ff_delete = await conn.query(
			`
      DELETE FROM ff_delete WHERE ff_id = ?
    `,
			folder_id
		);

		const delete_ff = await conn.query(
			`
      DELETE FROM ff WHERE id = ?
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

const deleteExpiredDeletedRec = async (ff_delete_id_arr) => {
	try {
		const [row] = await pool.query(
			`
      DELETE FROM ff_delete WHERE id IN (?)
    `,
			[ff_delete_id_arr]
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
