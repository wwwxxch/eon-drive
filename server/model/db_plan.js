import { pool } from "./connection.js";
// ================================================
const updateSpaceUsedByUser = async(user_id, time) => {
  const q_calculateSum = `
    SELECT SUM(b.size) AS total_size 
    FROM ff AS a INNER JOIN file_ver AS b ON a.id = b.ff_id
    WHERE a.is_delete = 0 AND b.is_current = 1 AND a.user_id = ?
    GROUP BY user_id
  `;
  const q_updateUsed = `
    UPDATE user SET used = ?, updated_at = ? WHERE id = ?
  `;
  const conn = await pool.getConnection();
  try {
    console.log("START TRANSACTION - updateSpaceUsedByUser");
    await conn.query("START TRANSACTION");
    
    const [ff] = await conn.query(q_calculateSum, user_id);
    console.log("q_calculateSum: ", ff[0].total_size);

    const [user] = await conn.query(q_updateUsed, [ff[0].total_size, time, user_id]);
    console.log("q_updateUsed: affectedRows: ", user.affectedRows);
    
    await conn.commit();
    console.log("COMMIT");
    return ff[0].total_size;

  } catch (e) {
    await conn.query("ROLLBACK");
    console.log("ROLLBACK - error: ", e);
    return -1;

  } finally {
    await conn.release();
    console.log("RELEASE CONNECTION");
  }
};

export { 
  updateSpaceUsedByUser
};
