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
  
  // TODO: error handling
  return true;
};

export { updateUsed };
