import { pool } from "./connection.js";
// ==========================================
const markDeleteById = async(time, id, user_id) => {
  const conn = await pool.getConnection();
  try {
    console.log("START TRANSACTION");
    await conn.query("START TRANSACTION");

    const ff = await conn.query(`
      UPDATE ff SET is_delete = 1, updated_at = ? WHERE id = ?
    `, [time, id]);
    
    const file_ver = await conn.query(`
      UPDATE file_ver SET updated_at = ?, user_id = ?, operation = "delete"
      WHERE ff_id = ? AND is_current = 1
    `, [time, user_id, id]);

    await conn.commit();
    console.log("COMMIT");
    return 1;

  } catch (e) {
    await conn.query("ROLLBACK");
    console.log("ROLLBACK - error: ", e);
    return -1;
    
  } finally {
    await conn.release();
    console.log("RELEASE CONNECTION");
  }
};

export { markDeleteById };
