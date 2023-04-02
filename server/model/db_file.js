import { pool } from "./connection.js";
// ----------------------------------------------------------
const getDirId = async (parentId, dirName) => {
  // console.log(`getDIrId: parentId=${parentId} dirName=${dirName}`);
  const [row] = await pool.query(`
    SELECT id FROM file WHERE parent_id = ? AND name = ? AND type = 'folder'
  `, [parentId, dirName]);
  return row;
};

const saveMetadata = async(parentId, name, type, size) => {
  const [row] = await pool.query(`
    INSERT INTO file (parent_id, name, type, size) VALUES (?, ?, ?, ?) 
  `, [parentId, name, type, size]);
  return row;
};

const getFileList = async(parentId) => {
  const [row] = await pool.query(`
    SELECT id, name, type, size, updated_at FROM file WHERE parent_id = ?
  `, parentId);
  return row;
};

export {
  getDirId,
  saveMetadata,
  getFileList
};
