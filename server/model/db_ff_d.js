import { pool } from "./connection.js";
// ==========================================
const markDeleteById = async(id) => {
  const q_string = `
    UPDATE ff SET is_delete = 1 WHERE id = ?
  `;
  const [row] = await pool.query(q_string, id);
  return row;
};

export { markDeleteById };