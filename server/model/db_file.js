import { pool } from "./connection.js";

// ----------------------------------------------------------
const saveFileInfo = async(input) => {
  const [row] = await pool.query(`
    INSERT INTO file_info (level, name, size, type) VALUES (?, ?, ?, ?)
  `, input);
  return row;
};

const getFileList = async(level) => {
  const [row] = await pool.query(`
    SELECT name, updated FROM file_info WHERE level = ?
  `, level);
  return row;
};

export {
  saveFileInfo
};