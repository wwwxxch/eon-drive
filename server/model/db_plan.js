import { pool } from "./connection.js";
// ================================================
const updateUsed = async (userId) => {
  const q1 = `
    SELECT SUM(size) AS total_size FROM file WHERE user_id = ? GROUP BY user_id
  `;
  const [file] = await pool.query(q1, userId);
  console.log("updateUsed: current used capcity: ", file);
  
  const q2 = `
    UPDATE user SET used = ? WHERE id = ?
  `;
  const [row] = await pool.query(q2, [file[0].total_size, userId]);
  
  console.log("updateUsed: update user table: ", row.affectedRows);
  
  return true;
};

const updSpaceUsed = async (user_id, time) => {
  const q_calculateSum = `
    SELECT SUM(c.size) AS total_size
    FROM (SELECT ff_id, user_id FROM perm WHERE user_id = ? AND auth in ("owner", "write")) AS a 
    INNER JOIN (SELECT id, is_delete FROM ff WHERE is_delete = 0) AS b 
      ON a.ff_id = b.id
    INNER JOIN (SELECT ff_id, size, is_current FROM file_ver WHERE is_current = 1) AS c 
      ON a.ff_id = c.ff_id 
    GROUP BY user_id
  `;
  const q_updateUsed = `
    UPDATE user SET used = ?, updated_at = ? WHERE id = ?
  `;

  const conn = await pool.getConnection();
  try {
    console.log("START TRANSACTION");
    await conn.query("START TRANSACTION");
    
    const [ff] = await conn.query(q_calculateSum, user_id);
    if (ff.length !== 1) {
      throw new Error("q_calculateSum - sth wrong");
    }
    console.log("q_calculateSum: ", ff[0].total_size);
    
    const [upd] = await conn.query(q_updateUsed, [ff[0].total_size, time, user_id]);
    console.log("q_updateUsed: affectedRows: ", upd.affectedRows);
    if (upd.affectedRows !== 1) {
      throw new Error("q_updateUsed - sth wrong");
    }
    
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
  updateUsed,
  updSpaceUsed 
};
