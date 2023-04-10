import { pool } from "./connection.js";
// ----------------------------------------------------------
const getDirId = async (userId, parentId, dirName) => {
  // console.log(`getDirId: parentId=${parentId} dirName=${dirName}`);
  const [row] = await pool.query(`
    SELECT id FROM file WHERE user_id = ? AND parent_id = ? AND name = ? AND type = 'folder'
  `, [userId, parentId, dirName]);
  return row;
};

const saveMetadata = async(userId, parentId, name, type, size, token) => {
  const [row] = await pool.query(`
    INSERT INTO file (parent_id, name, type, size, user_id, status, token) 
    VALUES (?, ?, ?, ?, ?, ?, ?) 
  `, [parentId, name, type, size, userId, "pending", token]);
  return row;
};

const updMetadata = async(userId, parentId, name, type, size, token) => {
  const [row] = await pool.query(`
    UPDATE file SET size = ?, status = "pending", token = ? 
    WHERE user_id = ? AND parent_id = ? AND name = ? AND type = 'file'
  `, [size, token, userId, parentId, name, type]);
  return row;
};

const commitMetadata = async(userId, status, token) => {
  const [row] = await pool.query(`
    UPDATE file SET status = ?, token = NULL
    WHERE user_id = ? AND token = ?
  `, [status, userId, token]);
  return row;
};

// TODO: user_id is not required here, since parent_id should not be repeated
const getFileList = async(userId, parentId) => {
  const [row] = await pool.query(`
    SELECT id, name, type, size, updated_at FROM file WHERE user_id = ? AND parent_id = ?
  `, [userId, parentId]);
  return row;
};

const getOneLevelList = async(parentId) => {
  const [row] = await pool.query(`
    SELECT id, name, type, size, updated_at FROM file WHERE parent_id = ?
  `, parentId);
  return row;
};

const getFileId = async(userId, parentId, fileName) => {
  const [row] = await pool.query(`
    SELECT id FROM file WHERE user_id = ? AND parent_id = ? AND name = ? AND type = 'file'
  `, [userId, parentId, fileName]);
  console.log("getFileId: ", row);
  return row;
};

const getFileOrDirId = async(userId, parentId, name, type) => {
  const [row] = await pool.query(`
    SELECT id FROM file WHERE user_id = ? AND parent_id = ? AND name = ? AND type = ?
  `, [userId, parentId, name, type]);
  return row;
};

const deleteById = async(userId, id) => {
  const [row] = await pool.query(`
    DELETE FROM file WHERE user_id = ? AND id = ?
  `, [userId, id]);
  console.log("file deleted: row.affectedRows: ", row.affectedRows);
  return row;
};

const getOneLevelChild = async(userId, parentId) => {
  const [row] = await pool.query(`
    SELECT id, type FROM file WHERE user_id = ? AND parent_id = ?
  `, [userId, parentId]);
  console.log("getOneLevelChild: ", row);
  return row;
};

const getDetail = async(id) => {
  const [row] = await pool.query(`
    SELECT a.name, a.size, a.created_at, a.updated_at, b.name as owner
    FROM 
      ( SELECT 
          id, name, size, created_at, updated_at, user_id 
        FROM file WHERE id = ?
      ) AS a INNER JOIN user AS b ON a.user_id = b.id
  `, id);

  return row;
};

export {
  getDirId,
  saveMetadata,
  updMetadata,
  commitMetadata,
  getFileList,
  getOneLevelList,
  getFileId,
  deleteById,
  getOneLevelChild,
  getFileOrDirId,
  getDetail
};
