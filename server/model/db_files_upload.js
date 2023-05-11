import { pool } from "./connection.js";
// ======================================================================================
const createFolder = async (parent_id, folder_name, user_id, token, time) => {
	try {
		const [ff] = await pool.query(
			`
      INSERT INTO ff 
      (parent_id, name, type, user_id, ff_upd_status, upd_token, created_at, updated_at)
      VALUES (?, ?, "folder", ?, "new_upload", ?, ?, ?)
    `,
			[parent_id, folder_name, user_id, token, time, time]
		);

		return ff.insertId;
	} catch (e) {
		console.error("createFolder: ", e);
		return -1;
	}
};

const createFile = async (parent_id, file_name, file_size, user_id, token, time) => {
	const conn = await pool.getConnection();
	try {
		console.log("START TRANSACTION - createFile");
		await conn.query("START TRANSACTION");

		const [ff] = await conn.query(
			`
      INSERT INTO ff 
      (parent_id, name, type, user_id, ff_upd_status, upd_token, created_at, updated_at)
      VALUES (?, ?, "file", ?, "new_upload", ?, ?, ?)
    `,
			[parent_id, file_name, user_id, token, time, time]
		);
		const ff_id = ff.insertId;

		const [file_ver] = await conn.query(
			`
      INSERT INTO file_ver 
      (ff_id, ver_upd_status, upd_token, ver, size, is_current, updated_at, operation) 
      VALUES (?, "new_upload", ?, ?, ?, ?, ?, ?)
    `,
			[ff_id, token, 1, file_size, 1, time, "added"]
		);

		await conn.commit();
		console.log("COMMIT");
		return { ff_id, new_ver: 1 };
	} catch (e) {
		await conn.query("ROLLBACK");
		console.error("ROLLBACK - error: ", e);
		return null;
	} finally {
		await conn.release();
		console.log("RELEASE CONNECTION");
	}
};

const changeFolderDeleteStatus = async (del_status, folder_id, token, time) => {
	try {
		const [row] = await pool.query(
			`
      UPDATE ff SET 
        is_delete = ?, 
        ff_upd_status = "del_upload", 
        upd_token = ?, 
        updated_at = ? 
      WHERE id = ? 
    `,
			[del_status, token, time, folder_id]
		);
		return row;
	} catch (e) {
		console.error("changeFolderDeleteStatus: ", e);
		return null;
	}
};

const updateDeletedFile = async (del_status, token, file_id, file_size, time) => {
	const conn = await pool.getConnection();
	try {
		console.log("START TRANSACTION - updateDeletedFile");
		await conn.query("START TRANSACTION");

		// change is_delete, upd_status, token
		const [ff] = await conn.query(
			`
      UPDATE ff 
      SET is_delete = ?, ff_upd_status = "del_upload", upd_token = ?, updated_at = ? 
      WHERE id = ? 
    `,
			[del_status, token, time, file_id]
		);

		// find the largest version
		const [max_ver] = await conn.query(
			`
      SELECT max(ver) AS max_ver FROM file_ver WHERE ff_id = ?
    `,
			file_id
		);

		// get current version
		// const [cur_ver] = await conn.query(
		// 	`
		//   SELECT ver FROM file_ver WHERE ff_id = ? AND is_current = 1 AND ver_upd_status = "done"
		// `,
		// 	file_id
		// );

		// set ver = largest version + 1
		const [new_rec] = await conn.query(
			`
      INSERT INTO file_ver (ff_id, ver, ver_upd_status, upd_token, size, 
        updated_at, is_current,  operation) 
      VALUES (?, ?, "del_upload", ?, ?, ?, 1, "added")
    `,
			[file_id, max_ver[0].max_ver + 1, token, file_size, time]
		);

		// set is_current = 0 for current version // - this one should be done when committed
		// const [chg_is_cur] = await conn.query(
		// 	`
		//   UPDATE file_ver SET is_current = 0 WHERE ff_id = ? AND ver = ?
		// `,
		// 	[file_id, cur_ver[0].ver]
		// );

		await conn.commit();
		console.log("COMMIT");
		return { new_ver: max_ver[0].max_ver + 1 };
	} catch (e) {
		await conn.query("ROLLBACK");
		console.log("ROLLBACK - error: ", e);
		return null;
	} finally {
		await conn.release();
		console.log("RELEASE CONNECTION");
	}
};

const updateExistedFile = async (token, file_id, file_size, time) => {
	const conn = await pool.getConnection();
	try {
		console.log("START TRANSACTION");
		await conn.query("START TRANSACTION");

		// change upd_status, token, updated_at
		const [ff] = await conn.query(
			`
      UPDATE ff SET ff_upd_status = "ex_upload", upd_token = ?, updated_at = ? 
      WHERE id = ? 
    `,
			[token, time, file_id]
		);

		// find the largest version
		const [max_ver] = await conn.query(
			`
      SELECT max(ver) AS max_ver FROM file_ver WHERE ff_id = ?
    `,
			file_id
		);

		// get current version
		// const [cur_ver] = await conn.query(
		// 	`
		//   SELECT ver FROM file_ver WHERE ff_id = ? AND is_current = 1 AND ver_upd_status = "done"
		// `,
		// 	file_id
		// );

		// set ver = largest version + 1
		const [new_rec] = await conn.query(
			`
      INSERT INTO file_ver 
      (ff_id, ver, ver_upd_status, upd_token, size, 
        updated_at, is_current, operation) 
      VALUES 
      (?, ?, "ex_upload",?, ?, 
        ?, 1, "updated")
    `,
			[file_id, max_ver[0].max_ver + 1, token, file_size, time]
		);

		// set is_current = 0 for current version // - this one should be done when committed
		// const [chg_is_cur] = await conn.query(
		// 	`
		//   UPDATE file_ver SET is_current = 0 WHERE ff_id = ? AND ver = ?
		// `,
		// 	[file_id, cur_ver[0].ver]
		// );

		await conn.commit();
		console.log("COMMIT");
		return { new_ver: max_ver[0].max_ver + 1 };
	} catch (e) {
		await conn.query("ROLLBACK");
		console.log("ROLLBACK - error: ", e);
		return null;
	} finally {
		await conn.release();
		console.log("RELEASE CONNECTION");
	}
};

export { createFolder, createFile, changeFolderDeleteStatus, updateDeletedFile, updateExistedFile };
