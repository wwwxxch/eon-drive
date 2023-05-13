import { pool } from "./connection.js";
// ================================================
const updateSpaceUsedByUser = async (user_id, time) => {
	const q_calculateSum = `
    SELECT SUM(b.size) AS total_size 
    FROM files AS a INNER JOIN file_ver AS b 
    ON a.id = b.files_id
    WHERE a.files_upd_status = "done" AND a.is_delete = 0 
      AND b.is_current = 1 AND b.ver_upd_status = "done" 
      AND a.user_id = ?
    GROUP BY user_id
  `;
	const q_updateUsed = `
    UPDATE user SET used = ?, updated_at = ? WHERE id = ?
  `;
	const conn = await pool.getConnection();
	try {
		console.log("START TRANSACTION - updateSpaceUsedByUser");
		await conn.query("START TRANSACTION");

		const [files] = await conn.query(q_calculateSum, user_id);
		let total_size;
		if (files.length === 0) {
			total_size = 0;
		} else {
			total_size = files[0].total_size;
		}
		// console.log("q_calculateSum: ", files[0].total_size);

		const [user] = await conn.query(q_updateUsed, [total_size, time, user_id]);
		console.log("q_updateUsed: affectedRows: ", user.affectedRows);

		await conn.commit();
		console.log("COMMIT");
		return total_size;
	} catch (e) {
		await conn.query("ROLLBACK");
		console.log("ROLLBACK - error: ", e);
		return -1;
	} finally {
		await conn.release();
		console.log("RELEASE CONNECTION");
	}
};

// TODO: check if below functions is required

// const checkUsedByUser = async (user_id) => {
// 	const q_calculateSum = `
//     SELECT SUM(b.size) AS total_size
//     FROM files AS a INNER JOIN file_ver AS b
//     ON a.id = b.files_id
//     WHERE a.files_upd_status = "done" AND a.is_delete = 0
//       AND b.is_current = 1 AND b.ver_upd_status = "done"
//       AND a.user_id = ?
//     GROUP BY user_id
//   `;
// 	const [row] = await pool.query(q_calculateSum, user_id);
// 	if (row.length === 0) {
// 		return 0;
// 	}
// 	return row[0].total_size;
// };

// const updateUsedByUser = async (user_id, used, time) => {
// 	const q_updateUsed = `
//     UPDATE user SET used = ?, updated_at = ? WHERE id = ?
//   `;
// 	const [row] = await pool.query(q_updateUsed, [used, time, user_id]);
// 	return row.affectedRows;
// };

export { updateSpaceUsedByUser /*checkUsedByUser, updateUsedByUser*/ };
