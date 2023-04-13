import { pool } from "./connection.js";
// ==========================================
const markDeleteById = async(time, id) => {
  const conn = await pool.getConnection();
  try {
    console.log("START TRANSACTION");
    await conn.query("START TRANSACTION");

    const ff = await conn.query(`
      UPDATE ff SET is_delete = 1, updated_at = ? WHERE id = ?
    `, [time, id]);
    
    const delete_rec = await conn.query(`
      INSERT INTO ff_delete (ff_id, deleted_at) VALUES (?, ?)
    `, [id, time]);

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
